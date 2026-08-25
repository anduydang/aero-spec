# AeroSpec Native Detection and Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace AeroSpec's shallow WMI payload with a truth-preserving Windows/NVIDIA detector, render all supported devices cleanly at Full HD, fix the settings overlay, and deliver a smoke-tested NSIS Setup executable.

**Architecture:** Rust owns bounded static and dynamic provider commands with a versioned contract, per-provider diagnostics, and private device joining. React owns last-success/stale state and converts the native contract into a variable-cardinality UI model. The release remains current-user and unelevated; unsupported deep sensors and automatic PSU identity stay honest while a local manual PSU profile fills the one category Windows cannot identify reliably.

**Tech Stack:** Tauri 2/Rust, Windows PowerShell/CIM, Windows API, NVIDIA `nvidia-smi`, React 19/TypeScript, Vitest, Playwright with Microsoft Edge, NSIS.

**Command working directory:** Run every command in this plan from the `aero-spec` repository root unless the command provides an explicit path.

---

## File Map

- Create `src-tauri/src/telemetry/model.rs`: serialized v2 request/response and diagnostic types.
- Create `src-tauri/src/telemetry/parse.rs`: PowerShell JSON/date and NVIDIA CSV parsers plus validation bounds.
- Create `src-tauri/src/telemetry/process.rs`: fixed executable resolution, bounded child execution, timeout, and diagnostics.
- Create `src-tauri/src/telemetry/windows.rs`: embedded static/dynamic Windows scripts and provider mapping.
- Create `src-tauri/src/telemetry/nvidia.rs`: trusted NVIDIA discovery, query, and GPU joining.
- Create `src-tauri/src/telemetry/mod.rs`: Tauri command orchestration, generations, local-ID map, and status aggregation.
- Create `src-tauri/tests/fixtures/windows-target-redacted.json`: deterministic redacted target-machine parser fixture.
- Create `src-tauri/tests/fixtures/nvidia-rtx2060super.csv`: deterministic NVIDIA parser fixture.
- Modify `src-tauri/src/lib.rs`: register v2 commands and remove the legacy command implementation.
- Modify `src-tauri/Cargo.toml`: add only the Windows/CSV/process dependencies required by the modules.
- Create `src/types/nativeTelemetry.ts`: exact TypeScript mirror of the v2 wire contract.
- Create `src/data/nativeTelemetry.ts`: pure static/dynamic merge, stale-state, and UI-adapter functions.
- Create `src/hooks/useNativeTelemetry.ts`: startup/static refresh and visible-window 3-second dynamic polling.
- Modify `src/types/hardware.ts`: add `partial`, sourced variable storage/network/device collections, diagnostics, and PSU provenance.
- Modify `src/data/liveTelemetry.ts`: delegate live mapping to the v2 adapter and remove two-disk truncation.
- Modify `src/App.tsx`: use the telemetry hook and viewport-filling shell.
- Create `src/components/SettingsPopover.tsx`: portal-based settings surface and manual PSU form.
- Modify `src/components/Header.tsx`: anchored portal integration without layout participation.
- Modify `src/components/PsuAndPeripherals.tsx`: independent power/network/device sections.
- Modify `src/components/MotherboardSchematic.tsx`: render detected storage array and no fake live bay.
- Modify `src/data/inspectorGenerator.ts`: generate truthful per-device details.
- Modify `src/utils/advisorContext.ts`, `src/components/FlexCardModal.tsx`, and `src/utils/scoreCalculator.ts`: privacy allowlist and variable storage behavior.
- Modify `src/index.css`: Full-HD sizing, readable text, and overlay styles.
- Modify/add unit tests under `tests/unit/` and E2E tests under `tests/e2e/`.
- Modify `src-tauri/tauri.conf.json`: NSIS-only current-user bundle.
- Modify `README.md`: supported providers, honest limitations, install/run instructions.

### Task 1: Versioned Rust Contract and Pure Parsers

**Files:**
- Create: `src-tauri/src/telemetry/model.rs`
- Create: `src-tauri/src/telemetry/parse.rs`
- Create: `src-tauri/src/telemetry/mod.rs`
- Create: `src-tauri/tests/fixtures/windows-target-redacted.json`
- Create: `src-tauri/tests/fixtures/nvidia-rtx2060super.csv`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Write failing Rust tests for the v2 parser contract**

