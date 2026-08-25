# AeroSpec Native Detection, Full-HD Layout, and Installer Design

## Goal

Turn AeroSpec into a trustworthy personal Windows hardware viewer: show every component Windows can actually identify, expose useful live sensors when a supported provider is available, keep unavailable data honest, remain visually composed in a maximized Full-HD Tauri window, and ship a usable NSIS Setup executable.

This design extends and supersedes the hardware-detection exclusions in `2026-08-25-aerospec-trust-ui-refresh-design.md`. Its trust and scoring rules remain in force.

## Evidence From the Current Build

- The native probe only queries processor, baseboard, BIOS, physical memory, video controller, and disk drive WMI classes. It has no contract for network adapters, monitors, keyboards, mice, audio devices, disk health, or detailed CPU/RAM fields.
- The frontend keeps only two native disks and renders a fixed third "upgrade" bay even when Windows reports three physical disks.
- GPU memory comes from the 32-bit `Win32_VideoController.AdapterRAM` field, which under-reports cards with more than 4 GiB.
- The BIOS date parser treats PowerShell's `/Date(milliseconds)/` value as calendar digits and can produce impossible dates.
- The live dashboard previously looked more complete because real results were shallow-merged over a simulated Dell/i5 profile. That fabrication has correctly been removed and must not return.
- The settings popover combines `absolute` with the shared `.studio-card { position: relative; }` rule. The latter wins, so opening settings makes the header grow dramatically instead of overlaying it.
- In a maximized 1920x1040 client area, the dashboard is compressed into the upper portion of the window while the lower portion is largely empty. Dense type and fixed card composition make it look stretched rather than intentionally responsive.
- Standard desktop Windows WMI exposes no dependable generic PSU model or wattage. A conventional PSU without USB/PMBus/vendor telemetry cannot be auto-detected honestly.

## Considered Approaches

### 1. Expand WMI only

Add more CIM/WMI and PowerShell queries and keep the existing Rust-to-React path.

Pros: smallest installer, simplest maintenance, no helper process.  
Cons: no reliable CPU/package temperature or board sensors, limited GPU telemetry, and no generic PSU identity.

### 2. Hybrid inventory plus optional sensor provider — selected

Use Windows inventory APIs for component identity, `Get-PhysicalDisk` for storage health, PnP for connected devices, NVIDIA's installed CLI for accurate NVIDIA telemetry, and a bundled LibreHardwareMonitor-based helper for deep sensors. Every provider is independent and reports its own availability.

Pros: complete everyday inventory, strong RTX data on the target PC, useful deep sensors, graceful degradation, and no invented values.  
Cons: the helper adds packaging work and may require elevation for some low-level sensors.

### 3. Always-elevated hardware service

Install and run a privileged Windows service that continuously gathers every possible sensor.

Pros: richest persistent telemetry.  
Cons: large security and maintenance surface, service lifecycle complexity, mandatory elevation, and disproportionate cost for a personal viewer.

Approach 2 provides the best fidelity-to-complexity ratio. The entire AeroSpec UI will not require administrator privileges. The sensor helper first runs normally; when a sensor requires elevated driver access, AeroSpec reports that limitation and offers an explicit retry with elevation instead of prompting on every launch.

## Truth and Provenance Model

Every displayed field belongs to a source and availability state:

```ts
type DataSource = 'windows' | 'nvidia' | 'librehardwaremonitor' | 'manual' | 'simulator';
type Availability = 'available' | 'unsupported' | 'permission-required' | 'probe-error';

interface SourcedValue<T> {
  value?: T;
  source?: DataSource;
  availability: Availability;
  updatedAt?: string;
  note?: string;
}
```

The UI may group adjacent values under one source badge to avoid visual noise. It must never substitute a simulator, estimate, zero, or placeholder sentence for a missing live value. Provider diagnostics remain separate from the friendly component view and are available in Detection Details.

A snapshot can be `ready`, `partial`, `unavailable`, or `error`. A failure in one provider never discards successful data from another provider.

## Native Detection Architecture

### Windows inventory probe

Replace the delimiter-based PowerShell output with one versioned JSON document. Each section is wrapped in its own `try/catch`, and the Rust launcher records process exit code, stderr, timeout, and per-section errors.

The inventory contains:

