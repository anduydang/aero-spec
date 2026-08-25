# AeroSpec Distinct Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace AeroSpec's five near-identical palette themes with five distinct, offline-capable desktop art directions and verify them in Playwright and the actual Tauri window.

**Architecture:** Put theme identity, legacy migration, and localized metadata in a focused `themeConfig` module. Keep components theme-agnostic by expanding semantic CSS tokens/classes, while a dedicated `ThemePicker` renders accessible preview radios. Move modal shells from hard-coded Slate utilities to semantic surfaces; keep the exported Flex Card itself intentionally dark.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Vitest/Testing Library, Playwright with Edge, Tauri 2/WebView2, `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`.

**Working directory:** Run every command from the `aero-spec` repository root unless a step explicitly says otherwise.

---

## File Map

- Create `src/theme/themeConfig.ts`: valid IDs, metadata, legacy migration, storage normalization.
- Create `src/components/ThemePicker.tsx`: accessible theme preview-card radio group.
- Create `tests/unit/themeConfig.test.ts`: theme parsing and migration contract.
- Create `tests/unit/themePicker.test.tsx`: accessible selection contract.
- Create `THIRD_PARTY_LICENSES.md`: bundled font attribution and license links.
- Modify `src/types/hardware.ts`: replace legacy `ThemeType` IDs.
- Modify `src/App.tsx`: initialize normalized theme, apply appearance classes, persist new ID.
- Modify `src/components/MotherboardSchematic.tsx`: replace legacy theme-ID color branches with semantic trace tokens.
- Modify `src/components/Header.tsx`: use `ThemePicker` instead of a native select.
- Modify `src/index.css`: local fonts, five full token sets, semantic surfaces and theme-specific treatments.
- Modify `src/components/AiAdvisorModal.tsx`, `DeepInspectorDrawer.tsx`, `FlexCardModal.tsx`, and `MarkdownRenderer.tsx`: remove app-shell hard-coded Slate styling.
- Modify `tests/e2e/layout.spec.ts`, `settings.spec.ts`, and `visual-review.spec.ts`: new default, picker behavior, persistence, screenshots.
- Replace legacy PNGs under `tests/e2e/visual-review.spec.ts-snapshots/` with deterministic new baselines.
- Modify `package.json` and `package-lock.json`: bundle the two OFL variable fonts.

### Task 1: Theme identity and legacy migration

**Files:**
- Create: `src/theme/themeConfig.ts`
- Create: `tests/unit/themeConfig.test.ts`
- Modify: `src/types/hardware.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/MotherboardSchematic.tsx`
- Modify: `tests/e2e/layout.spec.ts`
- Modify: `tests/e2e/settings.spec.ts`

- [ ] **Step 1: Write the failing theme configuration tests**

Cover `THEME_IDS`, `DEFAULT_THEME`, all five legacy mappings, unknown/malformed/null fallback to `obsidian`, and bilingual labels. Use table-driven cases such as:

```ts
expect(resolveStoredTheme('slate')).toBe('obsidian')
expect(resolveStoredTheme('arctic')).toBe('blueprint')
expect(resolveStoredTheme('not-a-theme')).toBe('obsidian')
expect(resolveStoredTheme(null)).toBe('obsidian')
```

- [ ] **Step 2: Run the new unit test and verify RED**

Run: `npm.cmd test -- tests/unit/themeConfig.test.ts`

Expected: FAIL because `src/theme/themeConfig.ts` does not exist.

- [ ] **Step 3: Implement the minimal theme model**

Define the new union in `src/types/hardware.ts`. In `themeConfig.ts`, export the ordered IDs, default, branded names, localized descriptors, three preview swatches, and a pure `resolveStoredTheme(value: string | null): ThemeType`.

- [ ] **Step 4: Update App initialization and root classes**

Initialize state with `resolveStoredTheme(localStorage.getItem('aerospec_theme'))`. On change, remove only known legacy/current theme and appearance classes, add `theme-${theme}`, add `.dark` for `obsidian`, `terminal`, and `tokyo`, then persist the normalized ID.

