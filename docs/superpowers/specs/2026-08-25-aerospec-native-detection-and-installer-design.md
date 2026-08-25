# AeroSpec Native Detection, Full-HD Layout, and Installer Design

## Goal

Turn AeroSpec into a trustworthy personal Windows hardware viewer: show the supported CPU, motherboard/BIOS, DIMM, display-adapter, physical-disk, active-network, monitor, keyboard, pointing-device, and audio categories that Windows can identify; expose accurate NVIDIA telemetry when the installed driver supports it; keep unavailable data honest; remain visually composed in a maximized Full-HD Tauri window; and ship a usable NSIS Setup executable.

This design extends and supersedes the hardware-detection exclusions in `2026-08-25-aerospec-trust-ui-refresh-design.md`. Its trust, capability, privacy, and scoring rules remain in force except where this document is more specific.

## Evidence From the Current Build

- The native probe only queries processor, baseboard, BIOS, physical memory, video controller, and disk drive WMI classes. It has no contract for network adapters, monitors, keyboards, mice, audio devices, disk health, or detailed CPU/RAM fields.
- The frontend keeps only two native disks and renders a fixed third "upgrade" bay even when Windows reports three physical disks.
- GPU memory comes from the 32-bit `Win32_VideoController.AdapterRAM` field, which under-reports cards with more than 4 GiB.
- The BIOS date parser treats PowerShell's `/Date(milliseconds)/` value as calendar digits and can produce impossible dates.
- The live dashboard previously looked more complete because real results were shallow-merged over a simulated Dell/i5 profile. That fabrication has correctly been removed and must not return.
- The settings popover combines `absolute` with the shared `.studio-card { position: relative; }` rule. The latter wins, so opening settings makes the header grow dramatically instead of overlaying it.
- In a maximized 1920x1040 client area, the dashboard is compressed into the upper portion of the window while the lower portion is largely empty. Dense type and fixed card composition make it look stretched rather than intentionally responsive.
- Standard desktop Windows inventory exposes no dependable generic PSU model or wattage. A conventional PSU without USB/PMBus/vendor telemetry cannot be auto-detected honestly.

## Considered Approaches

### 1. Expand WMI only

Add more CIM/WMI and PowerShell queries and keep the existing Rust-to-React path.

Pros: smallest change and no helper process.

Cons: incomplete storage/PnP information and inaccurate large NVIDIA VRAM values if only the current classes are used.

### 2. Hybrid Windows inventory plus NVIDIA driver telemetry — selected

Use Windows CIM/storage/PnP sources for component identity and health, and NVIDIA's installed CLI for NVIDIA-only VRAM and dynamic telemetry. Each section reports availability independently.

Pros: complete everyday inventory, accurate RTX data on the target PC, no kernel driver, no admin prompt, small installer, and graceful degradation.

Cons: generic CPU/package temperature, motherboard voltage, and fan telemetry remain unavailable when Windows or a vendor driver does not expose them.

### 3. Bundle LibreHardwareMonitor or an always-elevated sensor service — rejected for this release

This could expose more low-level sensors, but the stable library can load a privileged hardware driver that Windows Defender may block. Secure elevation would also require a protected install location, explicit consent, authenticated IPC, driver cleanup, and a substantially larger self-contained .NET payload. A one-shot process does not remove those risks.

For this personal viewer, AeroSpec will not install, load, allowlist, or ask the user to unblock WinRing0, PawnIO, or another kernel driver. It will not elevate itself or a helper. Deep CPU/mainboard sensors remain explicitly unsupported. This decision can be revisited only in a separate design.

## Versioned Wire Contract

The two Rust commands return bounded UTF-8 JSON documents. Static and dynamic responses are merged into `NativeSnapshotV2` by the frontend store. Units are encoded in field names; numeric fields never contain formatted text.

