# CRM UI/UX Overhaul — Premium Glass Redesign

Pure look-and-feel pass. **No visible data, database, or calculation was changed** — only
presentation. The design system lives in `src/app/globals.css`; the page shells, month
panels, and table apply its classes.

## Files touched
- `src/app/globals.css` — full design system (the shared lever).
- `src/app/page.tsx` — redesigned landing / portal picker.
- `src/app/operations/[userId]/projects/page.tsx` — topbar header.
- `src/app/portal/employee/[userId]/page.tsx` — topbar header.
- `src/app/portal/leader/[teamId]/page.tsx` — topbar header.
- `src/app/operations/[userId]/projects/EMDashboardClient.tsx` — tabs + month panels.
- `src/app/portal/employee/[userId]/DashboardClient.tsx` — tabs + month panel (removed duplicate inner header).
- `src/app/portal/leader/[teamId]/LeaderDashboardClient.tsx` — tabs + month panel.
- `src/components/SalesTable.tsx` — status pills + left-accent rows.

## The design language
Sophisticated light "aurora glass": a rich mesh-gradient backdrop with a faint masked grid
for depth, frosted translucent surfaces with real blur and layered soft shadows, a two-font
system (**Sora** for display headings, **Inter** for body/UI), and a violet→pink brand
gradient used for the logo mark and primary actions.

## Element-by-element

### Background (`body`, `body::before`)
Three aurora radial glows (violet / teal / pink) over a cool slate gradient, `fixed`. A
subtle 44px grid overlay, radially masked so it fades toward the edges — adds depth without
noise. This is what makes the glass read as glass rather than flat white.

### App top bar (`.topbar`, `.brand`, `.brand-mark`, `.page-eyebrow`, `.brand-title`)
Every dashboard now opens with a frosted top bar: a gradient "M" logo tile, an uppercase
accent eyebrow (role/portal), a Sora title, and a context subline. Replaced the four plain
`<h1> + <p>` headers. The employee dashboard's duplicate inner "Hello" header was removed so
there's a single, consistent header per page.

### Portal landing (`src/app/page.tsx`)
Centered brand mark + eyebrow + large Sora headline. Four portal cards in a balanced 2×2
grid, each with a gradient icon tile, description, and an "Enter →" affordance. Cards lift on
hover.

### Glass cards (`.card`)
Frosted surface (`rgba(255,255,255,0.72)` + `blur(24px)`), hairline highlight border, layered
shadow with inner top-light, 16px radius. Hover lifts 2px into a deeper shadow.

### Month panels (`.month-header`, `.stat-chip`, `.stat-dot`)
The old flat grey strips are now gradient-tinted panel headers: an eyebrow label, a large
Sora month title, and — on the sales views — a row of **stat chips** (Total Sale / Cleared %
/ Balance), each a mini card with a colored status dot and tabular-number value. Same numbers
as before, presented as a premium summary.

### Tables (`.table-wrapper`, `thead th`)
Clean white rows on the glass card, uppercase muted micro-headers, `tabular-nums` for aligned
money, and a soft violet hover. Horizontal scroll preserved for wide EM columns.

### Status system (`.status-pill`, left-accent rows)
Replaced the heavy full-row pastel fills (which read as "spreadsheet") with the modern
Stripe/Linear pattern: a thin colored **left-accent bar** per row encoding status
(blue = in-progress, green = completed, amber = declined, red = refunded), plus a rounded
**status pill** with a leading dot in the read-only views. Editable views keep the status
`<select>`. Nothing about status logic changed — only how it's shown.

### Tabs (`.tab-bar`, `.tab`)
Apple-style segmented control (frosted pill container, white active chip with accent text),
shared across all dashboards; scrolls horizontally without a visible scrollbar.

### Inputs & buttons (`.input`, `.btn`, `.btn.primary`)
Translucent inputs → opaque white with a violet focus ring. Secondary buttons are frosted
glass that lift on hover; primary buttons carry the brand gradient with a colored glow.

### Tokens (`:root`)
Cool slate neutrals, brand gradient (`--grad-brand`), teal/pink secondary accents, a full
layered shadow scale, larger radii, glass tokens, and a smoother easing curve. Added utility
classes that markup referenced but weren't defined (`.text-success/-danger/-primary`,
`.text-xs`, `.block`, `.mb-1`, `.mt-4`, `.text-center`).

