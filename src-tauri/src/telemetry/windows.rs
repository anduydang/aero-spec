use std::collections::HashSet;
use std::path::PathBuf;

use super::model::{PnpDevice, WindowsInventory};
use super::parse::parse_windows_inventory;
use super::process::{run_bounded, ProcessError, ProcessErrorCode, ProcessLimits};

const ITEM_LIMIT: usize = 64;
const STRING_LIMIT_BYTES: usize = 512;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProviderDiagnostic {
    pub code: String,
    pub message: String,
    pub category: Option<String>,
    pub original_count: Option<usize>,
    pub returned_count: Option<usize>,
}

#[derive(Debug, Clone)]
pub struct NormalizedInventory {
    pub inventory: WindowsInventory,
    pub diagnostics: Vec<ProviderDiagnostic>,
}

pub fn collect_static_inventory() -> Result<NormalizedInventory, ProcessError> {
    let executable = powershell_path()?;
    let output = run_bounded(
        &executable,
        &[
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            STATIC_INVENTORY_SCRIPT,
        ],
        ProcessLimits::static_inventory(),
    )?;
    let inventory = parse_provider_output(&output.stdout)?;
    Ok(normalize_inventory(inventory))
}

pub fn parse_provider_output(output: &str) -> Result<WindowsInventory, ProcessError> {
    parse_windows_inventory(output).map_err(|_| ProcessError {
        code: ProcessErrorCode::InvalidJson,
        message: "System provider returned invalid inventory data.".to_string(),
        exit_code: None,
    })
}

pub fn normalize_inventory(mut inventory: WindowsInventory) -> NormalizedInventory {
    let mut diagnostics = inventory
        .errors
        .iter()
        .map(|error| ProviderDiagnostic {
            code: error.code.clone(),
            message: "A Windows inventory section could not be queried.".to_string(),
            category: Some(error.scope.clone()),
            original_count: None,
            returned_count: None,
        })
        .collect::<Vec<_>>();

    truncate_inventory_strings(&mut inventory, &mut diagnostics);

    inventory.memory_modules.sort_by(|left, right| {
        normalized(&left.private_key)
            .cmp(&normalized(&right.private_key))
            .then_with(|| normalized(left.device_locator.as_deref().unwrap_or_default()).cmp(&normalized(right.device_locator.as_deref().unwrap_or_default())))
    });
    inventory.display_adapters.sort_by(|left, right| {
        normalized(&left.private_key)
            .cmp(&normalized(&right.private_key))
            .then_with(|| normalized(&left.name).cmp(&normalized(&right.name)))
    });
    inventory.storage_devices.sort_by(|left, right| {
        left.device_number
            .unwrap_or(u32::MAX)
            .cmp(&right.device_number.unwrap_or(u32::MAX))
            .then_with(|| normalized(&left.model).cmp(&normalized(&right.model)))
    });
    inventory.networks.sort_by(|left, right| {
        left.interface_index
            .unwrap_or(u32::MAX)
            .cmp(&right.interface_index.unwrap_or(u32::MAX))
            .then_with(|| normalized(&left.name).cmp(&normalized(&right.name)))
    });
    inventory.pnp_devices.sort_by(|left, right| {
        normalized(&left.category)
            .cmp(&normalized(&right.category))
            .then_with(|| normalized(left.instance_id.as_deref().unwrap_or_default()).cmp(&normalized(right.instance_id.as_deref().unwrap_or_default())))
            .then_with(|| normalized(left.manufacturer.as_deref().unwrap_or_default()).cmp(&normalized(right.manufacturer.as_deref().unwrap_or_default())))
            .then_with(|| normalized(&left.name).cmp(&normalized(&right.name)))
    });
    deduplicate_pnp(&mut inventory.pnp_devices);

    cap_items("memory", &mut inventory.memory_modules, &mut diagnostics);
    cap_items("display-adapters", &mut inventory.display_adapters, &mut diagnostics);
    cap_items("storage", &mut inventory.storage_devices, &mut diagnostics);
    cap_items("network", &mut inventory.networks, &mut diagnostics);
    cap_items("pnp", &mut inventory.pnp_devices, &mut diagnostics);

    NormalizedInventory {
        inventory,
        diagnostics,
    }
}