Add tests covering PowerShell epoch dates, one-object versus array normalization, i3-12100F L2/L3 cache values, two G.Skill DIMMs with part numbers, all three target disks, Intel I219-V network, Acer monitor, Logitech mouse, keyboard/audio categories, quoted NVIDIA CSV, `N/A`, and out-of-bounds omission. The fixture must replace hostname, serial/MAC/instance/UUID/PCI/local-ID values with stable tokens.

Initial fixture procedure: encode the non-sensitive target facts enumerated in the approved spec and replace every hostname, serial/MAC/instance/UUID/PCI/local-ID field with deterministic `<REDACTED_CATEGORY_N>` tokens. Mark fixture metadata `captureSource: "preimplementation-evidence"`. After Task 2 implements the collector, run the exact ignored capture test command in Task 2 Step 4, compare its sanitized printed JSON with this fixture, update differences through `apply_patch`, and change metadata to the capture date, Windows version, and provider schema version. Never persist or commit raw collector output.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `cargo test telemetry::parse --manifest-path src-tauri/Cargo.toml`

Expected: compile failure because `telemetry::parse` and v2 models do not exist.

- [ ] **Step 3: Implement the minimal models and pure parsers**

Implement `StaticSnapshotRequestV2`, `StaticSnapshotResponseV2`, `DynamicSnapshotRequestV2`, `DynamicSnapshotResponseV2`, nested query results, diagnostics, and field-unit names from the approved spec. Parser functions accept `&str`/`&[u8]`; they do not launch processes.

- [ ] **Step 4: Run focused and complete Rust tests**

Run: `cargo test telemetry::parse --manifest-path src-tauri/Cargo.toml`

Expected: PASS with the target and NVIDIA fixtures.

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: all Rust tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/telemetry src-tauri/tests/fixtures src-tauri/src/lib.rs
git commit -m "feat: define native telemetry v2 contract"
```

### Task 2: Bounded Windows Static Inventory

**Files:**
- Create: `src-tauri/src/telemetry/process.rs`
- Create: `src-tauri/src/telemetry/windows.rs`
- Modify: `src-tauri/src/telemetry/mod.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Write failing tests for provider isolation and limits**

Test that CPU, motherboard, DIMM, adapter, storage, network, display, input, and audio subquery results survive a sibling failure; output over 2 MiB is rejected; item 65 is truncated with `ITEM_LIMIT_EXCEEDED`; and invalid BIOS dates become absent with a diagnostic. Test stable category ordering across shuffled input; PnP deduplication by instance ID and by category-plus-normalized-manufacturer/name fallback; and 512-byte UTF-8 truncation on a valid code-point boundary with multibyte text. Add explicit cases for timeout, non-zero exit, invalid UTF-8, invalid JSON, missing executable, child-tree cancellation, and log/diagnostic redaction of paths, usernames, command lines, serials, and raw stderr.

- [ ] **Step 2: Run and verify RED**

Run: `cargo test telemetry::windows --manifest-path src-tauri/Cargo.toml`

Expected: FAIL because the Windows provider is not implemented.

- [ ] **Step 3: Implement the fixed Windows collector**

Use the OS-resolved `System32\WindowsPowerShell\v1.0\powershell.exe`. Emit one compressed JSON object whose subqueries have independent `try/catch` blocks. Gather:

- `Win32_ComputerSystem`/`Win32_OperatingSystem` system and uptime data.
- `Win32_Processor` core/thread/clock/L2/L3 data.
- `Win32_BaseBoard`, `Win32_BIOS`, and all `Win32_PhysicalMemory` identity fields.
- All `Win32_VideoController` identities excluding authoritative WMI VRAM display.
- `Get-PhysicalDisk` plus `Win32_DiskDrive` associations for model/capacity/bus/media/health/status.
- Active physical `Get-NetAdapter` results.
- Present `Get-PnpDevice` display, keyboard, mouse/pointing, audio endpoint/controller entries.

The process runner enforces fixed arguments, UTF-8, a 12-second timeout, 2 MiB stdout, 256 KiB stderr, sanitized error codes, and 512-byte strings truncated only at a valid UTF-8 boundary. Immediately after spawn it assigns the child to a kill-on-close Windows Job Object. Timeout or app exit closes/terminates the job and waits for the complete PowerShell/CIM process tree; a child that cannot be assigned is failed closed before collection proceeds. Keep execution normal-user; permission failures become diagnostics.

Before applying the 64-item cap, sort CPU/DIMM/display-adapter entries by private join key then normalized name, disks by device number then normalized model, networks by interface index then normalized name, and PnP devices by category then instance ID then normalized manufacturer/name. Deduplicate PnP first by instance ID; when missing, use category plus normalized manufacturer/name. Emit the original/returned count with every truncation diagnostic.