## Theming — Light + Dark (added)
The premium design above is the **light** theme (default). A **dark** theme was added using
Mad Alpha Designers' own brand palette (pulled from `madalphadesigners.com`):

- Background `#0B0E13` (near-black), panels `#0F1C23`, muted body text `#969EB2`, white headings.
- **Neon green `#45F882`** as the primary accent (logo mark, active tab, links, primary buttons),
  with blue `#00A1F6` as the secondary — the same glow-on-dark feel as the site, kept subtle
  (soft tints, no heavy neon glow).

How it works:
- All theming is token-based. `src/app/globals.css` defines light tokens on `:root` and a
  `:root[data-theme="dark"]{…}` override block (plus a handful of surface-specific dark rules for
  elements that used literal white). Every component already reads CSS variables, so both themes
  flow from the same markup — **no per-component theme code**.
- `src/components/ThemeToggle.tsx` — a small fixed round button (bottom-right, 🌙/☀️) that flips
  `data-theme` on `<html>` and saves the choice to `localStorage`.
- `public/theme-init.js` + `src/app/layout.tsx` — the pre-paint theme script is an **external**
  file loaded via `next/script` `strategy="beforeInteractive"` (an inline `<script>` in the layout
  triggers Next 16's "script tag while rendering React component" warning). The toggle's mount
  effect re-asserts the attribute after hydration, since Next's hydration strips it. Default is
  light when nothing is saved.

## Consistency pass (tables + light palette)
- **Identical status control everywhere.** The Execution Manager and Team Leader tables used a
  boxy `<select>` for status; they now render the **same status pill** as the Employee table
  (same color, dot, size), with a small `▾` caret. Editing still works — a transparent native
  `<select>` is overlaid on the pill (`.status-editable`), so clicking it opens the dropdown. No
  behavior or data change.
- **Uniform row heights.** All three portals use the one `SalesTable` component; the editable
  Details textareas were reduced (60px → 40px min) and the read-only Details cell given a matching
  40px floor, so every sales table now renders ~58–59px rows in both themes.
- **Dark-mode status pills** were tuned for contrast (brighter blue/green/amber/red on dark).
- **Light theme is now website-inspired too.** Swapped the violet/teal/pink accents for the Mad
  Alpha palette — brand **green `#0CA05B`** primary + **blue `#00A1F6`** secondary + amber
  `#FFBE18` — applied to the brand gradient, aurora background, month panels, links, active tabs,
  hover, and focus ring. (A readable deeper green is used in light so text/links stay legible; the
  neon `#45F882` is reserved for the dark theme.)

## Visibility / positioning fixes
- **Modals now center on screen.** `ClientModal` and `ProductModal` were `position: fixed` but got
  trapped inside the month `.card` (its `backdrop-filter` creates a containing block for fixed
  descendants), so they appeared in the middle of that table and required scrolling. Both now render
  via `createPortal(..., document.body)`, escaping the card and centering in the viewport regardless
  of scroll position.
- **Dark-mode dropdowns are readable.** Added `color-scheme: dark` to the dark root (so native
  `<select>` popups, scrollbars, etc. render dark) plus explicit `option { background:#0F1C23;
  color:#E9EDF4 }`.
- **Primary buttons in dark were broken** — `:root[data-theme="dark"] .btn` out-specified
  `.btn.primary`, wiping the gradient so buttons showed dark text on a near-invisible dark fill
  (this is why "Enter Portal" was unreadable). Scoped that override to `.btn:not(.primary)`, so
  primary buttons keep the green→blue brand gradient in dark; also gave the resting state a green
  glow instead of the leftover violet one.
- **Disabled primary buttons** now use a muted neutral surface with a legible label (via
  `--bg-hover` / `--text-muted`) in both themes, instead of a dimmed gradient with vanishing text.

## Verification
- `next build` compiles and type-checks clean.
- Visually verified in the running app: landing, EM dashboard (monthly breakdown + team
  table), and employee read-only dashboard. No console errors.
- `backdrop-filter` is supported in all current evergreen browsers; older browsers degrade to
  the solid translucent background (still fully legible).