fn deduplicate_pnp(devices: &mut Vec<PnpDevice>) {
    let mut seen = HashSet::new();
    devices.retain(|device| {
        let key = device
            .instance_id
            .as_deref()
            .filter(|value| !value.trim().is_empty())
            .map(|value| format!("id:{}", normalized(value)))
            .unwrap_or_else(|| {
                format!(
                    "fallback:{}:{}:{}",
                    normalized(&device.category),
                    normalized(device.manufacturer.as_deref().unwrap_or_default()),
                    normalized(&device.name)
                )
            });
        seen.insert(key)
    });
}

fn cap_items<T>(category: &str, values: &mut Vec<T>, diagnostics: &mut Vec<ProviderDiagnostic>) {
    if values.len() <= ITEM_LIMIT {
        return;
    }
    let original_count = values.len();
    values.truncate(ITEM_LIMIT);
    diagnostics.push(ProviderDiagnostic {
        code: "ITEM_LIMIT_EXCEEDED".to_string(),
        message: format!("Showing {ITEM_LIMIT} of {original_count} items."),
        category: Some(category.to_string()),
        original_count: Some(original_count),
        returned_count: Some(ITEM_LIMIT),
    });
}

fn truncate_inventory_strings(
    inventory: &mut WindowsInventory,
    diagnostics: &mut Vec<ProviderDiagnostic>,
) {
    let mut truncated = false;
    if let Some(system) = inventory.system.as_mut() {
        truncate_optional(&mut system.host_name, &mut truncated);
        truncate_optional(&mut system.os_name, &mut truncated);
        truncate_optional(&mut system.os_version, &mut truncated);
    }
    if let Some(cpu) = inventory.cpu.as_mut() {
        truncate_required(&mut cpu.name, &mut truncated);
        truncate_optional(&mut cpu.manufacturer, &mut truncated);
    }
    if let Some(board) = inventory.motherboard.as_mut() {
        truncate_optional(&mut board.manufacturer, &mut truncated);
        truncate_optional(&mut board.product, &mut truncated);
        truncate_optional(&mut board.version, &mut truncated);
        truncate_optional(&mut board.bios_vendor, &mut truncated);
        truncate_optional(&mut board.bios_version, &mut truncated);
    }
    for module in &mut inventory.memory_modules {
        truncate_required(&mut module.private_key, &mut truncated);
        truncate_optional(&mut module.bank_label, &mut truncated);
        truncate_optional(&mut module.device_locator, &mut truncated);
        truncate_optional(&mut module.manufacturer, &mut truncated);
        truncate_optional(&mut module.part_number, &mut truncated);
        truncate_optional(&mut module.serial_number, &mut truncated);
    }
    for adapter in &mut inventory.display_adapters {
        truncate_required(&mut adapter.private_key, &mut truncated);
        truncate_optional(&mut adapter.pnp_instance_id, &mut truncated);
        truncate_required(&mut adapter.name, &mut truncated);
        truncate_optional(&mut adapter.vendor_id, &mut truncated);
        truncate_optional(&mut adapter.device_id, &mut truncated);
        truncate_optional(&mut adapter.subsystem_id, &mut truncated);
        truncate_optional(&mut adapter.pci_bus_id, &mut truncated);
        truncate_optional(&mut adapter.driver_version, &mut truncated);
    }
    for disk in &mut inventory.storage_devices {
        truncate_required(&mut disk.private_key, &mut truncated);
        truncate_optional(&mut disk.pnp_instance_id, &mut truncated);
        truncate_required(&mut disk.model, &mut truncated);
        truncate_optional(&mut disk.serial_number, &mut truncated);
        truncate_optional(&mut disk.media_type, &mut truncated);
        truncate_optional(&mut disk.bus_type, &mut truncated);
        truncate_optional(&mut disk.health, &mut truncated);
        for status in &mut disk.operational_status {
            truncate_required(status, &mut truncated);
        }
    }
    for network in &mut inventory.networks {
        truncate_required(&mut network.private_key, &mut truncated);
        truncate_required(&mut network.name, &mut truncated);
        truncate_optional(&mut network.interface_name, &mut truncated);
        truncate_optional(&mut network.media_type, &mut truncated);
        truncate_optional(&mut network.mac_address, &mut truncated);
    }
    for device in &mut inventory.pnp_devices {
        truncate_required(&mut device.private_key, &mut truncated);
        truncate_optional(&mut device.instance_id, &mut truncated);
        truncate_required(&mut device.name, &mut truncated);
        truncate_required(&mut device.category, &mut truncated);
        truncate_optional(&mut device.manufacturer, &mut truncated);
        truncate_optional(&mut device.status, &mut truncated);
    }

    if truncated {
        diagnostics.push(ProviderDiagnostic {
            code: "STRING_TRUNCATED".to_string(),
            message: "One or more provider strings exceeded the display limit.".to_string(),
            category: None,
            original_count: None,
            returned_count: None,
        });
    }
}

