use serde::{Deserialize, Serialize};
use std::process::Command;
use sysinfo::System;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RamSlotInfo {
    pub slot: String,
    pub size: String,
    pub speed_mhz: u32,
    pub manufacturer: String,
    pub status: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DiskInfo {
    pub model: String,
    pub size_gb: u64,
    pub media_type: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LiveCpuInfo {
    pub name: String,
    pub cores: usize,
    pub threads: usize,
    pub max_clock_mhz: u32,
    pub current_load_pct: f32,
    pub per_core_loads: Vec<u32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LiveRamInfo {
    pub total_gb: u32,
    pub channel_mode: String,
    pub speed_mhz: u32,
    pub slots: Vec<RamSlotInfo>,
    pub is_single_channel: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LiveBoardInfo {
    pub manufacturer: String,
    pub model: String,
    pub version: String,
    pub bios_vendor: String,
    pub bios_version: String,
    pub bios_date: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LiveGpuInfo {
    pub name: String,
    pub is_discrete: bool,
    pub vram_mb: u64,
    pub driver_version: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LiveHostTelemetry {
    pub host_name: String,
    pub os_name: String,
    pub uptime_formatted: String,
    pub cpu: LiveCpuInfo,
    pub ram: LiveRamInfo,
    pub motherboard: LiveBoardInfo,
    pub gpu: LiveGpuInfo,
    pub disks: Vec<DiskInfo>,
}

#[tauri::command]
fn get_live_hardware_telemetry() -> LiveHostTelemetry {
    let mut sys = System::new_all();
    sys.refresh_all();

    let host_name = System::host_name().unwrap_or_else(|| "DESKTOP-PC".to_string());
    let os_name = format!(
        "{} {}",
        System::name().unwrap_or_else(|| "Windows".to_string()),
        System::os_version().unwrap_or_else(|| "11".to_string())
    );

    let uptime_secs = System::uptime();
    let hours = uptime_secs / 3600;
    let mins = (uptime_secs % 3600) / 60;
    let uptime_formatted = format!("{:02}h {:02}m", hours, mins);

    let cpu_name = sys
        .cpus()
        .first()
        .map(|c| c.brand().trim().to_string())
        .unwrap_or_else(|| "Intel(R) Core(TM) i5-8400 CPU".to_string());

    let cpu_cores = sys.physical_core_count().unwrap_or(6);
    let cpu_threads = sys.cpus().len();
    let cpu_global_load = sys.global_cpu_usage();
    let per_core_loads: Vec<u32> = sys.cpus().iter().map(|c| c.cpu_usage().round() as u32).collect();

    let wmi_script = r#"
        $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1 Name, MaxClockSpeed | ConvertTo-Json -Compress
        $board = Get-CimInstance Win32_BaseBoard | Select-Object -First 1 Manufacturer, Product, Version | ConvertTo-Json -Compress
        $bios = Get-CimInstance Win32_BIOS | Select-Object -First 1 Manufacturer, SMBIOSBIOSVersion, ReleaseDate | ConvertTo-Json -Compress
        $ram = Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity, Speed, ConfiguredClockSpeed, DeviceLocator, Manufacturer, PartNumber | ConvertTo-Json -Compress
        $gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1 Name, AdapterRAM, DriverVersion | ConvertTo-Json -Compress
        $disks = Get-CimInstance Win32_DiskDrive | Select-Object Model, Size, MediaType | ConvertTo-Json -Compress
        "---CPU---`n$cpu`n---BOARD---`n$board`n---BIOS---`n$bios`n---RAM---`n$ram`n---GPU---`n$gpu`n---DISKS---`n$disks"
    "#;

    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", wmi_script])
        .output();

    let mut max_clock = 2808;
    let mut board_mfg = "Dell Inc.".to_string();
    let mut board_model = "0D02VH".to_string();
    let mut board_ver = "A01".to_string();
    let mut bios_vendor = "Dell Inc.".to_string();
    let mut bios_ver = "2.18.0".to_string();
    let mut bios_date = "2021-06-17".to_string();
    let mut gpu_name = "Intel(R) UHD Graphics 630".to_string();
    let mut gpu_vram_mb = 1024;
    let mut gpu_driver = "".to_string();
    let mut is_discrete_gpu = false;
    let mut ram_slots: Vec<RamSlotInfo> = Vec::new();
    let mut total_ram_bytes: u64 = 0;
    let mut ram_speed = 2666;
    let mut disk_list: Vec<DiskInfo> = Vec::new();

    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout);
        let sections: Vec<&str> = text.split("---").collect();
        for i in 0..sections.len() {
            let s = sections[i].trim();
            if s.starts_with("CPU") && i + 1 < sections.len() {
                let json_str = sections[i + 1].trim();
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(json_str) {
                    if let Some(c) = v.get("MaxClockSpeed").and_then(|c| c.as_u64()) {
                        max_clock = c as u32;
                    }
                }
            } else if s.starts_with("BOARD") && i + 1 < sections.len() {
                let json_str = sections[i + 1].trim();
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(json_str) {
                    if let Some(m) = v.get("Manufacturer").and_then(|m| m.as_str()) {
                        board_mfg = m.trim().to_string();
                    }
                    if let Some(p) = v.get("Product").and_then(|p| p.as_str()) {
                        board_model = p.trim().to_string();
                    }
                    if let Some(ver) = v.get("Version").and_then(|v| v.as_str()) {
                        board_ver = ver.trim().to_string();
                    }
                }
            } else if s.starts_with("BIOS") && i + 1 < sections.len() {
                let json_str = sections[i + 1].trim();
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(json_str) {
                    if let Some(m) = v.get("Manufacturer").and_then(|m| m.as_str()) {
                        bios_vendor = m.trim().to_string();
                    }
                    if let Some(bv) = v.get("SMBIOSBIOSVersion").and_then(|bv| bv.as_str()) {
                        bios_ver = bv.trim().to_string();
                    }
                }
            } else if s.starts_with("RAM") && i + 1 < sections.len() {
                let json_str = sections[i + 1].trim();
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(json_str) {
                    let items = if v.is_array() {
                        v.as_array().unwrap().clone()
                    } else {
                        vec![v]
                    };
                    for item in items {
                        let cap = item.get("Capacity").and_then(|c| c.as_u64()).unwrap_or(8589934592);
                        total_ram_bytes += cap;
                        let spd = item.get("ConfiguredClockSpeed").and_then(|c| c.as_u64()).unwrap_or(2666) as u32;
                        ram_speed = spd;
                        let loc = item.get("DeviceLocator").and_then(|l| l.as_str()).unwrap_or("DIMM").to_string();
                        let mfg = item.get("Manufacturer").and_then(|m| m.as_str()).unwrap_or("OEM").to_string();
                        let size_gb = cap / (1024 * 1024 * 1024);
                        ram_slots.push(RamSlotInfo {
                            slot: loc,
                            size: format!("{}GB", size_gb),
                            speed_mhz: spd,
                            manufacturer: mfg,
                            status: "active".to_string(),
                        });
                    }
                }
            } else if s.starts_with("GPU") && i + 1 < sections.len() {
                let json_str = sections[i + 1].trim();
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(json_str) {
                    if let Some(n) = v.get("Name").and_then(|n| n.as_str()) {
                        gpu_name = n.trim().to_string();
                    }
                    if let Some(r) = v.get("AdapterRAM").and_then(|r| r.as_u64()) {
                        gpu_vram_mb = r / (1024 * 1024);
                    }
                    if let Some(d) = v.get("DriverVersion").and_then(|d| d.as_str()) {
                        gpu_driver = d.trim().to_string();
                    }
                    let lower = gpu_name.to_lowercase();
                    if lower.contains("nvidia") || lower.contains("geforce") || lower.contains("rtx") || lower.contains("radeon rx") {
                        is_discrete_gpu = true;
                    }
                }
            } else if s.starts_with("DISKS") && i + 1 < sections.len() {
                let json_str = sections[i + 1].trim();
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(json_str) {
                    let items = if v.is_array() {
                        v.as_array().unwrap().clone()
                    } else {
                        vec![v]
                    };
                    for item in items {
                        let model = item.get("Model").and_then(|m| m.as_str()).unwrap_or("Disk").trim().to_string();
                        let size_bytes = item.get("Size").and_then(|s| s.as_u64()).unwrap_or(0);
                        let media = item.get("MediaType").and_then(|m| m.as_str()).unwrap_or("Fixed").trim().to_string();
                        disk_list.push(DiskInfo {
                            model,
                            size_gb: size_bytes / (1000 * 1000 * 1000),
                            media_type: media,
                        });
                    }
                }
            }
        }
    }

    let total_ram_gb = if total_ram_bytes > 0 {
        (total_ram_bytes / (1024 * 1024 * 1024)) as u32
    } else {
        ((sys.total_memory()) / (1024 * 1024 * 1024)) as u32
    };

    let is_single = ram_slots.len() <= 1;
    let channel_mode = if is_single {
        format!("Single-Channel ({}x {}GB)", ram_slots.len(), total_ram_gb)
    } else {
        format!("Dual-Channel ({}x {}GB)", ram_slots.len(), total_ram_gb / (ram_slots.len() as u32).max(1))
    };

    LiveHostTelemetry {
        host_name,
        os_name,
        uptime_formatted,
        cpu: LiveCpuInfo {
            name: cpu_name,
            cores: cpu_cores,
            threads: cpu_threads,
            max_clock_mhz: max_clock,
            current_load_pct: cpu_global_load,
            per_core_loads,
        },
        ram: LiveRamInfo {
            total_gb: total_ram_gb,
            channel_mode,
            speed_mhz: ram_speed,
            slots: ram_slots,
            is_single_channel: is_single,
        },
        motherboard: LiveBoardInfo {
            manufacturer: board_mfg,
            model: board_model,
            version: board_ver,
            bios_vendor,
            bios_version: bios_ver,
            bios_date,
        },
        gpu: LiveGpuInfo {
            name: gpu_name,
            is_discrete: is_discrete_gpu,
            vram_mb: gpu_vram_mb,
            driver_version: gpu_driver,
        },
        disks: disk_list,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![get_live_hardware_telemetry])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
