# AeroSpec Trust and UI Refresh Design

## Goal

Make AeroSpec trustworthy enough for personal PC-upgrade decisions and easier to read across common desktop window sizes, while preserving its distinctive PCB schematic, five themes, inspector drawer, AI advisor, and shareable Flex Card.

## Product Principles

1. Never present simulated, estimated, or unavailable hardware values as live sensor readings.
2. One hardware score must mean the same thing everywhere it appears.
3. The motherboard schematic remains the visual hero; surrounding panels support it instead of competing with it.
4. Compact desktop density is valuable, but normal information must remain readable at Windows display scaling.
5. AI branding appears only where a real Gemini request is involved; deterministic local rules are labeled as local analysis.

## Scope

### Included

- Introduce explicit telemetry mode, detection status, and capability metadata.
- Start Live mode from an empty/scanning baseline instead of `liveRigTelemetry` mock data.
- Map every value the Rust probe actually returns and mark unsupported sensor groups unavailable.
- Ensure AI context excludes unavailable or simulated values unless the user deliberately selects a simulator profile.
- Replace conflicting score sources with `calculateHardwareSynergyScore` as the single overall score engine.
- Remove fake component AI scores and the fake 600 ms diagnosis interaction.
- Refresh header, dashboard columns, footer, typography, modals, and responsive behavior.
- Add keyboard/focus accessibility to dialogs and restore text selection.
- Align product/package versions, enable a practical Tauri CSP, disclose local API-key persistence, and provide a clear-key action.
- Add unit tests plus Playwright interaction and screenshot coverage at 1024×700, 1440×900, and 1920×1080.

### Excluded

- LibreHardwareMonitor, HWiNFO shared-memory integration, kernel drivers, or another third-party sensor provider.
- Cloud accounts, telemetry upload, price scraping, or automatic purchase recommendations.
- A wholesale visual redesign or removal of existing themes.
- Rebuilding existing release binaries during this change.

## Telemetry Architecture

`HardwareTelemetryState` gains a `telemetry` metadata object:

```ts
type TelemetryMode = 'live' | 'simulated';
type DetectionStatus = 'scanning' | 'ready' | 'unavailable' | 'error';

interface TelemetryCapabilities {
  cpuIdentity: boolean;
  cpuLoad: boolean;
  cpuSensors: boolean;
  ramIdentity: boolean;
  ramTimings: boolean;
  motherboardIdentity: boolean;
  motherboardSensors: boolean;
  gpuIdentity: boolean;
  gpuSensors: boolean;
  storageIdentity: boolean;
  storageSensors: boolean;
  psu: boolean;
  network: boolean;
  peripherals: boolean;
}

interface TelemetryMetadata {
  mode: TelemetryMode;
  status: DetectionStatus;
  capabilities: TelemetryCapabilities;
  error?: string;
}
```

Live mode is initialized by `createLiveTelemetryBaseline()` with neutral placeholder values and all capabilities false. Browser preview resolves to `unavailable`; Tauri resolves to `ready` when the native command succeeds or `error` when it fails. Simulator profiles retain complete deterministic values and always use `mode: 'simulated'`, `status: 'ready'`, and all capability flags true.

`mergeNativeTelemetry()` is a pure function responsible for translating Rust snake-case output, populating supported values, and setting capabilities. This function is unit tested independently from React. Unsupported values are never inherited from a mock profile.

The Rust WMI query will map values it already obtains but the frontend currently ignores, including RAM speed, GPU VRAM, motherboard version, and CPU current load. BIOS release date parsing is fixed. GPU enumeration prefers a discrete adapter when one is present rather than blindly selecting the first adapter. RAM channel mode is labeled as an inferred topology rather than a guaranteed hardware channel state.

## Rendering Rules

Components check capability groups before rendering sensor values:

- Detected values receive a small `Live` source badge where useful.
- Simulator values receive one persistent `Simulation` badge at page level; individual cards do not repeat it.
- Unsupported groups render an honest compact unavailable state such as “Sensor unavailable via Windows WMI”.
- Scanning uses a status/skeleton state, never sample numbers.
- AI prompts include only detected fields in Live mode. Simulator prompts explicitly say the context is simulated.

## Unified Scoring

`calculateHardwareSynergyScore()` remains the only overall scoring function. It returns:

```ts
interface HardwareScore {
  score: number | null;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | '—';
  verdict: string;
  confidence: 'high' | 'medium' | 'low';
  factors: ScoreFactor[];
}

interface ScoreFactor {
  id: 'cpu' | 'ram' | 'gpu' | 'storage';
  score: number | null;
  weight: number;
  available: boolean;
  reason: string;
}
```