fn truncate_optional(value: &mut Option<String>, truncated: &mut bool) {
    if let Some(current) = value.take() {
        let mut cleaned = current.trim().to_string();
        if !cleaned.is_empty() {
            truncate_required(&mut cleaned, truncated);
            *value = Some(cleaned);
        }
    }
}

fn truncate_required(value: &mut String, truncated: &mut bool) {
    *value = value.trim().to_string();
    if value.len() <= STRING_LIMIT_BYTES {
        return;
    }
    let mut boundary = STRING_LIMIT_BYTES;
    while !value.is_char_boundary(boundary) {
        boundary -= 1;
    }
    value.truncate(boundary);
    *truncated = true;
}

fn normalized(value: &str) -> String {
    value.split_whitespace().collect::<Vec<_>>().join(" ").to_lowercase()
}

#[cfg(windows)]
fn powershell_path() -> Result<PathBuf, ProcessError> {
    use windows_sys::Win32::System::SystemInformation::GetSystemDirectoryW;

    let mut buffer = vec![0_u16; 32_768];
    let length = unsafe { GetSystemDirectoryW(buffer.as_mut_ptr(), buffer.len() as u32) } as usize;
    if length == 0 || length >= buffer.len() {
        return Err(ProcessError {
            code: ProcessErrorCode::MissingExecutable,
            message: "Windows PowerShell is unavailable.".to_string(),
            exit_code: None,
        });
    }
    let system_directory = String::from_utf16(&buffer[..length]).map_err(|_| ProcessError {
        code: ProcessErrorCode::InvalidUtf8,
        message: "Windows system path is unavailable.".to_string(),
        exit_code: None,
    })?;
    Ok(PathBuf::from(system_directory)
        .join("WindowsPowerShell")
        .join("v1.0")
        .join("powershell.exe"))
}

#[cfg(not(windows))]
fn powershell_path() -> Result<PathBuf, ProcessError> {
    Err(ProcessError {
        code: ProcessErrorCode::MissingExecutable,
        message: "Windows PowerShell is unavailable.".to_string(),
        exit_code: None,
    })
}

