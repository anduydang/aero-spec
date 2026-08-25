# AeroSpec Trust and UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AeroSpec truthful about live hardware data, consistent in its scoring, easier to read, keyboard-accessible, and visually verified across target desktop sizes.

**Architecture:** Introduce pure telemetry adapter and scoring/context functions, then make React consume their explicit metadata rather than a mock-backed live object. Preserve the existing component structure and theme system while replacing the fixed viewport/header/footer behavior and adding a small reusable dialog accessibility hook. Unit tests cover data rules; Playwright covers user-visible integration and screenshots.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Tauri 2/Rust, Vitest, Testing Library, Playwright with installed Microsoft Edge.

**Design reference:** `docs/superpowers/specs/2026-08-25-aerospec-trust-ui-refresh-design.md`

---

## File Map

- `src/types/hardware.ts`: telemetry metadata, native payload, nullable/availability-aware contracts.
- `src/data/liveTelemetry.ts`: pure live baseline and native merge adapter.
- `src/data/mockData.ts`: simulator-only profiles with explicit simulated metadata.
- `src/utils/scoreCalculator.ts`: sole explainable overall scoring implementation.
- `src/utils/advisorContext.ts`: capability-aware Gemini prompt context.
- `src/hooks/useAccessibleDialog.ts`: Escape, initial focus, focus trap, and focus restoration.
- `src/App.tsx`: native loading/error state and responsive composition.
- `src/components/*`: truthful availability rendering, shared score, refreshed layout, settings, and accessible overlays.
- `src/index.css`: readable type scale, layout helpers, focus states, reduced-motion support.
- `src-tauri/src/lib.rs`: more accurate WMI parsing/adapter selection with Rust unit tests.
- `src-tauri/tauri.conf.json`, `package.json`: CSP and product metadata alignment.
- `vitest.config.ts`, `playwright.config.ts`, `src/test/setup.ts`, `tests/unit/*`, `tests/e2e/*`: automated coverage.

---

### Task 1: Establish Test Infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`
- Create: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Add test dependencies and scripts**

Install `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `@playwright/test`. Add scripts:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"test:e2e:update": "playwright test --update-snapshots"
```

- [ ] **Step 2: Configure Vitest**

Use the Vite React plugin, `jsdom`, globals, and `src/test/setup.ts`; include `tests/unit/**/*.test.{ts,tsx}`.

- [ ] **Step 3: Configure Playwright with installed Edge**

Use `channel: 'msedge'`, `baseURL: 'http://127.0.0.1:5173'`, a Vite development web server (`npm run dev -- --host 127.0.0.1`), trace on first retry, and Chromium projects for 1024×700, 1440×900, and 1920×1080. This must work from a clean checkout without a pre-existing `dist` directory.

- [ ] **Step 4: Write and run the initial smoke test**

