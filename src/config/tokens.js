// Ebiki design tokens. Colors reference CSS variables so the app can switch between
// Ocean Light and Dark at runtime (toggle in settings → sets <html data-theme>).
// The actual color values live in the :root / [data-theme="dark"] blocks in App.jsx's
// global <style>. Brand stays the mascot red (#DF2540) in both themes.

export const C = {
  // ── Brand (the one focus color — Ebi's red) ──
  brand: 'var(--c-brand)',
  brandDark: 'var(--c-brand-dark)',
  brandSoft: 'var(--c-brand-soft)',
  brandTint: 'rgba(223,37,64,.10)',
  brandTint2: 'rgba(223,37,64,.06)',
  brandRing: 'rgba(223,37,64,.22)',

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

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 }

export const SHADOW = {
  sm: 'var(--sh-sm)',
  md: 'var(--sh-md)',
  lg: 'var(--sh-lg)',
  xl: 'var(--sh-xl)',
  brand: 'var(--sh-brand)',
}

export const TOKENS = { color: C, font: FONT, radius: RADIUS, shadow: SHADOW }
export default TOKENS
