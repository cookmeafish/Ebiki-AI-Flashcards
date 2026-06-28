// Ebiki design tokens — single source of truth for the Ocean Light theme.
// Brand color is sampled from the mascot (Ebi the red shrimp): #DF2540.
// Imported by styles/theme.js, config/prompts.js, components, and used to replace
// inline color literals across App.jsx. Ocean Light = bright, friendly, red-focused
// (the way Duolingo's UI flows from its green bird).

export const C = {
  // ── Brand (the one focus color — "Duolingo green", but our shrimp red) ──
  brand: '#DF2540',
  brandDark: '#C00A29',   // pressed / 3D button bottom edge / strong hover
  brandSoft: '#FF5468',   // lighter brand for gradients/highlights
  brandTint: 'rgba(223,37,64,.10)',   // selected chips, active nav, soft fills
  brandTint2: 'rgba(223,37,64,.06)',
  brandRing: 'rgba(223,37,64,.22)',   // focus ring

  // ── Ocean neutrals (light) ──
  bg: '#F2F5F8',          // page background (faint cool ocean tint)
  bgGrad1: 'rgba(223,37,64,.05)',   // faint red wash
  bgGrad2: 'rgba(17,168,160,.045)', // faint teal wash
  surface: '#FFFFFF',     // cards / panels
  surfaceAlt: '#EAEEF2',  // inputs, subtle panels, hover rows
  surfaceSunken: '#F5F8FA',
  border: '#E2E8ED',
  borderStrong: '#CDD7DE',
  ink: '#16242C',         // primary text (deep ocean ink)
  inkDim: '#51626C',      // secondary text
  inkFaint: '#8A99A3',    // placeholders, captions
  white: '#FFFFFF',

  // ── Secondary (ocean teal — used sparingly; never competes with red) ──
  teal: '#11A8A0',
  tealDark: '#0C857F',
  tealTint: 'rgba(17,168,160,.10)',

  // ── Semantic (tuned for light bg) ──
  success: '#18A957',
  successTint: 'rgba(24,169,87,.12)',
  warning: '#E8930C',
  warningTint: 'rgba(232,147,12,.12)',
  danger: '#E5392E',
  dangerTint: 'rgba(229,57,46,.10)',
  info: '#2D86C9',
  infoTint: 'rgba(45,134,201,.12)',
  purple: '#8B5CF6',      // kept for a few accents (e.g. deep explain)
  purpleTint: 'rgba(139,92,246,.12)',
}

export const FONT = {
  display: "'Baloo 2', 'Nunito', system-ui, -apple-system, sans-serif",
  body: "'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace", // only for kbd keycaps
}

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 }

export const SHADOW = {
  sm: '0 1px 2px rgba(16,36,44,.06)',
  md: '0 4px 14px rgba(16,36,44,.08)',
  lg: '0 12px 32px rgba(16,36,44,.10)',
  xl: '0 24px 60px rgba(16,36,44,.16)',
  brand: '0 6px 18px rgba(223,37,64,.28)',
}

export const TOKENS = { color: C, font: FONT, radius: RADIUS, shadow: SHADOW }
export default TOKENS