Assert the document title and AeroSpec heading are visible. Run `npm run test:e2e -- tests/e2e/smoke.spec.ts`; expect PASS before product changes.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts playwright.config.ts src/test/setup.ts tests/e2e/smoke.spec.ts
git commit -m "test: add AeroSpec unit and browser test infrastructure"
```

---

### Task 2: Replace Mock-Backed Live State with an Explicit Adapter

**Files:**
- Modify: `src/types/hardware.ts`
- Create: `src/data/liveTelemetry.ts`
- Modify: `src/data/mockData.ts`
- Modify: `src/App.tsx`
- Create: `tests/unit/liveTelemetry.test.ts`

- [ ] **Step 1: Write failing baseline tests**

Test that `createLiveTelemetryBaseline()` returns `mode: 'live'`, `status: 'scanning'`, all capabilities false, and does not contain Dell/i5-8400 mock identity or nonzero sensor readings.

- [ ] **Step 2: Run the test and verify RED**

Run `npm test -- tests/unit/liveTelemetry.test.ts`; expect failure because `liveTelemetry.ts` does not exist.

- [ ] **Step 3: Add telemetry contracts and minimal baseline**

Add `TelemetryMode`, `DetectionStatus`, `TelemetryCapabilities`, `TelemetryMetadata`, and a typed `NativeHardwareTelemetryPayload`. Add `telemetry` to `HardwareTelemetryState`. Create a neutral baseline using `Unknown`/zero values only as internal placeholders; rendering must consult capabilities.

- [ ] **Step 4: Run the baseline test and verify GREEN**

Run the same test and expect PASS.

- [ ] **Step 5: Write failing native-merge tests**

Cover CPU current load/per-core loads, RAM speed/slots, board version/BIOS, GPU VRAM/discrete state, disk identities, supported capability flags, and missing-field behavior. Assert unsupported CPU sensors, PSU, network, peripherals, and storage sensors remain unavailable rather than copying simulator values.

- [ ] **Step 6: Run merge tests and verify RED**

Expect failure because `mergeNativeTelemetry()` is missing.

- [ ] **Step 7: Implement `mergeNativeTelemetry()` and App state flow**

Use the pure adapter in `App.tsx`; browser preview becomes `unavailable`, Tauri success becomes `ready`, and errors become `error`. Simulator profiles receive `mode: 'simulated'`, `status: 'ready'`, and all capabilities true. Remove `any` payload usage and the constant-truthiness board-name bug.

- [ ] **Step 8: Run unit tests and type build**

Run `npm test -- tests/unit/liveTelemetry.test.ts` and `npm run build`; expect PASS.

- [ ] **Step 9: Commit**

```bash
git add src/types/hardware.ts src/data/liveTelemetry.ts src/data/mockData.ts src/App.tsx tests/unit/liveTelemetry.test.ts
git commit -m "fix: separate live telemetry from simulator data"
```

---

### Task 3: Make Scoring Explainable and Consistent

**Files:**
- Modify: `src/utils/scoreCalculator.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/CopilotFooter.tsx`
- Modify: `src/components/FlexCardModal.tsx`
- Modify: `src/data/i18nData.ts`
- Modify: `src/types/hardware.ts`
- Create: `tests/unit/scoreCalculator.test.ts`
- Create: `tests/e2e/score-consistency.spec.ts`

- [ ] **Step 1: Write failing score-policy tests**

Cover all four simulator factors/high confidence, three-factor medium confidence, two-factor low confidence, fewer-than-two null score, persona weight renormalization, deterministic factor reasons, and priority sorting by `(100 - score) × weight`.

- [ ] **Step 2: Verify RED**

Run `npm test -- tests/unit/scoreCalculator.test.ts`; expect contract/assertion failures against the old function.

- [ ] **Step 3: Implement the new `HardwareScore` contract**

Return nullable score, grade including `—`, confidence, and factor records. Preserve the current persona heuristics but gate factors by capabilities and renormalize available weights.

- [ ] **Step 4: Verify GREEN**

Run score tests and the full unit suite; expect PASS.

- [ ] **Step 5: Add the score-consistency Playwright test and verify RED**

Switch to the Full simulator, open Flex Card, and assert its score equals the footer score. Run `npm run test:e2e -- tests/e2e/score-consistency.spec.ts` against the current UI and verify it fails before wiring the shared score.

- [ ] **Step 6: Make all UI surfaces consume the same score object**

Compute the score once in `App.tsx` from the active telemetry/persona and pass that exact `HardwareScore` object to `CopilotFooter` and `FlexCardModal`. Task 4 extends `AiAdvisorModal` to receive the same object when its context builder is introduced. Remove static score use from Flex Card and score fields from i18n where no longer needed. Replace the fake timer button with an expand/collapse details interaction.

- [ ] **Step 7: Verify the shared score GREEN**

Run the focused unit suite and `npm run test:e2e -- tests/e2e/score-consistency.spec.ts`; expect the exact score to match across both surfaces.

- [ ] **Step 8: Commit**

```bash
git add src/utils/scoreCalculator.ts src/App.tsx src/components/CopilotFooter.tsx src/components/FlexCardModal.tsx src/data/i18nData.ts src/types/hardware.ts tests/unit/scoreCalculator.test.ts tests/e2e/score-consistency.spec.ts
git commit -m "fix: unify AeroSpec hardware scoring"
```

---

### Task 4: Make Local Analysis and Gemini Context Honest

**Files:**
- Create: `src/utils/advisorContext.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/AiAdvisorModal.tsx`
- Modify: `src/components/DeepInspectorDrawer.tsx`
- Modify: `src/data/inspectorGenerator.ts`
- Create: `tests/unit/advisorContext.test.ts`

- [ ] **Step 1: Write failing advisor-context tests**

Assert unavailable Live fields are omitted, detected fields are included, simulated profiles are explicitly labeled simulated, and unsupported PSU/sensor values never enter the prompt.

- [ ] **Step 2: Verify RED**

Run `npm test -- tests/unit/advisorContext.test.ts`; expect missing-module failure.

- [ ] **Step 3: Implement context builder and consume it in the modal**

Create `buildAdvisorContext(telemetry, score)` and replace the handwritten interpolation block. `App.tsx` passes the same active `HardwareScore` from Task 3 into `AiAdvisorModal`; no modal-local score is calculated. Remove the shut-down `gemini-2.0-flash` fallback.

- [ ] **Step 4: Relabel deterministic analysis**

Change “Gemini … Hardware Engine” and component verdict labels to “Local compatibility analysis”. Remove numeric component AI scores and replace them with status/confidence observations derived from available data.

- [ ] **Step 5: Verify GREEN**

Run advisor tests and the full unit suite; expect PASS.

- [ ] **Step 6: Commit**

```bash
git add src/utils/advisorContext.ts src/App.tsx src/components/AiAdvisorModal.tsx src/components/DeepInspectorDrawer.tsx src/data/inspectorGenerator.ts tests/unit/advisorContext.test.ts
git commit -m "fix: label local analysis and filter AI context"
```

---

### Task 5: Improve the Native Windows Probe

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/types/hardware.ts` if payload alignment requires it
- Modify: `tests/unit/liveTelemetry.test.ts` if the typed fixture changes