```ts
type ProviderId =
  | 'windows-inventory'
  | 'windows-storage'
  | 'windows-pnp'
  | 'windows-dynamic'
  | 'nvidia';

type LeafStatus = 'ok' | 'unsupported' | 'permission-required' | 'error';
type SectionStatus = 'ok' | 'partial' | 'unsupported' | 'permission-required' | 'error';
type SnapshotStatus = 'ready' | 'partial' | 'unavailable' | 'error';
type DataSource = 'windows' | 'nvidia' | 'manual' | 'simulator';

interface ProviderDiagnostic {
  provider: ProviderId;
  status: SectionStatus;
  capturedAt: string;       // RFC 3339 UTC
  durationMs: number;
  code?: string;            // allowlisted internal code, max 64 chars
  message?: string;         // sanitized display text, max 240 chars
}

interface Section<T> {
  status: SectionStatus;
  capturedAt: string;       // RFC 3339 UTC
  durationMs: number;
  data: T | null;
  diagnostic?: ProviderDiagnostic;
}

interface QueryResult<T> {
  status: LeafStatus;
  data: T | null;
  diagnostic?: ProviderDiagnostic;
}

interface NativeSnapshotV2 {
  schemaVersion: 2;
  snapshotId: string;       // random UUID, not hardware-derived
  inventoryGeneration: number;
  capturedAt: string;       // newest section timestamp, RFC 3339 UTC
  status: SnapshotStatus;
  inventory: Section<InventoryData>;
  storage: Section<StorageData>;
  pnp: Section<PnpData>;
  dynamic: Section<DynamicData>;
  nvidia: Section<NvidiaData>;
}

interface StaticSnapshotRequestV2 {
  schemaVersion: 2;
  generation: number;       // monotonically increasing frontend request ID
}
interface StaticSnapshotResponseV2 {
  schemaVersion: 2;
  generation: number;       // exact echo of request generation
  snapshotId: string;
  capturedAt: string;
  inventory: Section<InventoryData>;
  storage: Section<StorageData>;
  pnp: Section<PnpData>;
}

interface DynamicSnapshotRequestV2 {
  schemaVersion: 2;
  generation: number;       // monotonically increasing dynamic request ID
  inventoryGeneration: number;
}
interface DynamicSnapshotResponseV2 {
  schemaVersion: 2;
  generation: number;       // exact echo of request generation
  inventoryGeneration: number;
  capturedAt: string;
  dynamic: Section<DynamicData>;
  nvidia: Section<NvidiaData>;
}

interface InventoryData {
  system: QueryResult<SystemDevice>;
  cpu: QueryResult<CpuDevice>;
  motherboard: QueryResult<MotherboardDevice>;
  memoryModules: QueryResult<MemoryModule[]>;
  displayAdapters: QueryResult<DisplayAdapter[]>;
}

interface SystemDevice {
  localId: string;
  hostName?: string;        // sensitive, local header/details only
  osName?: string;
  osVersion?: string;
  uptimeSeconds?: number;
}

interface CpuDevice {
  localId: string;
  name: string;
  manufacturer?: string;
  physicalCores?: number;
  logicalProcessors?: number;
  maxClockMhz?: number;
  l2CacheKib?: number;
  l3CacheKib?: number;
}

interface MotherboardDevice {
  localId: string;
  manufacturer?: string;
  product?: string;
  version?: string;
  biosVendor?: string;
  biosVersion?: string;
  biosReleaseDate?: string; // YYYY-MM-DD
}

interface MemoryModule {
  localId: string;
  bankLabel?: string;
  deviceLocator?: string;
  capacityBytes: number;
  configuredSpeedMtps?: number;
  manufacturer?: string;
  partNumber?: string;
  serialNumber?: string;    // sensitive, local details only
}

interface DisplayAdapter {
  localId: string;
  pnpInstanceId?: string;   // sensitive, local details only
  name: string;
  vendorId?: string;
  deviceId?: string;
  subsystemId?: string;
  pciBusId?: string;
  driverVersion?: string;
}

interface StorageData { devices: QueryResult<StorageDevice[]> }
interface StorageDevice {
  localId: string;
  deviceNumber?: number;
  pnpInstanceId?: string;   // sensitive, local details only
  model: string;
  serialNumber?: string;    // sensitive, local details only
  capacityBytes: number;
  mediaType?: 'ssd' | 'hdd' | 'unspecified';
  busType?: string;
  health?: 'healthy' | 'warning' | 'unhealthy' | 'unknown';
  operationalStatus?: string[];
}

interface PnpData {
  networks: QueryResult<NetworkDevice[]>;
  displays: QueryResult<PnpDevice[]>;
  inputDevices: QueryResult<PnpDevice[]>;
  audioDevices: QueryResult<PnpDevice[]>;
}
interface NetworkDevice {
  localId: string;
  name: string;
  interfaceName?: string;
  linkSpeedBps?: number;
  mediaType?: string;
  macAddress?: string;      // sensitive, local details only
  connected: boolean;
}
interface PnpDevice {
  localId: string;
  instanceId?: string;      // sensitive, local details only
  name: string;
  category: 'display' | 'keyboard' | 'pointing' | 'audio';
  manufacturer?: string;
  status?: string;
}

interface DynamicData { cpuLoadPercent?: number }
interface NvidiaData { gpus: NvidiaGpu[] }
interface NvidiaGpu {
  localId: string;
  uuid?: string;            // sensitive, local details only
  pciBusId?: string;
  name: string;
  driverVersion?: string;
  memoryTotalMib?: number;
  temperatureC?: number;
  utilizationPercent?: number;
  powerDrawW?: number;
  powerLimitW?: number;
  graphicsClockMhz?: number;
  fanSpeedPercent?: number;
}
```

