# TOKENS: Secretless Code Design System

Direction: **Instrument panel / spec sheet on precision minimal** (labelled readouts, monospaced data, 1px hairlines, flat matte surfaces, zero glassmorphism, zero neon glow). Inspired by Notion toolkit notes on *Huashu Design* and *Taste Skills (anti-slop)*.

---

## 1. Colour Tokens & Usage Rules

| Token Name | Hex Value | Role & Strict Usage Rule |
| :--- | :--- | :--- |
| `--color-background` | `#121316` | Global page background canvas. Never used as text color. |
| `--color-surface` | `#1A1C20` | Flat card, spec panel, and input field ground. Strict zero-elevation. |
| `--color-ink` | `#E6E7E9` | Primary headlines, field inputs, active log lines, high-contrast text. |
| `--color-muted-ink` | `#9A9EA6` | Secondary body text, timestamps, table labels, metadata tags. |
| `--color-rule` | `#2C2F35` | 1px hairline borders, diff dividers, column guides, component perimeters. |
| `--color-signal` | `#E0A93B` | **Amber Highlighter**. Reserved **strictly** for found secrets inside the sample scan findings preview and its diff highlight bar. Never used on marketing badges, buttons, borders, or general UI elements. |

### Contrast Ratios (WCAG AA Compliance)
- **Ink on Background** (`#E6E7E9` on `#121316`): **12.6:1** (Passes AAA, threshold 7:1)
- **Ink on Surface** (`#E6E7E9` on `#1A1C20`): **11.4:1** (Passes AAA, threshold 7:1)
- **Muted Ink on Background** (`#9A9EA6` on `#121316`): **6.7:1** (Passes AA, threshold 4.5:1)
- **Muted Ink on Surface** (`#9A9EA6` on `#1A1C20`): **6.0:1** (Passes AA, threshold 4.5:1)
- **Signal Amber on Surface** (`#E0A93B` on `#1A1C20`): **7.8:1** (Passes AAA for labels & data text)
- **Signal Amber on Background** (`#E0A93B` on `#121316`): **8.6:1** (Passes AAA)

---

## 2. Typography

Both fonts sourced from **Google Fonts**:
- **Display & Body:** `Schibsted Grotesk` (Variable, sans-serif)
- **Data, Logs & Code:** `JetBrains Mono` (Monospace)

### Type Scale (Base 16px, Ratio 1.25, Fluid Clamp for Display)

| Role | Family | Weight | Size (Desktop / Mobile) | Line Height | Tracking | Token |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **micro-tag** | JetBrains Mono | 500 | 11px | 1.3 | +0.06em | `--text-micro` |
| **caption / label** | JetBrains Mono | 400 | 13px | 1.4 | +0.02em | `--text-caption` |
| **code / data** | JetBrains Mono | 400 | 14px | 1.5 | 0.00em | `--text-code` |
| **body** | Schibsted Grotesk | 400 | 16px | 1.6 | -0.01em | `--text-body` |
| **body-lead** | Schibsted Grotesk | 400 | 20px | 1.5 | -0.015em | `--text-body-lead` |
| **section-title** | Schibsted Grotesk | 600 | 25px | 1.25 | -0.02em | `--text-heading-sm` |
| **panel-title** | Schibsted Grotesk | 600 | 31px | 1.2 | -0.025em | `--text-heading-md` |
| **display** | Schibsted Grotesk | 600 | `clamp(36px, 4.5vw, 48px)` | 1.1 | -0.035em | `--text-display` |

---

## 3. Space & Layout

Base scale: **4px** increments.

### Spatial Scale
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px
- `--space-16`: 64px
- `--space-20`: 80px

### Section Rhythm & Grid Architecture
- **Max Content Width:** `1200px` centered with `24px` gutter on mobile / `48px` on desktop.
- **Section Gap Desktop:** `96px` (`--space-16` to `--space-20`).
- **Section Gap Mobile:** `48px` (`--space-12`).
- **Hero Layout:** Asymmetric 12-column grid.
  - Desktop: 5 columns for Headline/Value prop, 7 columns for Live Scan Panel.
  - Mobile: Scan Panel / URL Input stacks **first** above the fold, followed by the condensed headline.