- [ ] **Step 1: Add Rust tests before helper changes**

Extract/test pure helpers for BIOS release-date parsing and choosing a preferred discrete adapter from multiple WMI rows. Test that an NVIDIA/GeForce/Radeon RX adapter is preferred over an integrated Intel/AMD display adapter.

- [ ] **Step 2: Run Rust tests and verify RED**

Run `cargo test` from `src-tauri`; expect helper-not-found failures. If no Rust toolchain is configured, record the environment blocker and continue with static/type verification without claiming Rust tests passed.

- [ ] **Step 3: Implement probe improvements**

Query CPU `CurrentClockSpeed`, parse BIOS `ReleaseDate`, query all GPU adapters, map VRAM/driver, return RAM configured speed, and label RAM channel mode as inferred. Avoid Dell-specific default identities when WMI fails; return neutral Unknown values.

- [ ] **Step 4: Run Rust tests/check when available**

Run `cargo test` and `cargo check` from `src-tauri`; expect PASS when the toolchain exists.

- [ ] **Step 5: Re-run frontend adapter tests**

Run `npm test -- tests/unit/liveTelemetry.test.ts`; expect PASS with the finalized payload.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/lib.rs src/types/hardware.ts tests/unit/liveTelemetry.test.ts
git commit -m "fix: improve native hardware detection fidelity"
```

---

### Task 6: Add Reusable Dialog Accessibility

**Files:**
- Create: `src/hooks/useAccessibleDialog.ts`
- Modify: `src/components/AiAdvisorModal.tsx`
- Modify: `src/components/FlexCardModal.tsx`
- Modify: `src/components/DeepInspectorDrawer.tsx`
- Create: `tests/unit/dialogAccessibility.test.tsx`

- [ ] **Step 1: Write failing dialog behavior tests**

Render a minimal harness and assert labelled dialog semantics, initial focus, Tab/Shift+Tab containment, Escape close, and focus return to the trigger.

- [ ] **Step 2: Verify RED**

Run `npm test -- tests/unit/dialogAccessibility.test.tsx`; expect failure because the hook/semantics are missing.

- [ ] **Step 3: Implement the hook and wire all overlays**

Use a panel ref plus opener ref, capture the previously focused element, focus the first focusable control, trap Tab, close on Escape, restore focus, and lock body scroll. Add `role="dialog"`, `aria-modal`, heading IDs, and accessible labels for icon buttons.

- [ ] **Step 4: Verify GREEN**

Run dialog tests and full unit suite; expect PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAccessibleDialog.ts src/components/AiAdvisorModal.tsx src/components/FlexCardModal.tsx src/components/DeepInspectorDrawer.tsx tests/unit/dialogAccessibility.test.tsx
git commit -m "feat: make AeroSpec dialogs keyboard accessible"
```

---