The existing persona weights remain the product policy: Dev `CPU 35 / RAM 35 / storage 15 / GPU 15`, Creator `GPU 45 / CPU 30 / RAM 15 / storage 10`, Esports `GPU 50 / CPU 30 / RAM 15 / storage 5`, and AI Lab `GPU 55 / CPU 25 / RAM 15 / storage 5`. A factor is available only when its required capability and source values are available: CPU needs identity, RAM needs identity plus inferred channel/capacity, GPU needs identity, and storage needs a detected throughput value. Unsupported factors receive `score: null` and are excluded from the calculation.

Available weights are renormalized to 100% before calculating the final score. Confidence is `high` with four available factors, `medium` with three, and `low` with two. Fewer than two available factors is insufficient and returns `score: null`, grade `—`, and a verdict requesting more detected data. The `reason` records the local rule that produced each factor score so details are explainable and testable.

Dashboard, footer, AI context, and Flex Card all consume the same result object. Inspector drawers show deterministic component observations without a separate numeric “AI score”.

The footer action becomes “View details” / “Thu gọn”, revealing additional factors without a fake loading animation or implied network call.

## Interface Design

### Header

- Keep brand, host, uptime, bus/detection status on the left.
- Keep rig profile, persona, and AI Advisor as primary controls.
- Move theme, language, and sound into a settings popover.
- Keep Flex Card as a compact secondary action.
- Use accessible labels for icon-only actions.

### Dashboard

- Use a responsive explicit three-column grid on wide screens: compact metrics, flexible schematic, compact peripherals.
- Side columns stack from the top; remove `justify-between` gaps.
- Allow normal page scrolling instead of globally clipping the viewport at `xl`.
- At widths below 1280 px, use a two-stage layout: schematic first, then metric panels in two columns; at narrow widths, use one column.
- Default theme becomes Slate while all five themes remain available.

### Typography and Density

- Normal content: 12–13 px minimum.
- Major card titles: 14–16 px.
- Metadata: 11 px minimum, with 10 px reserved for short badges only.
- Restore selection for hardware values and descriptions; keep selection disabled only on decorative controls and the exported card.

### Copilot Summary

- Show the unified score, confidence, verdict, and the two highest-priority available factors by default. Priority is descending weighted improvement opportunity: `(100 - factor.score) × factor.weight`.
- Reveal remaining factors on demand.
- Label the engine “Local compatibility analysis”; reserve Gemini naming for the advisor modal.

### Dialogs and Drawer

- Add `role="dialog"`, `aria-modal="true"`, labelled headings, Escape close, initial focus, focus trapping, and focus restoration.
- The AI empty state centers its explanation and presents three recommended prompt cards rather than a large blank transcript.
- Quick prompts wrap or form a visible horizontal carousel without appearing accidentally clipped.
- API-key settings state that the key is stored only on this PC and provide a clear-key action.

## Security and Product Metadata

- Set npm package name to `aero-spec`, and align npm/Tauri/UI version to `2.6.0`.
- Configure Tauri CSP for local scripts/styles/assets and Gemini/AI Studio network access required by current features.
- Keep local API-key persistence because this is a personal desktop app, but make storage behavior explicit and removable.
- Remove the shut-down `gemini-2.0-flash` fallback.

## Testing Strategy

### Unit tests (Vitest)

- Live baseline contains no mock hardware identity or sensor values.
- Native payload merge maps supported fields and capability flags.
- Missing native fields remain unavailable instead of falling back to mock data.
- Unified score is identical for dashboard and Flex Card consumers.
- Scores exclude unavailable factors and report reduced confidence.
- Advisor context excludes unavailable live values and identifies simulated context.

### Playwright

- Use installed Microsoft Edge through Playwright and run the Vite dev server automatically.
- Verify browser preview does not claim mock data is live.
- Switch to a simulator profile and verify dashboard/Flex Card score consistency.
- Exercise settings, all five themes, inspector, AI modal, Flex Card, Escape close, and keyboard focus containment.
- Capture review screenshots at 1024×700, 1440×900, and 1920×1080 in both Arctic and Slate themes.
- Assert there is no horizontal page overflow at the three target viewports.

### Final verification

- Unit test suite passes.
- Playwright suite passes.
- `npm run lint` has no warnings introduced by this change and existing relevant warnings are resolved.
- `npm run build` succeeds.
- `cargo check` runs when a Rust toolchain is available; otherwise the missing toolchain is reported explicitly.

## Success Criteria

- Live mode never displays mock sensor values as detected data.
- The same rig/persona has one score everywhere.
- No control pretends to perform AI or sensor work it does not perform.
- Core text is readable without relying on sub-11 px typography.
- Layout remains usable without horizontal overflow at all target viewports.
- Dialogs are usable by mouse and keyboard.
- Existing signature visuals and export capability remain intact.