pub const STATIC_INVENTORY_SCRIPT: &str = r#"
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$result = [ordered]@{
  system = $null; cpu = $null; motherboard = $null
  memoryModules = @(); displayAdapters = @(); storageDevices = @()
  networks = @(); pnpDevices = @(); errors = @()
}
function Add-ProbeError([string]$scope) {
  $script:result.errors += [ordered]@{ scope = $scope; code = 'QUERY_FAILED' }
}
try {
  $os = Get-CimInstance Win32_OperatingSystem | Select-Object -First 1
  $computer = Get-CimInstance Win32_ComputerSystem | Select-Object -First 1
  $uptime = [math]::Max(0, [int64]((Get-Date) - $os.LastBootUpTime).TotalSeconds)
  $result.system = [ordered]@{
    hostName = [string]$computer.Name; osName = [string]$os.Caption
    osVersion = [string]$os.Version; uptimeSeconds = $uptime
  }
} catch { Add-ProbeError 'system' }
try {
  $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
  $result.cpu = [ordered]@{
    name = [string]$cpu.Name; manufacturer = [string]$cpu.Manufacturer
    physicalCores = [uint32]$cpu.NumberOfCores; logicalProcessors = [uint32]$cpu.NumberOfLogicalProcessors
    maxClockMhz = [uint32]$cpu.MaxClockSpeed; l2CacheKib = [uint64]$cpu.L2CacheSize
    l3CacheKib = [uint64]$cpu.L3CacheSize
  }
} catch { Add-ProbeError 'cpu' }
try {
  $board = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
  $bios = Get-CimInstance Win32_BIOS | Select-Object -First 1
  $biosDate = $(if ($bios.ReleaseDate) { $bios.ReleaseDate.ToString('yyyy-MM-dd') } else { $null })
  $result.motherboard = [ordered]@{
    manufacturer = [string]$board.Manufacturer; product = [string]$board.Product
    version = [string]$board.Version; biosVendor = [string]$bios.Manufacturer
    biosVersion = [string]$bios.SMBIOSBIOSVersion; biosReleaseDate = $biosDate
  }
} catch { Add-ProbeError 'motherboard' }
try {
  $result.memoryModules = @(
    Get-CimInstance Win32_PhysicalMemory | ForEach-Object {
      [ordered]@{
        privateKey = [string]$_.DeviceLocator; bankLabel = [string]$_.BankLabel
        deviceLocator = [string]$_.DeviceLocator; capacityBytes = [uint64]$_.Capacity
        configuredSpeedMtps = [uint32]$(if ($_.ConfiguredClockSpeed) { $_.ConfiguredClockSpeed } else { $_.Speed })
        manufacturer = ([string]$_.Manufacturer).Trim(); partNumber = ([string]$_.PartNumber).Trim()
        serialNumber = ([string]$_.SerialNumber).Trim()
      }
    }
  )
} catch { Add-ProbeError 'memory' }
try {
  $result.displayAdapters = @(
    Get-CimInstance Win32_VideoController | ForEach-Object {
      $pnp = [string]$_.PNPDeviceID; $vendor = $null; $device = $null; $subsystem = $null
      if ($pnp -match 'VEN_([0-9A-F]{4})') { $vendor = $matches[1] }
      if ($pnp -match 'DEV_([0-9A-F]{4})') { $device = $matches[1] }
      if ($pnp -match 'SUBSYS_([0-9A-F]{8})') { $subsystem = $matches[1] }
      [ordered]@{
        privateKey = $(if ($pnp) { $pnp } else { [string]$_.Name }); pnpInstanceId = $pnp
        name = [string]$_.Name; vendorId = $vendor; deviceId = $device; subsystemId = $subsystem
        pciBusId = $null; driverVersion = [string]$_.DriverVersion
      }
    }
  )
} catch { Add-ProbeError 'displayAdapters' }
try {
  $physical = @(Get-PhysicalDisk -ErrorAction Stop)
  $result.storageDevices = @(
    Get-CimInstance Win32_DiskDrive | ForEach-Object {
      $disk = $_; $match = $physical | Where-Object { [string]$_.DeviceId -eq [string]$disk.Index } | Select-Object -First 1
      $media = if ($match.MediaType -match 'SSD') { 'ssd' } elseif ($match.MediaType -match 'HDD') { 'hdd' } else { 'unspecified' }
      $health = if ($match.HealthStatus -eq 'Healthy') { 'healthy' } elseif ($match.HealthStatus -eq 'Warning') { 'warning' } elseif ($match.HealthStatus -eq 'Unhealthy') { 'unhealthy' } else { 'unknown' }
      [ordered]@{
        privateKey = $(if ($disk.PNPDeviceID) { [string]$disk.PNPDeviceID } else { "disk:$($disk.Index)" })
        deviceNumber = [uint32]$disk.Index; pnpInstanceId = [string]$disk.PNPDeviceID
        model = ([string]$disk.Model).Trim(); serialNumber = ([string]$disk.SerialNumber).Trim()
        capacityBytes = [uint64]$disk.Size; mediaType = $media
        busType = $(if ($match) { [string]$match.BusType } else { [string]$disk.InterfaceType })
        health = $health; operationalStatus = @($match.OperationalStatus | ForEach-Object { [string]$_ })
      }
    }
  )
} catch { Add-ProbeError 'storage' }
try {
  $result.networks = @(
    Get-NetAdapter -Physical -ErrorAction Stop | Where-Object { $_.Status -ne 'Disabled' } | ForEach-Object {
      $speed = 0; $text = [string]$_.LinkSpeed
      if ($text -match '([0-9.]+)\s*Gbps') { $speed = [uint64]([double]$matches[1] * 1000000000) }
      elseif ($text -match '([0-9.]+)\s*Mbps') { $speed = [uint64]([double]$matches[1] * 1000000) }
      [ordered]@{
        privateKey = [string]$_.InterfaceGuid; interfaceIndex = [uint32]$_.ifIndex
        name = [string]$_.InterfaceDescription; interfaceName = [string]$_.Name
        linkSpeedBps = $speed; mediaType = [string]$_.MediaType
        macAddress = [string]$_.MacAddress; connected = ($_.Status -eq 'Up')
      }
    }
  )
} catch { Add-ProbeError 'networks' }
try {
  $classes = @('Monitor','Keyboard','Mouse','AudioEndpoint','MEDIA')
  $result.pnpDevices = @(
    Get-PnpDevice -PresentOnly -ErrorAction Stop | Where-Object { $classes -contains $_.Class } | ForEach-Object {
      $category = switch ($_.Class) { 'Monitor' { 'display' } 'Keyboard' { 'keyboard' } 'Mouse' { 'pointing' } default { 'audio' } }
      [ordered]@{
        privateKey = [string]$_.InstanceId; instanceId = [string]$_.InstanceId
        name = [string]$_.FriendlyName; category = $category
        manufacturer = [string]$_.Manufacturer; status = [string]$_.Status
      }
    }
  )
} catch { Add-ProbeError 'pnp' }
$result | ConvertTo-Json -Depth 8 -Compress
"#;

