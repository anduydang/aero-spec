use app_lib::telemetry::parse::{parse_nvidia_csv, parse_powershell_date, parse_windows_inventory};

const WINDOWS_FIXTURE: &str = include_str!("fixtures/windows-target-redacted.json");
const NVIDIA_FIXTURE: &str = include_str!("fixtures/nvidia-rtx2060super.csv");

#[test]
fn parses_powershell_epoch_date_before_calendar_digits() {
    assert_eq!(
        parse_powershell_date("/Date(1641168000000)/").as_deref(),
        Some("2022-01-03")
    );
    assert_eq!(parse_powershell_date("1641-16-80"), None);
}

#[test]
fn parses_the_redacted_target_inventory_without_losing_devices() {
    let inventory = parse_windows_inventory(WINDOWS_FIXTURE).expect("fixture should parse");

    let cpu = inventory.cpu.expect("CPU");
    assert!(cpu.name.contains("i3-12100F"));
    assert_eq!(cpu.l2_cache_kib, Some(5120));
    assert_eq!(cpu.l3_cache_kib, Some(12288));

    assert_eq!(inventory.memory_modules.len(), 2);
    assert_eq!(
        inventory.memory_modules[0].part_number.as_deref(),
        Some("F4-2666C19-8GIS")
    );
    assert_eq!(
        inventory.memory_modules[1].part_number.as_deref(),
        Some("F4-2666C19-8GVR")
    );
    assert_eq!(inventory.storage_devices.len(), 3);
    assert_eq!(inventory.networks.len(), 1);
    assert_eq!(inventory.pnp_devices.len(), 4);
    assert!(inventory
        .pnp_devices
        .iter()
        .any(|device| device.manufacturer.as_deref() == Some("ACER")));
    assert!(inventory
        .pnp_devices
        .iter()
        .any(|device| device.manufacturer.as_deref() == Some("Logitech")));
}

#[test]
fn normalizes_a_single_memory_object_to_one_item() {
    let source = r#"{
      "system": {"uptimeSeconds": 1},
      "memoryModules": {
        "privateKey": "memory-key",
        "capacityBytes": 8589934592,
        "partNumber": "ONE-DIMM"
      },
      "storageDevices": [],
      "networks": [],
      "pnpDevices": [],
      "displayAdapters": []
    }"#;

    let inventory = parse_windows_inventory(source).expect("single object should normalize");
    assert_eq!(inventory.memory_modules.len(), 1);
    assert_eq!(
        inventory.memory_modules[0].part_number.as_deref(),
        Some("ONE-DIMM")
    );
}

#[test]
fn parses_quoted_nvidia_csv_and_unsupported_values() {
    let gpus = parse_nvidia_csv(NVIDIA_FIXTURE).expect("NVIDIA fixture should parse");

    assert_eq!(gpus.len(), 1);
    assert_eq!(gpus[0].name, "NVIDIA GeForce RTX 2060 SUPER");
    assert_eq!(gpus[0].memory_total_mib, Some(8192));
    assert_eq!(gpus[0].temperature_c, Some(49.0));
    assert_eq!(gpus[0].fan_speed_percent, None);
    assert_eq!(gpus[0].power_draw_w, Some(31.63));
}

#[test]
fn omits_out_of_range_nvidia_values_instead_of_clamping() {
    let source = "uuid, 00000000:01:00.0, GPU, 8192, 999, 101, 10001, 10001, 100001, 101, 596.49";
    let gpus = parse_nvidia_csv(source).expect("row should remain parseable");

    assert_eq!(gpus[0].temperature_c, None);
    assert_eq!(gpus[0].utilization_percent, None);
    assert_eq!(gpus[0].power_draw_w, None);
    assert_eq!(gpus[0].power_limit_w, None);
    assert_eq!(gpus[0].graphics_clock_mhz, None);
    assert_eq!(gpus[0].fan_speed_percent, None);
}
