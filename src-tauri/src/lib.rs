use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Serialize, Deserialize, Debug)]
pub struct HostSystemInfo {
    pub host_name: String,
    pub os_name: String,
    pub os_version: String,
    pub cpu_brand: String,
    pub cpu_physical_cores: usize,
    pub cpu_logical_threads: usize,
    pub total_memory_gb: f64,
    pub used_memory_gb: f64,
    pub uptime_seconds: u64,
}

#[tauri::command]
fn get_host_hardware_info() -> HostSystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let host_name = System::host_name().unwrap_or_else(|| "DESKTOP-PC".to_string());
    let os_name = System::name().unwrap_or_else(|| "Windows".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "11 Pro".to_string());

    let cpu_brand = sys
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "AMD Ryzen 7 7800X3D".to_string());

    let cpu_physical_cores = sys.physical_core_count().unwrap_or(8);
    let cpu_logical_threads = sys.cpus().len();

    let total_memory_gb = (sys.total_memory() as f64) / (1024.0 * 1024.0 * 1024.0);
    let used_memory_gb = (sys.used_memory() as f64) / (1024.0 * 1024.0 * 1024.0);
    let uptime_seconds = System::uptime();

    HostSystemInfo {
        host_name,
        os_name,
        os_version,
        cpu_brand,
        cpu_physical_cores,
        cpu_logical_threads,
        total_memory_gb: (total_memory_gb * 10.0).round() / 10.0,
        used_memory_gb: (used_memory_gb * 10.0).round() / 10.0,
        uptime_seconds,
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
        .invoke_handler(tauri::generate_handler![get_host_hardware_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