Tauri exposes exactly `get_static_snapshot_v2(request: StaticSnapshotRequestV2)` and `get_dynamic_snapshot_v2(request: DynamicSnapshotRequestV2)`. Rust keeps only the active inventory-generation identity map and in-flight/coalescing handles; it does not retain display values. The frontend telemetry store owns current values, last-success timestamps, stale expiry, and the merged `NativeSnapshotV2`. It accepts a response only when its echoed generation equals the latest requested generation. A dynamic response is also rejected when its `inventoryGeneration` is not the currently accepted static generation.

Status/data invariants are strict:

- A leaf `ok` requires non-null data. Empty arrays are valid data.
- Leaf `unsupported`, `permission-required`, and `error` require null data plus an appropriate diagnostic except for expected `unsupported` capability absence.
- Section `ok` requires non-null data and every contained leaf to be either `ok` or expected `unsupported`.
- Section `partial` requires non-null data with at least one successful leaf and at least one failed or permission-required leaf.
- Section `unsupported`, `permission-required`, and `error` require null data. A section never returns partial data under an error status.
- Failure of one inventory or PnP subquery cannot discard another subquery's successful result; the parent becomes `partial`.

Arrays are sorted deterministically, capped at 64 entries per category, and strings are capped at 512 UTF-8 bytes before frontend rendering. If more than 64 items exist, the first 64 after the provider-specific stable sort are returned and `ITEM_LIMIT_EXCEEDED` reports the original/returned counts; the UI displays a truncation notice. The entire payload is capped at 2 MiB.

Validation bounds are inclusive. Out-of-bounds values are omitted and produce `VALUE_OUT_OF_RANGE` rather than being clamped:

| Field family | Valid range |
| --- | --- |
| Physical/logical CPU count | 1–4,096 |
| CPU/GPU clock | 0–100,000 MHz; CPU maximum must be at least 1 MHz |
| CPU cache | 1–1,073,741,824 KiB |
| DIMM speed | 1–20,000 MT/s |
| DIMM/disk capacity | 1 MiB–16 PiB |
| Uptime | 0–3,155,760,000 seconds |
| Load/utilization/fan | 0–100 percent |
| Temperature | -50–250 °C |
| GPU power draw/limit | 0–10,000 W |
| Network link speed | 0–1,000,000,000,000,000 bps |

`ready` means core CPU/system inventory succeeded and all expected Windows sections are usable. `partial` means core inventory succeeded but an expected Windows leaf/section failed, or an expected dynamic provider has been stale for more than 10 seconds or unavailable for more than 30 seconds. A dynamic failure while its prior value is no more than 10 seconds old leaves aggregate status ready; the value is still fresh. `unavailable` means the command is running outside supported Windows/Tauri conditions. `error` means no usable core CPU/system inventory was returned. An absent NVIDIA adapter yields `nvidia.status = unsupported` and never makes the snapshot partial.

## Provider and Identity Rules

Windows inventory, Windows storage, Windows PnP, Windows dynamic load, and NVIDIA are separate providers even if several are collected by one fixed PowerShell script. Their errors and timestamps remain independent.

`localId` is a non-identifying, session-scoped ordinal such as `gpu:0` or `disk:2`. Before assignment, each category is sorted by its private provider join key and then normalized display name; the private key never enters `localId`. IDs remain stable for the accepted static inventory generation but may change after a topology-changing static refresh or app restart. Rust keeps the private raw-key-to-local-ID map only in memory so dynamic NVIDIA results can reference the accepted static generation. If two private keys collide, ordinal tie-breaking is deterministic and `LOCAL_ID_COLLISION` is recorded. `localId` is still excluded from AI, exports, and logs as defense in depth.

