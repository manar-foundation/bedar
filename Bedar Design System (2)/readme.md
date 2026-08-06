# Bedar Design System

> **Bedar / بدار** — منصة بدار للريادة المجتمعية.
> The platform for launching social-entrepreneurship ventures and community initiatives (a Manar Foundation platform, active across the Arab region since 2019).

Arabic-first design system for Bedar's marketing surfaces, admin dashboards, and program pages. Every user-facing surface is right-to-left; Readex Pro is the sole typeface; Western digits (0-9) are used everywhere — never Arabic-Indic (٠-٩).

## Sources

- **Live reference site**: https://bedar.webflow.io/ (production at https://www.bedar.org)
- **Parent org**: https://www.manar.org/ar
- Copy on marketing surfaces is drawn verbatim from bedar.webflow.io.

## Identity in one paragraph

Bedar sits at an identity crossroads — part NGO (trustworthy, mission-driven), part social venture (entrepreneurial, active), part startup (modern, sharp). The design reads as **a serious institution with a modern edge**: a bold dark hero with a soft mint glow up top, then calm, highly readable light sections underneath. Never flashy tech-startup, never static old-fashioned nonprofit.

## Visual foundations

**Colors — teal only.** Primary `--brand-500 #407479`, deep dark `--brand-950 #022124`, mint highlight `--brand-200 #A9E1D3`. A single warm bronze (`--accent-500 #B08968`) is reserved for CTAs. Semantic colors are muted to sit inside the teal family. No unrelated hues.

**Typography — Readex Pro only.** One variable typeface covering Arabic and Latin natively. Line height 1.70+ for Arabic body, 1.55 for Latin. Modular 1.200 scale, 16px base. **Numerals are always Western (0-9)**, even inside Arabic prose — enforced via `font-feature-settings:"lnum" 1`.

**Dark surfaces — used sparingly.** The hero (`--hero-bg` + `--hero-glow`) uses a deep-teal base with a soft mint radial glow. This treatment also anchors the impact-stats band, the programs section, and the footer. Long-form Arabic body is never placed on dark or glowing surfaces.

**Motion — purposeful, not decorative.** Scroll-triggered reveals (`data-reveal` + IntersectionObserver), number count-ups on impact stats, subtle 2px hover lifts on cards, spiral dividers that echo the logo mark. All durations are 140–560ms, all easings are `cubic-bezier(0.2, 0, 0, 1)`. `prefers-reduced-motion: reduce` zeroes durations. No floating particles or heavy glow effects beyond the hero.

**The spiral motif.** The circular mark in the Bedar logo is reused as a section divider (`Spiral` component), a decorative watermark on audience cards, and a bullet on program tags. It's the ownable visual element.

**Layout.** 8px grid, 1280px max container, 12-column with 24px gutter, 80–96px section padding desktop.

**Radii.** Inputs & buttons 10px, cards 14px, modals 20px, pills capsule.

**Shadows.** Warm-teal tinted (`rgba(2,33,36,α)`), four elevation steps + focus ring + hero glow.

**Borders.** 1px, low-contrast; focus ring is a 4px brand-tinted glow.

## Content fundamentals

**Voice.** Warm, credible, action-oriented. Bedar speaks as a partner working *with* founders ("نعمل معهم"), never *at* them.
**Tone.** Formal-neutral Arabic (فصحى معاصرة). English is professional but plain.
**Person.** First-person plural in Arabic ("نستقطب", "نعمل").
**Vocabulary.** Signature phrases: مبادرات مجتمعية، ريادة اجتماعية، أثر مستدام، تمكين المجتمعات.
**Avoid.** MBA jargon, hyperbole, colloquial dialect, emoji, Arabic-Indic digits.
**Numerals.** `40+`, `2019`, `500` — always Western.

## File index

```
styles.css                Global entrypoint. Link this ONE file.
design-tokens.json        Machine-readable token export.
tokens/
  fonts.css               Readex Pro webfont declaration
  colors.css              Teal scale + accent + neutrals + semantic + light/dark themes
  typography.css          Family, weights, size scale, semantic roles
  spacing.css             8px scale, breakpoints, grid
  radii.css               Corner radii
  shadows.css             Elevation + focus + hero glow
  motion.css              Durations + easings + reduced-motion
  base.css                Reset + document defaults (Western digits enforced)
foundations/              Specimen cards (Colors, Type, Brand, Spacing, Radii, Shadows)
components/
  core/       Button, IconButton, Badge, Tag
  forms/      Input, Textarea, Select, Checkbox, Radio, Switch, FileUpload
  surfaces/   Card, Modal
  feedback/   Tooltip
  data/       Table
  navigation/ Tabs, Breadcrumbs, Navbar, Sidebar
  blocks/     Hero, FeatureGrid, Testimonial, ContentCard
ui_kits/
  marketing/  Bedar public site — RTL Arabic home
  admin/      Admin dashboard — page builder + applicants
assets/
  bedar-logo.svg      Wordmark + spiral (colored)
  bedar-favicon.svg   Spiral mark alone
readme.md   SKILL.md   thumbnail.html   index.html
```

## Accessibility

- Body text against `--bg-app` meets **WCAG AA** at 4.5:1+.
- Focus ring is a 4px `--brand-500` glow, always visible on `:focus-visible`.
- `prefers-reduced-motion` zeros transition durations and disables scroll reveals.
- All form controls have programmatic labels; icon-only buttons require `aria-label`.

## Caveats

- **Logo wordmark** is currently uploaded with navy wordmark + teal spiral — the brief calls for a dark-teal wordmark (`#022124`); user is providing the recolored SVG.
- **Photography** is intentionally absent; drop in real Bedar photography and it will slot in via the `image` fields on Hero and ContentCard components.
- **Icons** are inline SVG placeholders in the marketing kit; swap in Bedar's licensed service icons when available (see the reference site's colored SVG icons on `/services`).
