# MOTION: Secretless Code Motion Specification

Design System: **Precision Instrument Panel on Precision Minimal**  
Single Easing Curve: `cubic-bezier(0.16, 1, 0.3, 1)` (mechanical snap / Apple-style ease-out, zero bounce)  
Maximum Travel Distance: `12px` (strict clamp to prevent floaty/marketing drift)  
Properties Permitted: Strictly `transform` and `opacity` only.  
Scroll Policy: Zero scroll hijacking. Native browser scroll only.  
Reduced Motion Fallback: When `prefers-reduced-motion: reduce` is enabled, all `transform` movements are clamped to `0px` with instant opacity cross-fade.

---

## Animation Inventory (Max 6 Rows)

| # | Element | Trigger | Animated Properties | Duration Token & Curve | Why It Exists (Functional Purpose) |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Scan Terminal Log Line** (`.terminalLine`) | Scan step advances (`[00:01]`, `[00:02]`, `[00:03]`) | `opacity`: `0 -> 1`<br>`transform`: `translateY(8px) -> translateY(0)` | `--duration-slow` (480ms)<br>`cubic-bezier(0.16, 1, 0.3, 1)` | Proves step-by-step progress through clone, rule evaluation, and diff parsing so user perceives real hardware execution rather than a canned graphic. |
| **2** | **Findings Drawer Reveal** (`.findingsSection`) | Scan evaluation concludes with committed secrets detected | `opacity`: `0 -> 1`<br>`transform`: `translateY(12px) -> translateY(0)` | `--duration-base` (240ms)<br>`cubic-bezier(0.16, 1, 0.3, 1)` | Directs the visitor's eye immediately to the masked credential and amber highlight line without an abrupt, jarring DOM jump. |
| **3** | **Remediation Provider Step Panel** (`.stepCard`) | User clicks a provider tab (e.g., AWS IAM -> Stripe) | `opacity`: `0.4 -> 1`<br>`transform`: `translateY(6px) -> translateY(0)` | `--duration-base` (240ms)<br>`cubic-bezier(0.16, 1, 0.3, 1)` | Confirms the provider context has shifted and highlights the newly rendered revocation steps and shell command. |
| **4** | **Clipboard Copy Feedback** (`.copyStatus`) | User clicks "Copy command" or "Copy git-filter-repo command" | `opacity`: `0 -> 1`<br>`transform`: `translateY(-4px) -> translateY(0)` | `--duration-fast` (120ms)<br>`cubic-bezier(0.16, 1, 0.3, 1)` | Provides immediate, tactile feedback that the command is in the system clipboard, eliminating anxiety and repeated clicks. |
| **5** | **Pricing Annual Toggle Recalculation** (`.tierPrice`) | User checks/unchecks "Billed annually (save 20%)" | `opacity`: `0.5 -> 1`<br>`transform`: `translateY(-4px) -> translateY(0)` | `--duration-fast` (120ms)<br>`cubic-bezier(0.16, 1, 0.3, 1)` | Draws micro-attention to the recalculated unit rate ($29 -> $23) to confirm the billing interval switch has occurred. |
| **6** | **Hardware Switch Tactile Press** (`.submitBtn`, `.authBtn`, `.findingBtn`, `.tierBtn`) | Pointer `:active` or keyboard `Space`/`Enter` keydown | `transform`: `translateY(1px)` | `--duration-fast` (120ms)<br>`cubic-bezier(0.16, 1, 0.3, 1)` | Simulates calibrated mechanical key travel on a precision measurement instrument, reinforcing user intent. |

---

## Reduced Motion Specification (`prefers-reduced-motion: reduce`)

When user prefers reduced motion:
- **Transform movements:** Clamped to `translateY(0)` (zero travel).
- **Duration:** Transitions complete in `0.01ms` (instant cross-fade).
- **Rule:** Preserves all functional status readouts and information without any motion or sensory disorientation.