- Windows is authoritative for CPU, board, DIMM, storage, network, display, and connected-device identity.
- NVIDIA is authoritative only for matched NVIDIA VRAM, driver, temperature, utilization, power, clock, and fan fields. It does not overwrite the Windows PnP identity.
- WMI `AdapterRAM` is neither rendered nor scored as VRAM. If NVIDIA telemetry is absent, VRAM is unavailable instead of displaying the known 32-bit WMI value as authoritative.
- GPU joins prefer an exact PCI bus ID, then an exact vendor/device/subsystem tuple plus PnP location. A one-to-one name fallback is allowed only when exactly one NVIDIA device exists on each side. Ambiguous matches stay separate and emit `GPU_JOIN_AMBIGUOUS`.
- Storage joins use Windows disk/device-number associations and PnP instance IDs, never model name alone.
- PnP entries deduplicate by instance ID. When it is missing, category plus normalized manufacturer/name is the fallback and the first non-empty value wins.
- A field keeps the source that supplied it. Later provider failure never overwrites a last successful value with zero or a simulator value.

## Detection and Process Security

### Windows providers

The inventory script emits one versioned object; every provider block has its own `try/catch`. BIOS dates parse PowerShell epoch milliseconds first and conventional dates second. Storage uses `Get-PhysicalDisk` plus Windows disk associations. PnP queries collect active physical network adapters and present display, keyboard, pointing, and audio classes, then filter and deduplicate them.

Rust resolves Windows PowerShell only from the system Windows directory returned by the OS API: `System32\WindowsPowerShell\v1.0\powershell.exe`. It never uses `PATH`, a user-provided executable, or user-controlled script text. The script is embedded or written to an application-owned bounded input, and all arguments are fixed.

### NVIDIA provider

Rust searches `nvidia-smi.exe` in this order only: (1) `<GetSystemDirectoryW>\nvidia-smi.exe`, then (2) `<FOLDERID_ProgramFiles>\NVIDIA Corporation\NVSMI\nvidia-smi.exe`. The folders come from Windows APIs, not environment variables. For each candidate it obtains the final canonical handle path, requires it to remain beneath the expected base, and rejects any reparse point in the candidate path. Execution additionally requires `WinVerifyTrust` success and an Authenticode leaf-certificate subject whose organization is exactly `NVIDIA Corporation`; another merely trusted signer is rejected. It never executes a PATH match.

The exact query is:

```text
--query-gpu=uuid,pci.bus_id,name,memory.total,temperature.gpu,utilization.gpu,power.draw,power.limit,clocks.current.graphics,fan.speed,driver_version --format=csv,noheader,nounits
```

CSV `N/A`, `[Not Supported]`, blank, non-finite, or out-of-range values become absent fields with diagnostics. The parser handles quoted names and invariant decimal points.

### Child-process limits

- Static Windows collection: 12-second timeout, 2 MiB stdout, 256 KiB stderr.
- NVIDIA/dynamic collection: 2-second timeout per process, 256 KiB stdout, 64 KiB stderr.
- Output is decoded as strict UTF-8 after PowerShell is instructed to emit UTF-8; invalid output is a provider error.
- Only one static and one dynamic collection may be in flight. A repeated refresh coalesces onto the current request.
- Processes are assigned to a Windows Job Object so timeout or app exit terminates the complete process tree.
- Raw stdout/stderr is never logged. Diagnostics map failures to fixed codes and short redacted messages.

## Refresh Protocol

- Static inventory/storage/PnP runs at startup and on explicit refresh only.
- Windows CPU load and NVIDIA telemetry run every 3 seconds while the window is visible; polling pauses while hidden/minimized and resumes immediately when visible.
- A dynamic value is fresh through 10 seconds after its provider timestamp, stale from 10 through 30 seconds, and unavailable after 30 seconds.
- During the stale window the last success remains visible with a `Stale` badge and age. A failed refresh never produces zero.
- Frontend requests include a monotonic generation number. Older completions cannot overwrite a newer explicit refresh.
- `capturedAt` is provider completion time in UTC; snapshot time is the maximum contained timestamp. UI age uses a monotonic elapsed timer after receipt to avoid wall-clock jumps.

## PSU and Storage Scoring

