// Ebiki design tokens. Colors reference CSS variables so the app can switch between
// Ocean Light and Dark at runtime (toggle in settings → sets <html data-theme>).
// The actual color values live in the :root / [data-theme="dark"] blocks in App.jsx's
// global <style>. Brand stays the mascot red (#DF2540) in both themes.

export const C = {
  // ── Brand (the one focus color — Ebi's red) ──
  brand: 'var(--c-brand)',
  brandDark: 'var(--c-brand-dark)',
  brandSoft: 'var(--c-brand-soft)',
  brandTint: 'var(--c-brand-tint)', // the faint brand wash (a current item, a selected tile): theme-tuned
  brandTint2: 'rgba(223,37,64,.05)',
  brandRing: 'var(--c-brand-line)',  // a brand hairline

  // ── Neutrals (flip with theme) ──
  bg: 'var(--c-bg)',
  bgGrad1: 'var(--c-bg-grad1)',
  bgGrad2: 'var(--c-bg-grad2)',
  surface: 'var(--c-surface)',
  surfaceAlt: 'var(--c-surface-alt)',
  surfaceSunken: 'var(--c-surface-sunken)',
  border: 'var(--c-border)',
  borderStrong: 'var(--c-border-strong)',
  ink: 'var(--c-ink)',
  inkDim: 'var(--c-ink-dim)',
  inkFaint: 'var(--c-ink-faint)',
  white: 'var(--c-on-brand)',   // text on brand/colored buttons — white in both themes
  glass: 'var(--c-glass)',      // translucent header / overlays
  glassStrong: 'var(--c-glass-strong)', // translucent tooltips / popovers
  surfaceRaised: 'var(--c-surface-raised)', // popovers, the selected segment (lighter than a card in dark mode)
  hover: 'var(--c-hover)',      // the hover tint (ink in light, white in dark)
  inkSolid: 'var(--c-ink-solid)', // a solid ink surface (selected segment, kbd keys): near black in light, near white in dark
  onInk: 'var(--c-on-ink)',       // text on inkSolid

  // ── Secondary (ocean teal) ──
  teal: 'var(--c-teal)',
  tealDark: 'var(--c-teal-dark)',
  tealTint: 'rgba(17,168,160,.10)',

  // ── Semantic ──
  success: 'var(--c-success)',
  successTint: 'rgba(24,169,87,.12)',
  warning: 'var(--c-warning)',
  warningTint: 'rgba(232,147,12,.12)',
  danger: 'var(--c-danger)',
  dangerTint: 'rgba(229,57,46,.10)',
  info: 'var(--c-info)',
  infoTint: 'rgba(45,134,201,.12)',
  purple: 'var(--c-purple)',
  purpleTint: 'rgba(139,92,246,.12)',
}

export const FONT = {
  display: "'Baloo 2', 'Nunito', system-ui, -apple-system, sans-serif",
  body: "'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
}

// UI overhaul 2026-10 (docs/ui-overhaul.md): softer, larger card and modal corners.
// Second pass: cards 20, modals and heroes 28 (one corner family everywhere: 8 / 12 / 20 / 28).
export const RADIUS = { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 }

// Type scale (px). Display sizes use FONT.display with letterSpacing TYPE.tight.
export const TYPE = { hero: 32, h1: 26, h2: 20, h3: 16, body: 14, small: 12.5, micro: 11, tight: '-0.01em', eyebrow: '.08em' }

// Motion: durations (ms) and easings. Never animate position on hover.
export const MOTION = { fast: 140, base: 200, slow: 320, ease: 'var(--ease-out)', spring: 'var(--ease-spring)' }

export const SHADOW = {
  sm: 'var(--sh-sm)',
  md: 'var(--sh-md)',
  lg: 'var(--sh-lg)',
  xl: 'var(--sh-xl)',
  brand: 'var(--sh-brand)',
  card: 'var(--sh-card)',     // resting card: contact + ambient (+ a top highlight in dark mode)
  glow: 'var(--sh-glow)',     // brand glow for the current / primary item
  hi: 'var(--sh-hi)',         // inset top highlight only
  ring: 'var(--ring)',        // focus ring
}

export const TOKENS = { color: C, font: FONT, radius: RADIUS, shadow: SHADOW, type: TYPE, motion: MOTION }
export default TOKENS