- CPU identity, physical/logical cores, maximum clock, current load, L2 cache, and L3 cache.
- Baseboard manufacturer, product, version, and BIOS vendor/version/date. PowerShell JSON dates are parsed from epoch milliseconds before conventional date formats are attempted.
- Every populated DIMM with bank/device locator, capacity, configured speed, manufacturer, part number, and serial when available. Channel topology stays explicitly labelled as inferred.
- Every physical disk with friendly/model name, serial where available, capacity, media type, bus type, operational status, and health status. The frontend receives an array and never truncates it.
- Display adapters with WMI identity and driver data as a fallback.
- Active physical network adapters with interface name, link speed, MAC address, and media type.
- Present monitors, keyboards, pointing devices, and audio endpoints/controllers from PnP. Entries are filtered to useful device classes, normalized, and deduplicated by instance ID or normalized name.

PowerShell is invoked with a fixed script owned by the application; no user-controlled text is inserted into a shell command.

### NVIDIA probe

When `nvidia-smi` is installed, Rust invokes it directly with a fixed `--query-gpu` list and CSV output. The probe supplies full dedicated VRAM, temperature, utilization, current/power-limit watts, graphics clock, fan speed where supported, and driver version. A short timeout and parser fixtures protect the main refresh loop. WMI remains the identity fallback when the command is absent or unsupported.

### LibreHardwareMonitor helper

Deep CPU, motherboard, GPU, memory-controller, fan, voltage, and storage sensors are gathered by a small Windows x64 helper built against LibreHardwareMonitorLib.

- It is a one-shot, read-only JSON process rather than a background service.
- The helper has no network access and accepts only fixed flags such as `--snapshot`.
- Tauri bundles the published helper as a sidecar/resource. The main Rust process validates its expected path, applies a timeout, reads bounded stdout, and terminates it after the snapshot.
- The build publishes the helper self-contained so end users do not need a separately installed .NET runtime. Build documentation records the resulting installer-size cost.
- AeroSpec attempts an unelevated snapshot first. If low-level access is denied, the UI marks only affected sensors `permission-required` and exposes an explicit "Retry deep sensors as administrator" action.
- If building or executing the helper is unavailable, the rest of the detector and installer still build. The release checklist, however, may call the final package complete only when the helper inclusion is verified or the release is explicitly labelled "inventory-only".

Sensor matching uses normalized hardware identifiers and conservative name matching. An unmatched sensor is omitted instead of attached to the wrong component.

### PSU handling

Auto-detection is attempted only if a provider returns an explicit PSU device or sensor. AeroSpec never derives wattage or model from total system draw.

For normal desktop PSUs, the right panel presents a compact manual profile with optional brand/model, rated wattage, efficiency rating, and note. It is stored locally under a versioned key and labelled `Manual`. Sensor-only PSU fields such as input/output power remain unavailable unless a provider actually exposes them.

## Frontend Data and Rendering

The live contract changes from fixed mock-shaped slots to arrays for resources that have variable cardinality:

```ts
interface NativeSnapshot {
  cpu?: NativeCpu;
  motherboard?: NativeMotherboard;
  memoryModules: NativeMemoryModule[];
  gpus: NativeGpu[];
  storageDevices: NativeStorageDevice[];
  networks: NativeNetwork[];
  displays: NativeDevice[];
  inputDevices: NativeDevice[];
  audioDevices: NativeDevice[];
  sensors: NativeSensor[];
  diagnostics: ProviderDiagnostic[];
}
```

Adapters remain pure and unit-testable. Simulator profiles use the same UI model but are permanently marked `simulator`; live adapters cannot read simulator defaults.

Storage cards render from `storageDevices[]`. The board schematic maps detected disks to available visual bays, and an upgrade bay appears only when the detected board/storage model supports presenting one as an explicit recommendation. Scoring consumes detected storage values and never assumes a fabricated throughput.

The right column is split into independent sections:

1. Power supply: detected, manual, or honest unavailable state.
2. Network: active adapters and link state.
3. Connected devices: displays, input, and audio summaries with expandable details.

A missing PSU must not hide network or peripheral results.

## Full-HD and Settings UI

### App shell

- The shell uses a minimum viewport height and a column layout; the main dashboard grows to consume remaining space and the footer follows content naturally.
- At wide desktop sizes, the three columns stretch together and distribute useful detail vertically. Large dead space below a compressed dashboard is removed.
- Side panels retain a readable desktop width, while the schematic receives flexible space. Core text is at least 12px and device values remain selectable.
- Vertical scrolling remains available when scaling or content requires it; no root-level overflow clipping may conceal component data.
- The 1920x1080 release check covers both 100% and 125% Windows display scaling where the environment permits.