### Task 7: Refresh Header, Dashboard, Footer, and Typography

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/SiliconMetrics.tsx`
- Modify: `src/components/PsuAndPeripherals.tsx`
- Modify: `src/components/MotherboardSchematic.tsx`
- Modify: `src/components/CopilotFooter.tsx`
- Modify: `src/components/AiAdvisorModal.tsx`
- Modify: `src/index.css`
- Create: `tests/e2e/layout.spec.ts`

- [ ] **Step 1: Write failing Playwright layout/behavior assertions**

At each target viewport assert no horizontal page overflow, core body text computes to at least 12 px, settings controls are inside a popover, the page can scroll when content exceeds height, browser Live preview reports unavailable rather than fake data, a cleared `aerospec_theme` defaults to Slate, and the first dashboard section follows the schematic at sub-1280 widths.

- [ ] **Step 2: Verify RED**

Run `npm run test:e2e -- tests/e2e/layout.spec.ts`; expect failures against the current fixed/dense layout.

- [ ] **Step 3: Implement header hierarchy**

Keep rig/persona/AI actions visible; move theme/language/sound into a keyboard-accessible settings popover; keep Flex Card compact. Show one persistent Live/Simulation/Unavailable status badge. Change the persisted-theme fallback in `App.tsx` from Arctic to Slate without overriding an existing user choice.

- [ ] **Step 4: Implement responsive layout and availability states**

Remove root `select-none`, `xl:h-screen`, and `xl:overflow-hidden`; replace the 12-column layout with explicit wide columns and top-stacked side panels. On smaller screens put the schematic first and metric panels after it. Unsupported cards show compact WMI-unavailable states.

- [ ] **Step 5: Apply readable type scale and focus/motion rules**

Raise normal text to 12–13 px, metadata to 11 px, titles to 14–16 px, reserve 10 px for badges, add visible `:focus-visible`, and respect `prefers-reduced-motion` for signal and pulse animations.

- [ ] **Step 6: Refresh footer and AI empty state**

Default footer shows score/confidence/verdict and two priority factors; details expand on demand. AI empty state uses three prompt cards and wrapped/scrollable prompts without accidental clipping.

- [ ] **Step 7: Verify GREEN in Playwright**

Run layout tests at all projects; expect PASS.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/components/Header.tsx src/components/SiliconMetrics.tsx src/components/PsuAndPeripherals.tsx src/components/MotherboardSchematic.tsx src/components/CopilotFooter.tsx src/components/AiAdvisorModal.tsx src/index.css tests/e2e/layout.spec.ts
git commit -m "feat: refresh AeroSpec desktop interface"
```

---

### Task 8: Align Metadata, CSP, and Local-Key Controls

**Files:**
- Modify: `package.json`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/Cargo.lock` if Cargo refreshes package metadata
- Modify: `src/components/Header.tsx`
- Modify: `src/components/FlexCardModal.tsx`
- Modify: `src/components/AiAdvisorModal.tsx`
- Create: `tests/e2e/settings.spec.ts`

- [ ] **Step 1: Write failing metadata/settings assertions**

Assert UI version is `2.6.0`, API-key panel states local persistence, saving shows a connected state, and clearing removes `aerospec_gemini_key` and returns to required state.

- [ ] **Step 2: Verify RED**

Run the focused Playwright test; expect failures because clear/disclosure behavior and aligned version are missing.

- [ ] **Step 3: Align metadata and CSP**

Set npm name/version, Tauri app version, and Rust crate version to `aero-spec`/`2.6.0` as applicable, and configure CSP for self/data/blob assets plus Gemini/AI Studio connections required by existing behavior.

- [ ] **Step 4: Add clear-key/disclosure UI**

Explain that the key stays in this app profile on this PC, provide a clear button, and never expose the key value after saving.

- [ ] **Step 5: Verify GREEN**

Run settings test; expect PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock src/components/Header.tsx src/components/FlexCardModal.tsx src/components/AiAdvisorModal.tsx tests/e2e/settings.spec.ts
git commit -m "chore: align AeroSpec metadata and local security controls"
```

---

### Task 9: Playwright Visual Review and Final Verification

**Files:**
- Create: `tests/e2e/visual-review.spec.ts`
- Create/update: `tests/e2e/visual-review.spec.ts-snapshots/*`
- Modify relevant source files only if a screenshot exposes a verified defect; add/update the failing assertion first.

- [ ] **Step 1: Add interaction coverage**

Exercise all five themes, simulator switching, settings, inspector, AI modal, Flex Card, Escape close, and keyboard focus containment.

- [ ] **Step 2: Generate baseline screenshots**

Capture Arctic and Slate dashboard screenshots at 1024×700, 1440×900, and 1920×1080 plus AI/inspector/Flex overlays at 1440×900. Inspect every image manually for clipping, unreadable contrast, large unintended gaps, and overlap.

- [ ] **Step 3: Run the complete Playwright suite**

Run `npm run test:e2e`; expect all projects PASS with no unexpected screenshot differences.

- [ ] **Step 4: Run fresh unit, lint, and build verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expect zero test failures, zero lint warnings/errors, and build exit code 0.

- [ ] **Step 5: Run Rust verification if available**

Run `cargo test` and `cargo check` under `src-tauri`. If unavailable, report the exact toolchain blocker without claiming native verification.

- [ ] **Step 6: Review repository state and requirements**

Use `git status --short`, `git diff --check`, and the design success criteria. Ensure generated browser profiles/test artifacts are ignored or removed and only intentional files remain.

- [ ] **Step 7: Commit final visual tests/fixes**

```bash
git add tests/e2e src tests package.json package-lock.json src-tauri
git commit -m "test: verify AeroSpec responsive interface"
```
