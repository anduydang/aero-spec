# AeroSpec Distinct Theme System Design

## Goal

Replace AeroSpec's five palette swaps with five clearly different desktop art directions. The app should feel like a polished personal hardware instrument in its Tauri window, while retaining the current information architecture, telemetry honesty, accessibility, and responsive behavior.

## Product Decisions

- Replace the current theme set rather than trying to preserve Latte, Matcha, and Sakura as pastel variants.
- Ship five first-party AeroSpec themes: Obsidian Signal, Blueprint Lab, Phosphor Terminal, Industrial Amber, and Neo Tokyo.
- Make Obsidian Signal the default.
- Use outside projects only as palette, typography, and accessibility references. Do not copy artwork or depend on remote runtime assets.
- Bundle Inter and JetBrains Mono locally. Both are distributed under the SIL Open Font License 1.1.
- Judge the result primarily in the Tauri desktop window, not as a marketing webpage.

## Theme Set

### Obsidian Signal

The default premium dark theme. It uses near-black navy surfaces, restrained cyan signal accents, and small lime status highlights. Panels have low-transparency glass, fine PCB grids, soft inner highlights, and moderate rounded corners. Glow is reserved for active controls and live signal paths.

### Blueprint Lab

A technical drawing theme rather than a generic light mode. It uses a cobalt workspace, white and pale-blue drafting surfaces, blueprint grid lines, thin precise borders, and crisp geometric shadows. Hardware labels resemble drawing annotations while body copy remains highly readable.

### Phosphor Terminal

A diagnostic-console theme replacing Matcha. It uses black-green surfaces, phosphor green data, amber warnings, square corners, monospace-forward typography, and a very subtle scanline texture. The texture must never reduce text contrast or create visible flicker.

### Industrial Amber

A physical test-equipment theme replacing Latte. It uses warm off-white enamel, graphite text, brushed-gray secondary surfaces, amber/orange controls, heavier borders, hard offset shadows, and limited warning-stripe decoration. It should feel sturdy rather than nostalgic or cute.

### Neo Tokyo

A dramatic night theme evolved from the Sakura idea without pastel cards. It uses deep navy and charcoal, magenta signal accents, red alert accents, thin luminous dividers, and selective asymmetry in decorative details. It may take palette inspiration from Tokyo Night, but AeroSpec retains its own component styling and accessible contrast.

## Theme Architecture

The theme identifier becomes:

```ts
type ThemeType = 'obsidian' | 'blueprint' | 'terminal' | 'industrial' | 'tokyo';
```

On startup, stored legacy values migrate as follows:

| Legacy ID | New ID |
| --- | --- |
| `slate` | `obsidian` |
| `arctic` | `blueprint` |
| `matcha` | `terminal` |
| `latte` | `industrial` |
| `sakura` | `tokyo` |

An absent, unknown, or malformed stored value falls back to `obsidian` and the normalized value is persisted on the next theme effect. Migration is deterministic and does not retain an obsolete class on the document root.

Theme CSS exposes semantic tokens for app canvas, patterns, panel tiers, borders, text tiers, status colors, interactive states, shadows, radii, and font roles. Components consume semantic classes or variables instead of branching on theme names.

The system must support more than color changes. Each root theme controls:

- canvas pattern and PCB substrate treatment;
- panel translucency and elevation;
- border weight and radius;
- display and data font roles;
- button, chip, badge, and focus-ring treatment;
- restrained theme-specific decorative details.

Layout dimensions and control hit targets stay stable across themes so switching themes does not cause content jumps.

## Component Changes

### Theme Picker

Replace the native theme select with an accessible radio group of five compact preview cards. Each card contains the non-translated branded theme name, a localized Vietnamese/English identity label, and three color swatches. The selected card has a clear check mark and focus state. At the current settings-popover size the cards form one column; at wider future containers they may form two columns.

### Shared Surfaces