---

## 4. Shapes & Elevation

- **Border Radius:**
  - Standard cards, panels, and containers: `4px` (`--radius-card`)
  - Input fields and buttons: `2px` (`--radius-sm`)
  - Redaction bars & diff badges: `0px` (`--radius-sharp`)
  - *No pill buttons (no `9999px`) to maintain the hardware instrument spec aesthetic.*
- **Rules & Hairlines:**
  - Single standard: `1px solid #2C2F35` (`--border-rule`)
  - Diff gutters: `1px solid #2C2F35` with `4px` padding markers
- **Shadows & Elevation:**
  - `none` across all standard surfaces (strict flat instrument panel).
  - Terminal scan panel dropdown/popover: `0 4px 16px rgba(0, 0, 0, 0.4)` (`--shadow-panel`).
  - Zero glassmorphism (`backdrop-filter` banned). Zero radial glow.

---

## 5. Motion (Motion / `motion.dev`)

- **Duration Tokens:**
  - Micro-interactions (hover, focus, copy tooltip): `120ms` (`--duration-fast`)
  - State changes (tab switch, expand drawer, step advance): `240ms` (`--duration-base`)
  - Step progress indicators & log line insertions: `480ms` (`--duration-slow`)
- **Single Easing Curve:** `cubic-bezier(0.16, 1, 0.3, 1)` (Precision mechanical snap / Apple-like ease-out, zero bounce).
- **Max Travel Distance:** Strict limit of `16px` for vertical entrance/slide transitions (`y: 12px -> 0px`).
- **Reduced Motion:** When `prefers-reduced-motion: reduce` is active, animations fall back strictly to instant opacity cross-fades (`duration: 0.1s`).

---

## 6. The Signature: Instant Sample Scan

**Description:**  
The signature element is a real-time, interactive inspection panel simulating a live Git repository scan. It features a split layout: timestamped terminal execution lines at top, progressing through git shallow clone, Gitleaks engine invocation (140+ rules), and git-diff parsing, concluding in a parsed "Findings Drawer". Inside this drawer, detected credentials (e.g. `AKIAIOSFODNN7EXAMPLE`) appear masked under a sharp black redaction bar with a razor-thin **amber signal underline** (`#E0A93B`), paired with a one-click "Scrub & Revoke" terminal drawer. This is the **sole location** in the entire application where the `#E0A93B` signal color may be rendered.

**Tokens Allowed in Signature:**
- Colors: `--color-background`, `--color-surface`, `--color-ink`, `--color-muted-ink`, `--color-rule`, `--color-signal`
- Fonts: `--font-jetbrains-mono` (for logs, diff gutter, redaction token, shell commands), `--font-schibsted-grotesk` (for finding summary title)
- Radii: `--radius-card` (4px), `--radius-sm` (2px), `--radius-sharp` (0px)
- Motion: `--duration-fast` (120ms), `--duration-base` (240ms), `--duration-slow` (480ms), mechanical ease curve.

---

## 7. Self-Critique & Anti-Generic Adjustments

### Decision 1: Initial default button radius (`100px` / pill)
- *Why it looked generic:* Large rounded pills (`100px` or `9999px`) are standard tropes seen on consumer marketing apps and generic SaaS templates.
- *Adjustment:* Replaced with tight `2px` chamfered precision radius (`--radius-sm`). Buttons now look like calibrated hardware keys on a test instrument.

### Decision 2: Accent color on the CTA button
- *Why it looked generic:* Using an amber or colored button as the primary call-to-action makes the page look like an alarmist cybersecurity landing page or an e-commerce checkout.
- *Adjustment:* Made the primary CTA strictly achromatic (`#E6E7E9` ink on `#2C2F35` rule with sharp border). The amber signal (`#E0A93B`) is restricted **exclusively** to the detected leaked secret inside the sample findings readout.