- [ ] **Step 4: Run focused tests and a local command smoke test**

Run: `cargo test telemetry::windows --manifest-path src-tauri/Cargo.toml`

Expected: PASS.

Run: `cargo test telemetry::windows::capture_target --manifest-path src-tauri/Cargo.toml -- --ignored --nocapture`

Expected: print one sanitized collector snapshot for comparison with the committed fixture; no raw identifiers or paths appear.

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/telemetry
git commit -m "feat: collect complete Windows hardware inventory"
```

### Task 3: NVIDIA and Dynamic Refresh Providers

**Files:**
- Create: `src-tauri/src/telemetry/nvidia.rs`
- Modify: `src-tauri/src/telemetry/process.rs`
- Modify: `src-tauri/src/telemetry/mod.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Write failing tests for discovery, joining, and generations**

Test exact PCI-bus joins; vendor/device/subsystem-plus-PnP-location fallback; the safe one-device name fallback; ambiguous multi-GPU diagnostics; deterministic private-key ordering; `LOCAL_ID_COLLISION`; NVIDIA absence as supported-neutral; rejected old generations; atomic identity-map replacement; dynamic output limits; and the exact query field order. Security cases must reject a reparse point at every path segment, a trusted but non-NVIDIA signer, a certificate whose organization is not exactly `NVIDIA Corporation`, and any failed/unknown `WinVerifyTrust` result.

- [ ] **Step 2: Run and verify RED**

Run: `cargo test telemetry::nvidia --manifest-path src-tauri/Cargo.toml`

Expected: FAIL because NVIDIA discovery and v2 commands do not exist.

- [ ] **Step 3: Implement dynamic command orchestration**

Resolve only System32 then Program Files NVSMI candidates. Reject every candidate containing a reparse point, canonicalize the handle path beneath the exact approved base, require `WinVerifyTrust` success, and require the Authenticode leaf certificate organization to equal exactly `NVIDIA Corporation`; any other trusted signer fails closed. Run the fixed query from the spec with a 2-second timeout, 256 KiB stdout, and 64 KiB stderr cap.

Register `get_static_snapshot_v2` and `get_dynamic_snapshot_v2`. Only one static provider collection runs at a time. Every overlapping static request attaches to that active collection while Rust tracks the newest requested generation. When the shared collection completes, each waiter receives the same immutable collected data with its own request generation echoed; under one state lock Rust commits `{newestGeneration, privateKeyToLocalId}` only for the newest waiter. The frontend rejects older echoed generations, so repeated refreshes coalesce without allowing an old response/map to win. Dynamic collection snapshots the accepted map/generation at start and rejects its response if that pair changed before completion. CPU load comes from the Windows dynamic provider.

- [ ] **Step 4: Verify Rust behavior**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: all Rust tests PASS, including RTX 2060 SUPER 8,192 MiB parsing.

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: PASS without warnings introduced by telemetry modules.

- [ ] **Step 5: Commit**

```bash
git add src-tauri
git commit -m "feat: add trusted NVIDIA live telemetry"
```

### Task 4: Frontend Merge Store and Variable Telemetry Model

**Files:**
- Create: `src/types/nativeTelemetry.ts`
- Create: `src/data/nativeTelemetry.ts`
- Create: `src/hooks/useNativeTelemetry.ts`
- Create: `tests/unit/nativeTelemetry.test.ts`
- Modify: `src/types/hardware.ts`
- Modify: `src/data/liveTelemetry.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing Vitest cases**

Assert mapping of both DIMM part numbers, all three disks, NVIDIA 8 GiB VRAM, network/devices, independent partial states, no WMI VRAM authority, generation rejection, 10/30-second stale transitions using injected monotonic time, immediate refresh after visibility restoration, visible stale age/badge data, and no simulator fallback.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/unit/nativeTelemetry.test.ts`

Expected: FAIL because v2 frontend modules do not exist.

- [ ] **Step 3: Implement pure merge/adapter functions and hook**

Use `storage.devices[]`, `networks[]`, and categorized connected devices. Keep source/status/diagnostics alongside UI values. Store `performance.now()` receipt time with each provider success and derive age from monotonic elapsed time rather than wall-clock subtraction. Expose `fresh | stale | unavailable` plus whole-second age to components so stale values render a visible `Stale · Ns` badge. `useNativeTelemetry` invokes static on startup/manual refresh and dynamic every three seconds only when visible; `visibilitychange` to visible triggers an immediate dynamic request before restarting the interval. Generation checks occur before state updates and browser preview resolves unavailable.