Extend the semantic surface system used by `studio-card`, chips, badges, sockets, PCB areas, and buttons. Remove hard-coded Slate colors from the AI Advisor, Flex Card shell, Inspector drawer, Markdown renderer, and overlays where those colors incorrectly override the selected theme. Semantic success, warning, danger, and unavailable meanings remain consistent in every theme.

The exported Flex Card retains its own dark presentation because it is a share artifact, but its surrounding modal follows the active app theme.

### Typography

Inter is the default interface face and JetBrains Mono is the data face. Themes may swap which face is used for compact headings or labels, but normal prose remains Inter for readability. Variable roman files provide weights 400 through 900; italic files are not required. Fonts are installed as local package assets and loaded from the app bundle; there are no CDN requests. Their OFL notices are retained in the installed packages and summarized in the repository's third-party license notice.

## Accessibility and Motion

- Normal text and controls target at least WCAG 2.2 AA contrast.
- Status colors are never the only status cue; labels and icons remain present.
- Theme preview cards are keyboard reachable and expose checked state.
- Focus rings remain visible on every canvas and panel color.
- Scanlines, glows, and signal animations are decorative, low-opacity, and disabled by `prefers-reduced-motion` where motion is involved.
- Patterns sit behind opaque-enough surfaces and never impair data legibility.

## Testing and Visual Review

### Automated behavior

- Add unit coverage for default selection, all five valid IDs, and legacy local-storage migration.
- Update settings interaction tests for the radio-card picker.
- Assert every theme can be selected, persisted, and restored.
- Keep existing accessibility, overflow, telemetry, and score tests passing.

### Screenshot coverage

- Capture every theme at 1440 x 900 with the same simulator data.
- Capture Obsidian Signal and Blueprint Lab at 1024 x 700 and 1920 x 1080.
- Capture AI Advisor, Inspector, and Flex Card shells to catch remaining hard-coded dark surfaces.
- Disable nonessential animation and use deterministic state for snapshots.

### Tauri desktop review

Build or run the actual Tauri application and inspect the configured desktop window on Windows/WebView2. Review at the normal app window size and at a smaller resizable window, accounting for Windows display scaling when the environment permits. Playwright Edge remains the repeatable regression layer because it shares the Chromium rendering engine, but it does not replace the final native-window inspection.

The manual review checks:

- each theme is recognizable before reading its name;
- information hierarchy stays clear at a glance;
- text, thin borders, and patterns remain crisp in WebView2;
- no theme appears to be only a hue-shifted copy;
- menus, modals, scrollbars, native selects, and focus states belong to the active theme;
- decorative effects do not overpower telemetry values;
- no clipping or horizontal overflow occurs.

Any theme that fails this review is revised before completion; passing tests alone is not sufficient.

## External References and Licensing

- Radix Colors informs semantic color-scale roles and contrast-aware interaction states.
- Tokyo Night informs the Neo Tokyo palette direction. Its source theme is MIT-licensed.
- Inter and JetBrains Mono are bundled under SIL OFL 1.1.
- No external images, logos, icons, or hosted fonts are required. Existing Lucide icons remain in use.

## Out of Scope

- New telemetry features, score changes, or AI behavior changes.
- User-authored custom palettes or a theme editor.
- Downloadable theme packs or marketplace support.
- Animated wallpapers, video backgrounds, or large raster assets.
- Reworking the Flex Card's exported visual identity per app theme.

## Success Criteria

- AeroSpec offers exactly five new named themes and migrates every existing saved theme value.
- Theme identity changes color, surface, geometry, typography emphasis, and canvas treatment without shifting the layout.
- All app chrome and modal shells honor the selected theme except the intentionally self-contained exported Flex Card.
- Fonts and styling work offline in the packaged Tauri app.
- Automated tests, visual snapshots, production build, and lint pass.
- Actual Tauri desktop inspection finds no major contrast, clipping, scaling, or visual-cohesion defect.
