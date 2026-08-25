use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SystemDevice {
    pub host_name: Option<String>,
    pub os_name: Option<String>,
    pub os_version: Option<String>,
    pub uptime_seconds: Option<u64>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CpuDevice {
    pub name: String,
    pub manufacturer: Option<String>,
    pub physical_cores: Option<u32>,
    pub logical_processors: Option<u32>,
    pub max_clock_mhz: Option<u32>,
    pub l2_cache_kib: Option<u64>,
    pub l3_cache_kib: Option<u64>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MotherboardDevice {
    pub manufacturer: Option<String>,
    pub product: Option<String>,
    pub version: Option<String>,
    pub bios_vendor: Option<String>,
    pub bios_version: Option<String>,
    pub bios_release_date: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MemoryModule {
    pub private_key: String,
    pub bank_label: Option<String>,
    pub device_locator: Option<String>,
    pub capacity_bytes: u64,
    pub configured_speed_mtps: Option<u32>,
    pub manufacturer: Option<String>,
    pub part_number: Option<String>,
    pub serial_number: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DisplayAdapter {
    pub private_key: String,
    pub pnp_instance_id: Option<String>,
    pub name: String,
    pub vendor_id: Option<String>,
    pub device_id: Option<String>,
    pub subsystem_id: Option<String>,
    pub pci_bus_id: Option<String>,
    pub driver_version: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StorageDevice {
    pub private_key: String,
    pub device_number: Option<u32>,
    pub pnp_instance_id: Option<String>,
    pub model: String,
    pub serial_number: Option<String>,
    pub capacity_bytes: u64,
    pub media_type: Option<String>,
    pub bus_type: Option<String>,
    pub health: Option<String>,
    #[serde(default)]
    pub operational_status: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NetworkDevice {
    pub private_key: String,
    pub interface_index: Option<u32>,
    pub name: String,
    pub interface_name: Option<String>,
    pub link_speed_bps: Option<u64>,
    pub media_type: Option<String>,
    pub mac_address: Option<String>,
    pub connected: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PnpDevice {
    pub private_key: String,
    pub instance_id: Option<String>,
    pub name: String,
    pub category: String,
    pub manufacturer: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WindowsInventory {
    pub system: Option<SystemDevice>,
    pub cpu: Option<CpuDevice>,
    pub motherboard: Option<MotherboardDevice>,
    #[serde(default, deserialize_with = "deserialize_one_or_many")]
    pub memory_modules: Vec<MemoryModule>,
    #[serde(default, deserialize_with = "deserialize_one_or_many")]
    pub display_adapters: Vec<DisplayAdapter>,
    #[serde(default, deserialize_with = "deserialize_one_or_many")]
    pub storage_devices: Vec<StorageDevice>,
    #[serde(default, deserialize_with = "deserialize_one_or_many")]
    pub networks: Vec<NetworkDevice>,
    #[serde(default, deserialize_with = "deserialize_one_or_many")]
    pub pnp_devices: Vec<PnpDevice>,
}

fn deserialize_one_or_many<'de, D, T>(deserializer: D) -> Result<Vec<T>, D::Error>
where
    D: serde::Deserializer<'de>,
    T: Deserialize<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum OneOrMany<T> {
        One(T),
        Many(Vec<T>),
    }

    Ok(match OneOrMany::deserialize(deserializer)? {
        OneOrMany::One(item) => vec![item],
        OneOrMany::Many(items) => items,
    })
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NvidiaGpu {
    pub uuid: Option<String>,
    pub pci_bus_id: Option<String>,
    pub name: String,
    pub memory_total_mib: Option<u64>,
    pub temperature_c: Option<f32>,
    pub utilization_percent: Option<f32>,
    pub power_draw_w: Option<f32>,
    pub power_limit_w: Option<f32>,
    pub graphics_clock_mhz: Option<u32>,
    pub fan_speed_percent: Option<f32>,
    pub driver_version: Option<String>,
}
