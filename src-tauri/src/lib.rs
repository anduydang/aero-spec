use telemetry::commands::{get_dynamic_snapshot_v2, get_static_snapshot_v2, TelemetryRuntime};

pub mod telemetry;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .manage(TelemetryRuntime::default())
        .invoke_handler(tauri::generate_handler![
            get_static_snapshot_v2,
            get_dynamic_snapshot_v2
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
