#[cfg(windows)]
#[test]
fn provider_processes_are_spawned_without_a_console_window() {
    let process_source = include_str!("../src/telemetry/process.rs");

    assert!(
        process_source.contains("CREATE_NO_WINDOW"),
        "Windows provider children must opt out of creating a console window"
    );
    assert!(
        process_source.contains(".creation_flags(CREATE_NO_WINDOW)"),
        "the no-window flag must be applied to the shared bounded process runner"
    );
}