Automatic PSU detection is out of scope for this release because none of the selected providers has a trustworthy generic PSU contract. AeroSpec never derives wattage or model from system power draw.

The right panel therefore has exactly two live PSU states: a local manual profile, or unavailable. The profile contains brand/model, rated wattage, efficiency rating, and note; it is stored under `aerospec.psu-profile.v1` and labelled `Manual`. PSU sensor fields remain unavailable.

No selected provider measures storage throughput. Therefore the live storage performance factor remains unavailable and is excluded by the existing score renormalization rule. Health, bus type, and media type are descriptive only. The live UI removes the fabricated fixed upgrade bay because Windows cannot reliably enumerate free motherboard/storage slots. Simulator profiles may show a simulated upgrade bay only when clearly labelled Simulation.

## Frontend Rendering

Adapters remain pure and unit-testable. Simulator profiles use the same view model but remain permanently marked `simulator`; live adapters cannot import or read simulator defaults.

Storage cards render every `storage.devices[]` item, subject only to the documented safety cap. The right column contains independent sections:

1. Power supply: manual or honest unavailable state.
2. Network: active adapters and link state.
3. Connected devices: displays, input, and audio summaries with expandable local details.

A missing PSU never hides network or device results. Adjacent values may share a small `Windows`, `NVIDIA`, or `Manual` badge; unsupported sensor groups show one concise unavailable state rather than rows of dashes.

## Privacy Boundary

Serial numbers, MAC addresses, PnP instance IDs, NVIDIA UUIDs, PCI locations, host names, snapshot IDs, session `localId` values, local paths, and raw diagnostics are sensitive-local fields.

- They may appear only in an explicitly expanded local Detection Details/component-details view.
- Gemini prompts use an allowlist of marketing component name, capacity, speed, health category, and non-identifying load/temperature/power values. They exclude every sensitive-local field.
- Flex Card/export uses the same allowlist and excludes host name by default. Adding identifying data requires a separate explicit opt-in not included here.
- Application logs contain provider, fixed error code, status, duration, and schema version only. They never contain raw command output or sensitive-local values.
- Automated screenshots use synthetic fixture identifiers. AeroSpec does not upload screenshots.
- A sanitized message is selected from fixed application-owned text for a known error code. Unknown stderr becomes `PROVIDER_FAILED`; paths, command lines, account names, and raw exception text are not displayed or persisted.

## Full-HD and Settings UI

### App shell

- The shell uses `min-height: 100vh` and a column layout; the main dashboard grows to consume the space between header and footer.
- At wide desktop sizes, the three columns stretch together. The bottom of the primary dashboard remains within 96 CSS px of the footer and no unintentional blank band between them exceeds 20% of viewport height.
- Side panels retain readable width while the schematic receives flexible space. Core information text is at least 12 CSS px; 10–11px is reserved for short labels/badges.
- Vertical scrolling remains available when scaling or content requires it; root overflow clipping may not conceal component data.

### Settings surface

Settings renders through a portal as a fixed-position overlay anchored to its button on desktop and a compact sheet below 768 CSS px. It does not share a class whose positioning can be overridden by card styles.

Opening settings must not change the header or dashboard bounding boxes by more than 1 CSS px. The surface includes theme/language/sound controls, the manual PSU profile, and Detection Details. It supports Escape, outside-click close, focus containment, and focus restoration.

## Packaging

- `bundle.targets` changes from `all` to `nsis`; no MSI is required.
- NSIS uses `installMode: currentUser`, so neither installation nor app launch requests administrator rights. The app installs under the normal Tauri current-user location.
- There is no external binary, .NET runtime, sensor helper, service, scheduled task, or kernel driver in this release.
- The app and installer remain unsigned for this personal build, so handoff states that Windows SmartScreen may warn.
- Package versions remain aligned across npm, Tauri, and UI.
- Release verification installs normally, launches the installed executable, collects a snapshot, opens settings, closes cleanly, uninstalls, and confirms the app directory and shortcuts are removed. It also asserts that no AeroSpec service/driver/task was created.

## Test-Driven Implementation

### Rust tests

- Parse one-item and array-shaped PowerShell JSON sections.
- Parse PowerShell epoch dates and reject impossible dates.
- Preserve all three or more physical disks.
- Parse representative quoted NVIDIA CSV with 8 GiB VRAM and unsupported fields.
- Join GPU providers deterministically and report ambiguity.
- Aggregate statuses without treating a non-NVIDIA machine as partial.
- Retain last success through stale time and reject older generations.
- Report timeout, oversized output, non-zero exit, invalid UTF-8/JSON, failed trust verification, and missing commands using fixed diagnostics.
- Redact sensitive values from diagnostics and logs.

