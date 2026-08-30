use std::path::Path;
use std::time::Duration;

use app_lib::telemetry::model::{PnpDevice, WindowsInventory};
use app_lib::telemetry::process::{
    decode_utf8, run_bounded, ProcessErrorCode, ProcessLimits,
};
use app_lib::telemetry::windows::{
    normalize_inventory, parse_provider_output, STATIC_INVENTORY_SCRIPT,
};

const WINDOWS_FIXTURE: &str = include_str!("fixtures/windows-target-redacted.json");

#[test]
fn sorts_deduplicates_and_caps_pnp_deterministically() {
    let mut inventory: WindowsInventory = serde_json::from_str(WINDOWS_FIXTURE).unwrap();
    inventory.pnp_devices.clear();
    for index in (0..66).rev() {
        inventory.pnp_devices.push(PnpDevice {
            private_key: format!("key-{index:02}"),
            instance_id: Some(format!("instance-{index:02}")),
            name: format!("Device {index:02}"),
            category: "audio".to_string(),
            manufacturer: Some("Vendor".to_string()),
            status: Some("OK".to_string()),
        });
    }
    inventory.pnp_devices.push(inventory.pnp_devices[0].clone());

    let normalized = normalize_inventory(inventory);

    assert_eq!(normalized.inventory.pnp_devices.len(), 64);
    assert_eq!(normalized.inventory.pnp_devices[0].name, "Device 00");
    assert_eq!(normalized.inventory.pnp_devices[63].name, "Device 63");
    let diagnostic = normalized
        .diagnostics
        .iter()
        .find(|item| item.code == "ITEM_LIMIT_EXCEEDED")
        .expect("truncation diagnostic");
    assert_eq!(diagnostic.original_count, Some(66));
    assert_eq!(diagnostic.returned_count, Some(64));
}

#[test]
fn deduplicates_pnp_without_instance_id_by_normalized_identity() {
    let mut inventory: WindowsInventory = serde_json::from_str(WINDOWS_FIXTURE).unwrap();
    inventory.pnp_devices = vec![
        PnpDevice {
            private_key: "a".to_string(),
            instance_id: None,
            name: "  HID Keyboard Device ".to_string(),
            category: "keyboard".to_string(),
            manufacturer: Some("MICROSOFT".to_string()),
            status: Some("OK".to_string()),
        },
        PnpDevice {
            private_key: "b".to_string(),
            instance_id: None,
            name: "hid keyboard device".to_string(),
            category: "keyboard".to_string(),
            manufacturer: Some("Microsoft".to_string()),
            status: Some("OK".to_string()),
        },
    ];

    let normalized = normalize_inventory(inventory);
    assert_eq!(normalized.inventory.pnp_devices.len(), 1);
}

#[test]
fn truncates_multibyte_text_on_a_valid_utf8_boundary() {
    let mut inventory: WindowsInventory = serde_json::from_str(WINDOWS_FIXTURE).unwrap();
    inventory.pnp_devices[0].name = "ộ".repeat(300);

    let normalized = normalize_inventory(inventory);
    let name = &normalized.inventory.pnp_devices[0].name;

    assert!(name.len() <= 512);
    assert!(name.is_char_boundary(name.len()));
    assert!(normalized
        .diagnostics
        .iter()
        .any(|item| item.code == "STRING_TRUNCATED"));
}

#[test]
fn rejects_invalid_utf8_without_lossy_decoding() {
    let error = decode_utf8(vec![0xff, 0xfe]).expect_err("invalid UTF-8 must fail");
    assert_eq!(error.code, ProcessErrorCode::InvalidUtf8);
    assert!(!error.message.contains("ff"));
}

#[test]
fn reports_invalid_json_separately_from_invalid_utf8() {
    let error = parse_provider_output("{ definitely-not-json }")
        .expect_err("malformed provider JSON must fail");

    assert_eq!(error.code, ProcessErrorCode::InvalidJson);
    assert!(!error.message.contains("definitely-not-json"));
}

#[test]
fn preserves_successful_sections_when_a_sibling_probe_fails() {
    let inventory = parse_provider_output(
        r#"{
          "cpu":{"name":"Intel Test CPU"},
          "memoryModules":[],"displayAdapters":[],"storageDevices":[],
          "networks":[],"pnpDevices":[],
          "errors":[{"scope":"storage","code":"QUERY_FAILED"}]
        }"#,
    )
    .expect("valid provider payload");

    let normalized = normalize_inventory(inventory);
    assert_eq!(normalized.inventory.cpu.unwrap().name, "Intel Test CPU");
    assert!(normalized.diagnostics.iter().any(|item| {
        item.code == "QUERY_FAILED" && item.category.as_deref() == Some("storage")
    }));
}

#[test]
fn trims_provider_text_and_drops_blank_optional_values() {
    let mut inventory: WindowsInventory = serde_json::from_str(WINDOWS_FIXTURE).unwrap();
    inventory.motherboard.as_mut().unwrap().version = Some("      ".to_string());
    inventory.pnp_devices[0].name = "  Generic PnP Monitor  ".to_string();

    let normalized = normalize_inventory(inventory);

    assert_eq!(normalized.inventory.motherboard.unwrap().version, None);
    assert!(normalized
        .inventory
        .pnp_devices
        .iter()
        .any(|device| device.name == "Generic PnP Monitor"));
}

#[test]
fn collector_emits_locale_independent_bios_dates_and_readable_network_media() {
    assert!(STATIC_INVENTORY_SCRIPT.contains("ToString('yyyy-MM-dd')"));
    assert!(STATIC_INVENTORY_SCRIPT.contains("mediaType = [string]$_.MediaType"));
}

#[test]
fn reports_missing_executable_without_leaking_the_path() {
    let secret_path = Path::new(r"C:\Users\private-user\missing-tool.exe");
    let error = run_bounded(secret_path, &[], ProcessLimits::static_inventory())
        .expect_err("missing executable must fail");

    assert_eq!(error.code, ProcessErrorCode::MissingExecutable);
    assert!(!error.message.contains("private-user"));
    assert!(!error.message.contains("missing-tool.exe"));
}

#[cfg(windows)]
#[test]
fn reports_nonzero_exit_with_sanitized_diagnostics() {
    let error = run_bounded(
        Path::new(r"C:\Windows\System32\cmd.exe"),
        &["/C", "echo secret-serial 1>&2 & exit /B 7"],
        ProcessLimits::dynamic(Duration::from_secs(2)),
    )
    .expect_err("exit 7 must fail");

    assert_eq!(error.code, ProcessErrorCode::NonZeroExit);
    assert_eq!(error.exit_code, Some(7));
    assert!(!error.message.contains("secret-serial"));
}

#[cfg(windows)]
#[test]
fn times_out_and_terminates_the_job() {
    let error = run_bounded(
        Path::new(r"C:\Windows\System32\cmd.exe"),
        &["/C", "ping -n 6 127.0.0.1 >nul"],
        ProcessLimits::dynamic(Duration::from_millis(100)),
    )
    .expect_err("slow process must time out");

    assert_eq!(error.code, ProcessErrorCode::Timeout);
}

#[cfg(windows)]
#[test]
fn rejects_output_over_the_configured_limit() {
    let error = run_bounded(
        Path::new(r"C:\Windows\System32\cmd.exe"),
        &["/C", "for /L %i in (1,1,200) do @echo 1234567890"],
        ProcessLimits {
            timeout: Duration::from_secs(2),
            stdout_bytes: 128,
            stderr_bytes: 128,
        },
    )
    .expect_err("large stdout must fail");

    assert_eq!(error.code, ProcessErrorCode::OutputTooLarge);
}
