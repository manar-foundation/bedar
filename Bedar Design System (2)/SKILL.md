---
name: bedar-design
description: Use this skill to generate well-branded interfaces and assets for Bedar (بدار / منصة بدار للريادة المجتمعية), for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components. Arabic-first (RTL), single-typeface (Readex Pro), Western digits only.
user-invocable: true
---

Read `readme.md` in this project, then explore `tokens/`, `components/`, `ui_kits/`, `foundations/`, `assets/`, `design-tokens.json`.

Bedar is **Arabic-first**: set `<html dir="rtl" lang="ar">` unless the user explicitly asks otherwise. Load `styles.css` — it wires Readex Pro, tokens, and base resets in one file.

**Quick reference**
- Primary color: `--brand-500 #407479` (teal). Deep dark: `--brand-950 #022124`. Mint highlight: `--brand-200 #A9E1D3`.
- Warm CTA accent (sole warm hue): `--accent-500 #B08968` — reserved for primary CTAs.
- Font: **Readex Pro only** — headings, body, UI, numerals. No secondary Arabic font, no Inter, no Cairo.
- **Numerals: Western (0-9) ALWAYS**, even inside Arabic prose. Do not output ٠-٩.
- Radius rhythm: buttons/inputs 10px, cards 14px, modals 20px, pills capsule.
- 8px spacing grid, 12-column layout, 1280px max container, 80–96px section padding.
- Voice: warm, credible, first-person plural in Arabic (نعمل، نستقطب). No jargon. No emoji. No hyperbole.
- Dark surfaces (`--brand-950` + mint radial glow) are for HERO / IMPACT-STATS / PROGRAMS / FOOTER only. Long-form Arabic body always sits on light `--bg-app`.
- Motion: 140–560ms, `cubic-bezier(0.2,0,0,1)`. Scroll-reveal + count-ups + card lifts. Nothing that reads as fintech-flashy. Respect `prefers-reduced-motion`.
- The spiral in the logo is the ownable motif — reuse it in dividers, watermarks, program badges (see `ui_kits/marketing/index.html`).

If invoked without other guidance, ask what the user wants to build (marketing surface, admin surface, program landing, event page), whether it's Arabic-only or bilingual, and whether they have real photography or logos to drop in. Then act as an expert Bedar designer.
