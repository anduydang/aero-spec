use std::collections::{BTreeMap, HashMap};
use std::sync::Mutex;
use std::thread;
use std::time::Instant;

use chrono::{SecondsFormat, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sysinfo::{System, MINIMUM_CPU_UPDATE_INTERVAL};
use uuid::Uuid;

use super::model::{NvidiaGpu, WindowsInventory};
use super::nvidia::{assign_local_ids, collect_nvidia, GenerationState};
pub use super::single_flight::SingleFlight;
use super::windows::{collect_static_inventory, NormalizedInventory, ProviderDiagnostic};

const SCHEMA_VERSION: u8 = 2;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticSnapshotRequestV2 {
    pub schema_version: u8,
    pub generation: u64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DynamicSnapshotRequestV2 {
    pub schema_version: u8,
    pub generation: u64,
    pub inventory_generation: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderDiagnosticV2 {
    pub provider: String,
    pub status: String,
    pub captured_at: String,
    pub duration_ms: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SectionV2 {
    pub status: String,
    pub captured_at: String,
    pub duration_ms: u64,
    pub data: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub diagnostic: Option<ProviderDiagnosticV2>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticSnapshotResponseV2 {
    pub schema_version: u8,
    pub generation: u64,
    pub snapshot_id: String,
    pub captured_at: String,
    pub inventory: SectionV2,
    pub storage: SectionV2,
    pub pnp: SectionV2,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DynamicSnapshotResponseV2 {
    pub schema_version: u8,
    pub generation: u64,
    pub inventory_generation: u64,
    pub captured_at: String,
    pub dynamic: SectionV2,
    pub nvidia: SectionV2,
}

#[derive(Default)]
pub struct TelemetryRuntime {
    generation: Mutex<GenerationState>,
    static_collection: SingleFlight<NormalizedInventory>,
    dynamic_collection: Mutex<()>,
}

impl TelemetryRuntime {
    pub fn static_snapshot(
        &self,
        request: StaticSnapshotRequestV2,
    ) -> Result<StaticSnapshotResponseV2, String> {
        validate_schema(request.schema_version)?;
        let started = Instant::now();
        let normalized = self.static_collection.run(|| {
            collect_static_inventory().map_err(|error| process_code(error.code))
        })?;
        let duration_ms = elapsed_ms(started);
        let captured_at = now();
        let (response, identity_map) = build_static_response(
            request.generation,
            (*normalized).clone(),
            captured_at,
            duration_ms,
        );
        self.generation
            .lock()
            .map_err(|_| "STATIC_STATE_ERROR")?
            .accept_static(request.generation, identity_map);
        Ok(response)
    }

    pub fn dynamic_snapshot(
        &self,
        request: DynamicSnapshotRequestV2,
    ) -> Result<DynamicSnapshotResponseV2, String> {
        validate_schema(request.schema_version)?;
        let _only_collection = self.dynamic_collection.lock().map_err(|_| "DYNAMIC_STATE_ERROR")?;
        let (token, identity_map) = {
            let generation = self.generation.lock().map_err(|_| "DYNAMIC_STATE_ERROR")?;
            let token = generation
                .begin_dynamic(request.inventory_generation)
                .ok_or("INVENTORY_GENERATION_REJECTED")?;
            (token, generation.identity_map().clone())
        };

        let started = Instant::now();
        let cpu_load = collect_cpu_load();
        let dynamic_duration_ms = elapsed_ms(started);
        let dynamic_captured_at = now();

        let nvidia_started = Instant::now();
        let nvidia_result = collect_nvidia();
        let nvidia_duration_ms = elapsed_ms(nvidia_started);
        let nvidia_captured_at = now();

        if !self
            .generation
            .lock()
            .map_err(|_| "DYNAMIC_STATE_ERROR")?
            .finish_dynamic(&token)
        {
            return Err("INVENTORY_GENERATION_REJECTED".to_string());
        }

        let dynamic = match cpu_load {
            Some(load) => ok_section(json!({ "cpuLoadPercent": load }), dynamic_captured_at.clone(), dynamic_duration_ms),
            None => error_section("windows-dynamic", "DYNAMIC_QUERY_FAILED", "Windows CPU load is unavailable.", dynamic_captured_at.clone(), dynamic_duration_ms),
        };
        let nvidia = match nvidia_result {
            Ok(None) => SectionV2 { status: "unsupported".to_string(), captured_at: nvidia_captured_at.clone(), duration_ms: nvidia_duration_ms, data: None, diagnostic: None },
            Ok(Some(gpus)) => build_nvidia_section(gpus, &identity_map, nvidia_captured_at.clone(), nvidia_duration_ms),
            Err(_) => error_section("nvidia", "NVIDIA_QUERY_FAILED", "NVIDIA telemetry is unavailable.", nvidia_captured_at.clone(), nvidia_duration_ms),
        };
        Ok(DynamicSnapshotResponseV2 {
            schema_version: SCHEMA_VERSION,
            generation: request.generation,
            inventory_generation: request.inventory_generation,
            captured_at: std::cmp::max(dynamic_captured_at, nvidia_captured_at),
            dynamic,
            nvidia,
        })
    }
}

#[tauri::command]
pub fn get_static_snapshot_v2(
    request: StaticSnapshotRequestV2,
    state: tauri::State<'_, TelemetryRuntime>,
) -> Result<StaticSnapshotResponseV2, String> {
    state.static_snapshot(request)
}

#[tauri::command]
pub fn get_dynamic_snapshot_v2(
    request: DynamicSnapshotRequestV2,
    state: tauri::State<'_, TelemetryRuntime>,
) -> Result<DynamicSnapshotResponseV2, String> {
    state.dynamic_snapshot(request)
}

pub fn build_static_response(
    generation: u64,
    normalized: NormalizedInventory,
    captured_at: String,
    duration_ms: u64,
) -> (StaticSnapshotResponseV2, BTreeMap<String, String>) {
    let NormalizedInventory { inventory, diagnostics } = normalized;
    let (inventory_data, storage_data, pnp_data, identity_map) = wire_inventory(inventory, &diagnostics, &captured_at, duration_ms);
    let response = StaticSnapshotResponseV2 {
        schema_version: SCHEMA_VERSION,
        generation,
        snapshot_id: Uuid::new_v4().to_string(),
        captured_at: captured_at.clone(),
        inventory: section_for_scopes(inventory_data, &diagnostics, &["system", "cpu", "motherboard", "memory", "displayAdapters"], "windows-inventory", &captured_at, duration_ms),
        storage: section_for_scopes(storage_data, &diagnostics, &["storage"], "windows-storage", &captured_at, duration_ms),
        pnp: section_for_scopes(pnp_data, &diagnostics, &["networks", "pnp"], "windows-pnp", &captured_at, duration_ms),
    };
    (response, identity_map)
}

fn wire_inventory(
    inventory: WindowsInventory,
    diagnostics: &[ProviderDiagnostic],
    captured_at: &str,
    duration_ms: u64,
) -> (Value, Value, Value, BTreeMap<String, String>) {
    let mut identity_map = BTreeMap::new();
    let system = wire_single(inventory.system, "system:0");
    let cpu = wire_single(inventory.cpu, "cpu:0");
    let motherboard = wire_single(inventory.motherboard, "motherboard:0");
    let memory = wire_array("memory", inventory.memory_modules, &mut identity_map);
    let displays = wire_array("gpu", inventory.display_adapters, &mut identity_map);
    let storage = wire_array("disk", inventory.storage_devices, &mut identity_map);
    let networks = wire_array("network", inventory.networks, &mut identity_map);
    let pnp = wire_array("pnp", inventory.pnp_devices, &mut identity_map);

    let display_names = displays.as_array().cloned().unwrap_or_default();
    let mut name_counts = HashMap::new();
    for display in &display_names {
        if let Some(name) = display.get("name").and_then(Value::as_str) {
            *name_counts.entry(normalize(name)).or_insert(0_usize) += 1;
        }
    }
    for display in &display_names {
        let Some(local_id) = display.get("localId").and_then(Value::as_str) else { continue; };
        if let Some(bus) = display.get("pciBusId").and_then(Value::as_str) {
            identity_map.insert(format!("gpu-pci:{}", normalize_pci(bus)), local_id.to_string());
        }
        if let Some(name) = display.get("name").and_then(Value::as_str) {
            let key = normalize(name);
            if name_counts.get(&key) == Some(&1) { identity_map.insert(format!("gpu-name:{key}"), local_id.to_string()); }
        }
    }

    let inventory_value = json!({
        "system": leaf(system, diagnostics, "system", "windows-inventory", captured_at, duration_ms),
        "cpu": leaf(cpu, diagnostics, "cpu", "windows-inventory", captured_at, duration_ms),
        "motherboard": leaf(motherboard, diagnostics, "motherboard", "windows-inventory", captured_at, duration_ms),
        "memoryModules": leaf(Some(memory), diagnostics, "memory", "windows-inventory", captured_at, duration_ms),
        "displayAdapters": leaf(Some(displays), diagnostics, "displayAdapters", "windows-inventory", captured_at, duration_ms),
    });
    let storage_value = json!({ "devices": leaf(Some(storage), diagnostics, "storage", "windows-storage", captured_at, duration_ms) });
    let mut display_devices = Vec::new();
    let mut input_devices = Vec::new();
    let mut audio_devices = Vec::new();
    for device in pnp.as_array().cloned().unwrap_or_default() {
        match device.get("category").and_then(Value::as_str) {
            Some("display") => display_devices.push(device),
            Some("keyboard" | "pointing") => input_devices.push(device),
            Some("audio") => audio_devices.push(device),
            _ => {}
        }
    }
    let pnp_value = json!({
        "networks": leaf(Some(networks), diagnostics, "networks", "windows-pnp", captured_at, duration_ms),
        "displays": leaf(Some(Value::Array(display_devices)), diagnostics, "pnp", "windows-pnp", captured_at, duration_ms),
        "inputDevices": leaf(Some(Value::Array(input_devices)), diagnostics, "pnp", "windows-pnp", captured_at, duration_ms),
        "audioDevices": leaf(Some(Value::Array(audio_devices)), diagnostics, "pnp", "windows-pnp", captured_at, duration_ms),
    });
    (inventory_value, storage_value, pnp_value, identity_map)
}

fn wire_single<T: Serialize>(value: Option<T>, local_id: &str) -> Option<Value> {
    value.and_then(|value| serde_json::to_value(value).ok()).map(|mut value| {
        if let Some(object) = value.as_object_mut() { object.insert("localId".to_string(), Value::String(local_id.to_string())); }
        strip_nulls(&mut value);
        value
    })
}

fn wire_array<T: Serialize>(category: &str, values: Vec<T>, identity_map: &mut BTreeMap<String, String>) -> Value {
    let mut serialized = values.into_iter().filter_map(|value| serde_json::to_value(value).ok()).collect::<Vec<_>>();
    let identities = serialized.iter().map(|value| (
        value.get("privateKey").and_then(Value::as_str).unwrap_or_default().to_string(),
        value.get("name").or_else(|| value.get("model")).or_else(|| value.get("deviceLocator")).and_then(Value::as_str).unwrap_or_default().to_string(),
    )).collect::<Vec<_>>();
    let assigned = assign_local_ids(category, &identities);
    for (index, value) in serialized.iter_mut().enumerate() {
        if let Some(object) = value.as_object_mut() {
            if let Some(private_key) = object.remove("privateKey").and_then(|value| value.as_str().map(str::to_string)) {
                identity_map.entry(private_key).or_insert_with(|| assigned.local_ids[index].clone());
            }
            object.insert("localId".to_string(), Value::String(assigned.local_ids[index].clone()));
        }
        strip_nulls(value);
    }
    Value::Array(serialized)
}

fn leaf(data: Option<Value>, diagnostics: &[ProviderDiagnostic], scope: &str, provider: &str, captured_at: &str, duration_ms: u64) -> Value {
    let failure = diagnostics.iter().find(|diagnostic| diagnostic.category.as_deref() == Some(scope) && diagnostic.code == "QUERY_FAILED");
    match (data, failure) {
        (Some(data), None) => json!({ "status": "ok", "data": data }),
        (None, None) => json!({ "status": "unsupported", "data": null }),
        (_, Some(_)) => json!({
            "status": "error", "data": null,
            "diagnostic": diagnostic(provider, "error", "QUERY_FAILED", "A Windows inventory section could not be queried.", captured_at, duration_ms)
        }),
    }
}

fn section_for_scopes(data: Value, diagnostics: &[ProviderDiagnostic], scopes: &[&str], provider: &str, captured_at: &str, duration_ms: u64) -> SectionV2 {
    let failed = diagnostics.iter().any(|diagnostic| scopes.contains(&diagnostic.category.as_deref().unwrap_or_default()) && diagnostic.code == "QUERY_FAILED");
    SectionV2 { status: if failed { "partial" } else { "ok" }.to_string(), captured_at: captured_at.to_string(), duration_ms, data: Some(data), diagnostic: failed.then(|| diagnostic(provider, "partial", "QUERY_FAILED", "One or more Windows inventory sections are unavailable.", captured_at, duration_ms)) }
}

fn build_nvidia_section(gpus: Vec<NvidiaGpu>, identity_map: &BTreeMap<String, String>, captured_at: String, duration_ms: u64) -> SectionV2 {
    let mut wire = Vec::new();
    let mut unmatched = false;
    for gpu in gpus {
        let local_id = gpu.pci_bus_id.as_deref().and_then(|bus| identity_map.get(&format!("gpu-pci:{}", normalize_pci(bus)))).or_else(|| identity_map.get(&format!("gpu-name:{}", normalize(&gpu.name))));
        let Some(local_id) = local_id else { unmatched = true; continue; };
        if let Ok(mut value) = serde_json::to_value(gpu) {
            if let Some(object) = value.as_object_mut() { object.insert("localId".to_string(), Value::String(local_id.clone())); }
            strip_nulls(&mut value);
            wire.push(value);
        }
    }
    SectionV2 {
        status: if unmatched { "partial" } else { "ok" }.to_string(),
        captured_at: captured_at.clone(),
        duration_ms,
        data: Some(json!({ "gpus": wire })),
        diagnostic: unmatched.then(|| diagnostic("nvidia", "partial", "GPU_JOIN_AMBIGUOUS", "Some NVIDIA adapters could not be matched safely.", &captured_at, duration_ms)),
    }
}

fn ok_section(data: Value, captured_at: String, duration_ms: u64) -> SectionV2 { SectionV2 { status: "ok".to_string(), captured_at, duration_ms, data: Some(data), diagnostic: None } }
fn error_section(provider: &str, code: &str, message: &str, captured_at: String, duration_ms: u64) -> SectionV2 { SectionV2 { status: "error".to_string(), captured_at: captured_at.clone(), duration_ms, data: None, diagnostic: Some(diagnostic(provider, "error", code, message, &captured_at, duration_ms)) } }
fn diagnostic(provider: &str, status: &str, code: &str, message: &str, captured_at: &str, duration_ms: u64) -> ProviderDiagnosticV2 { ProviderDiagnosticV2 { provider: provider.to_string(), status: status.to_string(), captured_at: captured_at.to_string(), duration_ms, code: Some(code.to_string()), message: Some(message.to_string()) } }
fn collect_cpu_load() -> Option<f32> { let mut system = System::new(); system.refresh_cpu_usage(); thread::sleep(MINIMUM_CPU_UPDATE_INTERVAL); system.refresh_cpu_usage(); let value = system.global_cpu_usage(); value.is_finite().then_some(value.clamp(0.0, 100.0)) }
fn validate_schema(schema_version: u8) -> Result<(), String> { (schema_version == SCHEMA_VERSION).then_some(()).ok_or_else(|| "UNSUPPORTED_SCHEMA_VERSION".to_string()) }
fn elapsed_ms(started: Instant) -> u64 { started.elapsed().as_millis().min(u128::from(u64::MAX)) as u64 }
fn now() -> String { Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true) }
fn normalize(value: &str) -> String { value.split_whitespace().collect::<Vec<_>>().join(" ").to_ascii_lowercase() }
fn normalize_pci(value: &str) -> String { let mut parts = value.trim().split(':').collect::<Vec<_>>(); if parts.len() == 3 { parts.remove(0); } parts.join(":").to_ascii_lowercase() }
fn process_code(code: super::process::ProcessErrorCode) -> String { format!("WINDOWS_PROVIDER_{code:?}").to_ascii_uppercase() }
fn strip_nulls(value: &mut Value) { match value { Value::Object(object) => { object.retain(|_, value| !value.is_null()); for value in object.values_mut() { strip_nulls(value); } }, Value::Array(values) => { for value in values { strip_nulls(value); } }, _ => {} } }

#[cfg(test)]
mod tests {
    use super::*;
    use crate::telemetry::parse::parse_windows_inventory;
    use crate::telemetry::windows::normalize_inventory;

    #[test]
    fn static_builder_echoes_generation_and_removes_private_keys() {
        let source = r#"{
          "system":{"hostName":"host","uptimeSeconds":1},
          "cpu":{"name":"CPU"},
          "memoryModules":[],
          "displayAdapters":[{"privateKey":"private-gpu","name":"NVIDIA GPU","pciBusId":"0000:01:00.0"}],
          "storageDevices":[],"networks":[],"pnpDevices":[],"errors":[]
        }"#;
        let inventory = parse_windows_inventory(source).unwrap();
        let (response, map) = build_static_response(7, normalize_inventory(inventory), "2026-08-29T10:00:00.000Z".to_string(), 12);
        let value = serde_json::to_value(response).unwrap();
        assert_eq!(value["generation"], 7);
        assert_eq!(value["inventory"]["data"]["displayAdapters"]["data"][0]["localId"], "gpu:0");
        assert!(!value.to_string().contains("privateKey"));
        assert_eq!(map.get("gpu-pci:01:00.0"), Some(&"gpu:0".to_string()));
    }
}