### TypeScript/Vitest tests

- Map all variable-length arrays, units, statuses, and provenance.
- Keep missing live fields unavailable rather than inheriting simulator content.
- Keep PSU manual values labelled manual and isolated from simulation.
- Exclude storage performance when no throughput exists.
- Exclude sensitive-local fields from AI and Flex Card allowlists.
- Render power, network, and device states independently.

### Playwright and Tauri review

- Browser fixtures exercise three disks, an 8 GiB GPU, network, monitor, input, audio, manual PSU, provider errors, long names, stale data, and privacy redaction.
- At 1920x1080, opening settings changes the header bounding box by at most 1 CSS px, creates no horizontal overflow, retains 12px core type, and meets the dashboard/footer blank-space thresholds.
- Existing 1024x700 and 1440x900 interaction, accessibility, theme, and screenshot coverage continues to pass.
- Native 100% procedure: set Windows scaling to 100%, relaunch and maximize Tauri on 1920x1080, capture the client screenshot and bounding-box probe, and exercise settings/details.
- Native 125% procedure: set scaling to 125%, sign out/relaunch if Windows requires it, repeat the same checks, then restore the original setting. If changing the host setting is unavailable, the release notes explicitly mark only this manual check unverified; browser emulation is supplemental, not a substitute.

## Reproducible Target-Machine Evidence

The repository stores redacted raw-provider fixtures for the target machine. Serial numbers, MACs, UUIDs, host/user names, and PnP instance IDs are replaced with stable fixture tokens before commit. Acceptance compares parsed output with those fixtures rather than relying on remembered values.

Expected fixture facts are conditional on the provider returning them during capture:

- Intel Core i3-12100F, 5,120 KiB L2 and 12,288 KiB L3.
- Two 8 GiB G.Skill DIMMs at 2,667 MT/s with part numbers `F4-2666C19-8GIS` and `F4-2666C19-8GVR`.
- RTX 2060 SUPER with 8,192 MiB reported by NVIDIA.
- Three physical disks: 120 GB SATA SSD, 250 GB SATA disk, and 500 GB NVMe SSD, with Windows-reported health.
- Active Intel I219-V Ethernet, Acer monitor, Logitech mouse, keyboards, and audio devices when they remain present at capture time.

A hardware item removed or disabled after fixture capture is a documented environmental difference, not a parser failure. Parser tests always use the recorded fixture.

## Delivery Order

1. Add parser/adapter tests and the versioned snapshot contract.
2. Implement bounded Windows and NVIDIA providers, joining, status aggregation, refresh, and privacy filters.
3. Refactor variable device rendering, manual PSU, provenance, and live scoring behavior.
4. Fix the settings portal and Full-HD shell.
5. Run unit, lint, production build, Rust, Playwright, and native visual checks; fix review findings.
6. Build, install, smoke-test, uninstall, and deliver the NSIS Setup executable with its SHA-256 checksum.

## Acceptance Criteria

- Redacted target-machine capture and parser fixtures satisfy the reproducible facts above; any conditional provider omission is shown as unavailable with a diagnostic rather than guessed.
- No value from the old Dell/i5 simulator profile appears in Live mode.
- Every disk returned within the documented 64-item cap is rendered; truncation is visible, no real array is arbitrarily sliced to two, and no fake free bay is shown.
- PSU identity is explicitly manual or explicitly unavailable; no detected/guessed state is presented in this release.
- Opening settings does not change header/dashboard geometry by more than 1 CSS px.
- Maximized Full-HD Tauri at 100% passes the overflow, 12px type, 96px footer-gap, and 20%-blank-band thresholds. The 125% check is passed or explicitly identified as the only environment-blocked manual check.
- Overlapping refreshes, stale expiry, NVIDIA absence/failure, ambiguous GPU matching, oversized/invalid output, and privacy redaction are covered by automated tests.
- No test or release flow requests UAC, installs a service/driver/task, or asks Windows Defender to allow a vulnerable driver.
- The installed NSIS build launches and collects a snapshot; uninstall removes its installed files/shortcuts; the delivered Setup `.exe` has a recorded SHA-256 checksum.