- [ ] **Step 4: Run frontend unit suite**

Run: `npm test -- tests/unit/nativeTelemetry.test.ts tests/unit/liveTelemetry.test.ts tests/unit/scoreCalculator.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types src/data src/hooks src/App.tsx tests/unit
git commit -m "feat: merge variable native telemetry safely"
```

### Task 5: Truthful Device, Storage, and Manual PSU UI

**Files:**
- Create: `src/hooks/usePsuProfile.ts`
- Create: `tests/unit/psuAndPeripherals.test.tsx`
- Modify: `src/components/PsuAndPeripherals.tsx`
- Modify: `src/components/MotherboardSchematic.tsx`
- Modify: `src/data/inspectorGenerator.ts`
- Modify: `src/data/mockData.ts`

- [ ] **Step 1: Write failing component tests**

Render fixtures for no PSU plus working network/devices, manual PSU provenance, three disks, long PnP names, category-level errors, and an `ITEM_LIMIT_EXCEEDED` diagnostic. Assert a missing PSU never hides other sections, truncation always produces a visible notice with returned/total counts, and no live fake upgrade bay exists.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/unit/psuAndPeripherals.test.tsx tests/unit/motherboardSchematic.test.tsx`

Expected: FAIL on current combined fallback and fixed storage slots.

- [ ] **Step 3: Implement dynamic cards and local PSU persistence**

Render independent Power, Network, and Connected Devices cards. Persist only `{brandModel,ratedWattage,efficiency,note}` under `aerospec.psu-profile.v1`; label it Manual and never synthesize draw/rail/fan fields. Render all returned storage devices in the schematic/list with bus, media, capacity, and health; do not show throughput or free bays in live mode. Any capped storage/network/PnP category renders an explicit "Showing 64 of N" notice sourced from `ITEM_LIMIT_EXCEEDED`.

- [ ] **Step 4: Run component and inspector tests**

Run: `npm test -- tests/unit/psuAndPeripherals.test.tsx tests/unit/motherboardSchematic.test.tsx tests/unit/nativeTelemetry.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components src/data src/hooks tests/unit
git commit -m "feat: show detected devices and manual PSU"
```

### Task 6: Portal Settings and Full-HD Shell

**Files:**
- Create: `src/components/SettingsPopover.tsx`
- Create: `tests/unit/settingsPopover.test.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Modify: `tests/e2e/settings.spec.ts`
- Modify: `tests/e2e/layout.spec.ts`

- [ ] **Step 1: Write failing interaction/layout tests**

Unit-test portal rendering, Escape, outside click, initial focus, Tab/Shift+Tab focus containment, focus return, and PSU form. In Playwright, record header/dashboard boxes before and after Settings at 1920x1080 and require at most 1 CSS px movement; require no horizontal overflow, core type at least 12px, and dashboard/footer gap thresholds.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/unit/settingsPopover.test.tsx`

Run: `npm run test:e2e -- tests/e2e/settings.spec.ts tests/e2e/layout.spec.ts --project=edge-1920`

Expected: current settings test fails because `.studio-card` changes positioning/header geometry.

- [ ] **Step 3: Implement the portal and viewport-filling layout**

Use `createPortal(..., document.body)`, a fixed anchored desktop panel, and narrow bottom sheet. Reuse/extend `useAccessibleDialog` to trap Tab and Shift+Tab within the open settings surface, set initial focus, and restore focus to the trigger. Move theme/language/sound, manual PSU, and detection details into it. Make the app a `min-height:100vh` flex column, main `flex:1`, wide columns `items-stretch`, normal page scrolling, and 12px minimum content text.

- [ ] **Step 4: Verify unit/E2E at all target viewports**

Run: `npm test -- tests/unit/settingsPopover.test.tsx tests/unit/dialogAccessibility.test.tsx`

Run: `npm run test:e2e -- tests/e2e/settings.spec.ts tests/e2e/layout.spec.ts`

Expected: PASS at 1024x700, 1440x900, and 1920x1080.

- [ ] **Step 5: Commit**

```bash
git add src/components src/App.tsx src/index.css tests
git commit -m "fix: stabilize settings and Full HD layout"
```

### Task 7: Privacy, Scoring, Advisor, and Export

**Files:**
- Modify: `tests/unit/advisorContext.test.ts`
- Create: `tests/unit/privacyBoundary.test.ts`
- Modify: `src/utils/advisorContext.ts`
- Modify: `src/utils/scoreCalculator.ts`
- Modify: `src/components/FlexCardModal.tsx`
- Modify: `src/components/AiAdvisorModal.tsx`

- [ ] **Step 1: Write failing privacy and scoring tests**

Feed serial, MAC, PnP ID, UUID, PCI location, hostname, snapshot ID, local ID, and path markers. Assert none enter Gemini/Flex Card strings. Assert live storage factor remains unavailable without measured throughput and GPU/NVIDIA values remain allowed.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/unit/privacyBoundary.test.ts tests/unit/advisorContext.test.ts tests/unit/scoreCalculator.test.ts`