### Settings surface

Settings renders through a portal as a fixed-position overlay anchored to the settings button on desktop and as a compact sheet on narrow windows. It does not share a class whose positioning can be overridden by card styles.

Opening settings must not change header or dashboard geometry. The surface includes theme/language/sound controls, manual PSU details, detector status, and the elevated-sensor retry. It supports Escape, outside-click close, focus containment, and focus restoration.

## Refresh and Error Behavior

- Static inventory is refreshed on startup and on explicit refresh.
- Lightweight load/GPU/sensor values refresh on the existing interval without re-enumerating all PnP devices each tick.
- A provider retains its last successful value briefly while showing a stale timestamp; it does not jump to zero on a transient error.
- After the stale window, the value becomes unavailable and the diagnostic explains why.
- Errors shown in the normal dashboard are concise. Detection Details exposes provider name, timestamp, duration, exit status, and a sanitized message.

## Packaging

- Tauri produces an x64 NSIS `AeroSpec Pro_*_x64-setup.exe` as the primary artifact.
- The helper binary and required license notices are included and verified from the installed application directory.
- The app and installer remain unsigned for this personal build, so the handoff explicitly notes that Windows SmartScreen may warn.
- Package version remains aligned across npm, Tauri, and UI. The installer is smoke-tested by launching the installed executable, loading a snapshot, opening settings, and closing cleanly.

## Test-Driven Implementation

### Rust tests

- Parse one-item and array-shaped PowerShell JSON sections.
- Parse PowerShell epoch dates and reject impossible dates.
- Preserve all three or more physical disks.
- Parse representative NVIDIA CSV with 8 GiB VRAM and unsupported fields.
- Merge provider results without wiping successful sections.
- Report timeout, non-zero exit, invalid JSON, and missing commands as provider diagnostics.

### Helper tests

- Serialize a deterministic fixture snapshot.
- Normalize sensor identifiers and reject ambiguous component matches.
- Return structured permission and provider errors without crashing.

### TypeScript/Vitest tests

- Map all variable-length device arrays and provenance.
- Keep missing live fields unavailable rather than inheriting simulator content.
- Keep PSU manual values labelled manual and isolated from simulation.
- Render independent power, network, and device states.

### Playwright and Tauri review

- Browser fixtures exercise three disks, an 8 GiB GPU, network, monitor, input, audio, manual PSU, provider errors, and long device names.
- At 1920x1080, opening settings leaves the header bounding box unchanged and creates no horizontal overflow.
- Existing 1024x700 and 1440x900 interaction, accessibility, theme, and screenshot coverage continues to pass.
- The final review is repeated in the actual Tauri/WebView2 window maximized on Full HD, because browser rendering alone is not the release gate.

## Delivery Order

1. Add parser/adapter tests and the versioned snapshot contract.
2. Implement Windows inventory and NVIDIA probes with diagnostics.
3. Refactor variable device rendering, PSU profile, and provenance states.
4. Fix the settings portal and Full-HD shell.
5. Build and integrate the sensor helper; verify graceful fallback and elevation flow.
6. Run unit, lint, production build, Rust, Playwright, and native visual checks.
7. Build and smoke-test the NSIS Setup executable, then provide its exact path and checksum.

## Acceptance Criteria

- The target machine shows its i3-12100F cache data, both 8 GiB G.Skill DIMMs with their real part numbers, RTX 2060 SUPER with 8 GiB VRAM, and all three physical disks with bus/health details.
- At least the active Intel Ethernet adapter, Acer monitor, Logitech mouse, keyboards, and audio devices appear when Windows reports them present.
- No value from the old Dell/i5 simulator profile appears in Live mode.
- PSU identity is either explicitly detected, explicitly manual, or explicitly unavailable; it is never guessed.
- Opening settings does not resize or break the header.
- A maximized Full-HD Tauri window has readable type, no concealed information or horizontal overflow, and no large accidental empty lower region.
- Failure of NVIDIA, LibreHardwareMonitor, PnP, or storage health probing degrades only that provider and remains explainable.
- The installed NSIS build launches and collects a snapshot, and the delivered Setup `.exe` has a recorded SHA-256 checksum.