#[cfg(all(test, windows))]
mod tests {
    use super::collect_static_inventory;

    #[test]
    #[ignore = "reads the local Windows hardware inventory"]
    fn capture_target() {
        let normalized = collect_static_inventory().expect("Windows collector should complete");
        let mut value = serde_json::to_value(&normalized.inventory).expect("serializable inventory");

        redact_field(&mut value["system"], "hostName", "<REDACTED_HOST_1>");
        redact_array_fields(
            &mut value["memoryModules"],
            &[("privateKey", "MEMORY_KEY"), ("serialNumber", "MEMORY_SERIAL")],
        );
        redact_array_fields(
            &mut value["displayAdapters"],
            &[
                ("privateKey", "GPU_KEY"),
                ("pnpInstanceId", "GPU_PNP"),
                ("subsystemId", "GPU_SUBSYSTEM"),
                ("pciBusId", "GPU_PCI"),
            ],
        );
        redact_array_fields(
            &mut value["storageDevices"],
            &[
                ("privateKey", "DISK_KEY"),
                ("pnpInstanceId", "DISK_PNP"),
                ("serialNumber", "DISK_SERIAL"),
            ],
        );
        redact_array_fields(
            &mut value["networks"],
            &[("privateKey", "NETWORK_KEY"), ("macAddress", "MAC")],
        );
        redact_array_fields(
            &mut value["pnpDevices"],
            &[("privateKey", "PNP_KEY"), ("instanceId", "PNP_INSTANCE")],
        );

        println!(
            "{}",
            serde_json::to_string_pretty(&value).expect("printable sanitized inventory")
        );
        assert!(value["system"]["hostName"] == "<REDACTED_HOST_1>");
    }

    fn redact_field(value: &mut serde_json::Value, field: &str, replacement: &str) {
        if value.get(field).is_some_and(|item| !item.is_null()) {
            value[field] = serde_json::Value::String(replacement.to_string());
        }
    }

    fn redact_array_fields(
        value: &mut serde_json::Value,
        fields: &[(&str, &str)],
    ) {
        let Some(items) = value.as_array_mut() else {
            return;
        };
        for (index, item) in items.iter_mut().enumerate() {
            for (field, label) in fields {
                redact_field(item, field, &format!("<REDACTED_{label}_{}>", index + 1));
            }
        }
    }
}