Expected: FAIL until explicit allowlists and variable storage scoring exist.

- [ ] **Step 3: Implement shared export/AI allowlists**

Build context only from non-identifying names, capacity, speed, health category, and live sensor values. Flex Card consumes the same public summary. Remove any fixed primary-storage throughput assumption and do not add local IDs to logs or labels.

- [ ] **Step 4: Run all unit tests**

Run: `npm test`

Expected: all Vitest tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src tests/unit
git commit -m "fix: enforce telemetry privacy boundaries"
```

### Task 8: Browser and Native Tauri Visual Review

**Files:**
- Modify: `tests/e2e/visual-review.spec.ts`
- Modify: `tests/e2e/visual-review.spec.ts-snapshots/*`
- Modify: `tests/e2e/smoke.spec.ts`
- Create: `docs/review/aerospec-native-review.md`

- [ ] **Step 1: Extend failing E2E coverage**

Exercise three-drive/full-device simulator fixtures, manual PSU settings, all five themes, inspector, AI, Flex Card, provider-error states, stale values with visible age, privacy-redacted exports/context, and long names. Add screenshot targets at 1024, 1440, and 1920.

- [ ] **Step 2: Run and verify RED or intentional snapshot mismatch**

Run: `npm run test:e2e`

Expected: new assertions fail and screenshots differ before UI completion.

- [ ] **Step 3: Review and correct visual issues**

Set Windows display scaling to 100%, relaunch the actual Tauri debug app, maximize it on 1920x1080, and capture the client screenshot plus layout measurements. This 100% native check is a mandatory release gate. Inspect and correct clipping, dead space, density, card balance, and overlay placement. Then attempt the specified 125% procedure and record whether the environment allowed it; browser emulation is supplemental only. Restore the user's original scaling after review.

- [ ] **Step 4: Approve snapshots and rerun the full quality suite**

Run: `npm run test:e2e:update`

Visually inspect every changed snapshot, then run: `npm run test:e2e`

Expected: all Playwright tests PASS with reviewed screenshots.

Run: `npm run lint`

Run: `npm run build`

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: every command exits 0.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e docs/review src
git commit -m "test: review native telemetry interface"
```

### Task 9: NSIS Setup Build and Smoke Test

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `README.md`
- Create: `tests/unit/packageConfig.test.ts`

- [ ] **Step 1: Add a failing configuration assertion**

Create a unit/config test requiring `bundle.targets === "nsis"`, `installMode === "currentUser"`, aligned version `2.6.0`, and no sidecar/service/driver resources.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/unit/packageConfig.test.ts`

Expected: FAIL because the current target is `all` and NSIS mode is unspecified.

- [ ] **Step 3: Configure and document the personal installer**

Set NSIS-only current-user bundling. Document supported Windows/NVIDIA sources, manual PSU, unsupported CPU/mainboard sensors, normal-user behavior, and unsigned SmartScreen warning.

- [ ] **Step 4: Build, install, launch, and uninstall**

Run: `npx tauri build --bundles nsis`

Expected artifact: `src-tauri/target/release/bundle/nsis/AeroSpec Pro_2.6.0_x64-setup.exe` (actual bundler filename recorded verbatim).

Install the Setup normally, launch the installed app, verify the target-machine snapshot/settings, close it, and uninstall. Confirm no AeroSpec service, driver, or scheduled task exists and installed shortcuts/files are removed.

- [ ] **Step 5: Final verification and checksum**

Run: `npm test`

Run: `npm run test:e2e`

Run: `npm run lint`

Run: `npm run build`

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Run: `Get-FileHash -Algorithm SHA256 '<exact setup path>'`

Expected: all commands exit 0 and SHA-256 is recorded in the handoff.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/tauri.conf.json README.md tests/unit/packageConfig.test.ts
git commit -m "build: package AeroSpec NSIS installer"
```