Replace `MotherboardSchematic` branches on legacy IDs with semantic CSS trace variables so the new union compiles and future themes do not require component conditionals.

- [ ] **Step 5: Update default and persistence browser assertions**

Change old `slate` setup values to `obsidian`. Add an e2e case that seeds `matcha`, loads the app, expects `theme-terminal`, and expects storage to normalize to `terminal`.

- [ ] **Step 6: Verify GREEN and regression safety**

Run: `npm.cmd test -- tests/unit/themeConfig.test.ts`

Expected: all theme configuration tests PASS.

Run: `npm.cmd run test:e2e -- tests/e2e/layout.spec.ts tests/e2e/settings.spec.ts`

Expected: theme default and migration assertions PASS; selector-specific assertions may wait for Task 2.

- [ ] **Step 7: Commit**

```powershell
git add src/theme/themeConfig.ts src/types/hardware.ts src/App.tsx src/components/MotherboardSchematic.tsx tests/unit/themeConfig.test.ts tests/e2e/layout.spec.ts tests/e2e/settings.spec.ts
git commit -m "feat: define AeroSpec theme identities"
```

### Task 2: Accessible visual theme picker

**Files:**
- Create: `src/components/ThemePicker.tsx`
- Create: `tests/unit/themePicker.test.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `tests/e2e/visual-review.spec.ts`

- [ ] **Step 1: Write the failing picker tests**

Render `ThemePicker` with `theme="obsidian"`, language `EN`, and a spy. Assert a `radiogroup` named `Theme`, five native radio inputs, Obsidian checked, localized identity text, three decorative swatches per option, and `onSelectTheme('blueprint')` after clicking Blueprint Lab. Verify ArrowDown/ArrowRight moves selection to the next option and ArrowUp/ArrowLeft moves to the previous option using native radio-group behavior.

- [ ] **Step 2: Run the picker test and verify RED**

Run: `npm.cmd test -- tests/unit/themePicker.test.tsx`

Expected: FAIL because `ThemePicker` does not exist.

- [ ] **Step 3: Implement the minimal picker**

Render styled `<label>` cards from `THEME_OPTIONS` around native `<input type="radio" name="aerospec-theme">` controls. Use a visually hidden but focusable input, visible selection mark, branded name, localized descriptor, and `aria-hidden` swatches. Keep event ownership in the picker callback so native arrow-key radio behavior supplies the semantics without custom roving-focus code.

- [ ] **Step 4: Integrate the picker into Header**

Remove the native theme `<select>` and duplicated `themeOptions`. Keep the Palette heading, insert `ThemePicker`, and widen the settings popover only enough for readable preview cards without exceeding the 1024 px layout.

- [ ] **Step 5: Update Playwright interaction contract**

Change the all-theme loop to click radios by branded name and assert the matching root class, checked state, and local-storage value. Reload after each selection, reopen settings, and assert the same theme class and radio are restored for all five themes.

- [ ] **Step 6: Verify GREEN**

Run: `npm.cmd test -- tests/unit/themePicker.test.tsx`

Expected: picker tests PASS.

Run: `npm.cmd run test:e2e -- tests/e2e/visual-review.spec.ts --grep "switches through"`

Expected: all five selections, persisted values, reload restorations, and keyboard behavior PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/components/ThemePicker.tsx src/components/Header.tsx tests/unit/themePicker.test.tsx tests/e2e/visual-review.spec.ts
git commit -m "feat: add visual AeroSpec theme picker"
```

### Task 3: Bundle desktop typography and build semantic theme tokens

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `THIRD_PARTY_LICENSES.md`
- Modify: `src/index.css`
- Modify: `tests/e2e/visual-review.spec.ts`

- [ ] **Step 1: Expand visual assertions before styling**

At the 1440 project, capture one deterministic dashboard screenshot for each new ID. At all three projects, retain Obsidian and Blueprint responsive screenshots. Add assertions that the root exposes the expected `--theme-identity` value and has no horizontal overflow.

Add a deterministic contrast audit that reads computed foreground/background colors for normal text, buttons, inputs, and theme cards. Assert at least 4.5:1 for normal text and 3:1 for large text and control boundaries. Test translucent targets on their resolved opaque semantic surface so results remain stable.

- [ ] **Step 2: Run visual tests and verify RED**

Run: `npm.cmd run test:e2e -- tests/e2e/visual-review.spec.ts`

Expected: FAIL because the new CSS identities and baselines do not exist.

- [ ] **Step 3: Install local variable fonts**

Run: `npm.cmd install @fontsource-variable/inter @fontsource-variable/jetbrains-mono`

Import only the variable roman CSS needed by the app. Add `THIRD_PARTY_LICENSES.md` with package names, upstream links, and SIL OFL 1.1 notice references.

- [ ] **Step 4: Replace the legacy palette tokens**

Define complete token sets for Obsidian Signal, Blueprint Lab, Phosphor Terminal, Industrial Amber, and Neo Tokyo. Include canvas/pattern, three surface tiers, text tiers, interactive/status colors, borders, shadows, radii, display/data fonts, PCB treatment, and `--theme-identity`.

- [ ] **Step 5: Make shared primitives consume semantic tokens**

Update body, `studio-card`, themed chips/badges/buttons/sockets, PCB substrate, tactile chips, form controls, scrollbars, selection, and focus-visible states. Use theme-specific selectors only for decorative geometry/texture; keep component semantics generic and layout metrics stable.

- [ ] **Step 6: Verify build and non-snapshot contracts**

Run: `npm.cmd run build`

Expected: TypeScript and Vite build PASS with fonts emitted as local assets.

Run: `npm.cmd run test:e2e -- tests/e2e/visual-review.spec.ts --grep "switches through"`

Expected: class/identity/overflow assertions PASS.

- [ ] **Step 7: Commit**

```powershell
git add package.json package-lock.json THIRD_PARTY_LICENSES.md src/index.css tests/e2e/visual-review.spec.ts
git commit -m "feat: create five distinct AeroSpec themes"
```

### Task 4: Theme every application shell and overlay

**Files:**
- Modify: `src/components/AiAdvisorModal.tsx`
- Modify: `src/components/DeepInspectorDrawer.tsx`
- Modify: `src/components/FlexCardModal.tsx`
- Modify: `src/components/MarkdownRenderer.tsx`
- Modify: `src/index.css`
- Modify: `tests/e2e/visual-review.spec.ts`

- [ ] **Step 1: Add failing overlay semantic-style checks**

Open AI Advisor, Inspector, and Flex Card while Blueprint is active. Assert each dialog shell has the semantic `overlay-panel` class and its computed background equals `--overlay-panel-bg`. Keep existing focus-trap and Escape assertions.

- [ ] **Step 2: Run overlay checks and verify RED**

Run: `npm.cmd run test:e2e -- tests/e2e/visual-review.spec.ts --grep "overlays"`

Expected: FAIL because overlay shells still use hard-coded Slate utilities.

- [ ] **Step 3: Refactor overlay shells to semantic classes**

Add reusable overlay backdrop, panel, header/footer, inset surface, input, transcript, and Markdown tokens/classes. Replace hard-coded app-shell Slate colors across all four components. Preserve the inner exported Flex Card's deliberate dark styling and all existing dialog behavior.

- [ ] **Step 4: Verify GREEN and accessibility regression**

Run: `npm.cmd run test:e2e -- tests/e2e/visual-review.spec.ts --grep "overlays"`

Expected: overlay style, focus, and Escape assertions PASS.

Run: `npm.cmd test -- tests/unit/dialogAccessibility.test.tsx`

Expected: all dialog accessibility tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/AiAdvisorModal.tsx src/components/DeepInspectorDrawer.tsx src/components/FlexCardModal.tsx src/components/MarkdownRenderer.tsx src/index.css tests/e2e/visual-review.spec.ts
git commit -m "feat: apply themes across AeroSpec overlays"
```

### Task 5: Generate baselines and perform adversarial visual review

**Files:**
- Modify: `tests/e2e/visual-review.spec.ts-snapshots/*.png`
- Modify as defects require: `src/index.css`, `src/components/ThemePicker.tsx`, `src/components/Header.tsx`, and themed overlay components

- [ ] **Step 1: Generate deterministic screenshots**

Run: `npm.cmd run test:e2e:update -- tests/e2e/visual-review.spec.ts`

Expected: new dashboard and overlay baselines are written for the configured Edge projects.

Delete obsolete `dashboard-arctic-*`, `dashboard-slate-*`, and renamed legacy overlay PNGs only after confirming the replacement files exist in the same snapshot directory.

- [ ] **Step 2: Inspect every generated image**

Open all five 1440 dashboard images, both responsive Obsidian/Blueprint sets, and all overlay images. Check each item in the spec's manual review list. Record concrete defects before editing.

- [ ] **Step 3: Fix each observed defect with a regression assertion where feasible**

For clipping, overflow, incorrect theme inheritance, or interaction defects, first add an assertion that fails, verify RED, then patch and verify GREEN. For purely aesthetic issues, adjust tokens/components and regenerate the affected screenshot.

- [ ] **Step 4: Re-run the full browser suite**

Run: `npm.cmd run test:e2e`

Expected: all Playwright tests PASS except explicitly documented project skips.

- [ ] **Step 5: Commit reviewed baselines**

```powershell
git add tests/e2e/visual-review.spec.ts tests/e2e/visual-review.spec.ts-snapshots src/index.css src/components
git commit -m "test: review AeroSpec theme visuals"
```

### Task 6: Review the actual Tauri desktop application

**Files:**
- Modify as defects require: theme CSS/components/tests
- Generated review artifacts only: `test-results/tauri-review/`

- [ ] **Step 1: Ensure a Rust toolchain is available**

Run: `rustup show active-toolchain`

Expected: an active stable toolchain. If none is configured, request the required machine-level permission and run `rustup default stable` before continuing.

- [ ] **Step 2: Run native checks and launch Tauri dev**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: Rust tests PASS.

Run: `npm.cmd exec -- tauri dev`

Expected: AeroSpec opens in the configured 1440 x 920 WebView2 window and native telemetry resolves to ready or a truthful error state.

- [ ] **Step 3: Inspect the native window across themes**

Switch through all five preview cards in the real app. Inspect the default window, resize to 1024 x 700, and check Windows scaling available on the machine. Capture native-window screenshots into `test-results/tauri-review/` for review only; do not commit machine-specific pixels.

- [ ] **Step 4: Fix native-only defects using RED/GREEN where feasible**

If WebView2 exposes clipping, font loading, scale, or contrast defects, add the closest repeatable Playwright assertion first, verify it fails, patch, and rerun it. Repeat native inspection after the fix.

- [ ] **Step 5: Stop all dev processes and verify no server is left behind**

Stop the Tauri/Vite session cleanly. Confirm port 5173 is no longer listening.

### Task 7: Final verification and handoff

**Files:**
- Modify only if verification reveals a defect.

- [ ] **Step 1: Run fresh unit tests**

Run: `npm.cmd test`

Expected: zero failed Vitest tests.

- [ ] **Step 2: Run fresh browser tests**

Run: `npm.cmd run test:e2e`

Expected: zero failed Playwright tests; any skips are intentional viewport-specific cases.

- [ ] **Step 3: Run lint and production build**

Run: `npm.cmd run lint`

Expected: exit 0 with no warnings.

Run: `npm.cmd run build`

Expected: exit 0 and fonts emitted locally.

- [ ] **Step 4: Run fresh native checks**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: both exit 0. If the environment still lacks a usable Rust toolchain after the approved setup attempt, report the exact blocker rather than claiming native verification.

- [ ] **Step 5: Audit requirements and repository state**

Re-read the design spec, inspect `git diff --check`, `git status --short`, and recent commits. Confirm each success criterion has direct evidence.

- [ ] **Step 6: Commit any final verification-only corrections**

```powershell
git add <exact corrected files>
git commit -m "fix: polish AeroSpec desktop themes"
```
