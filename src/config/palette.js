// The app's color palettes as CSS variables: :root = Ocean Light, [data-theme="dark"] = Dark. The single source of
// the --c-* values that src/config/tokens.js names. Rendered by App (and its pre-config screen) and by dev tools
// such as the Legends art gallery (dev/legends-gallery).
// App note: Also rendered by the pre-config screen: without it a dark-theme user saw a LIGHT screen on
// every launch until the config answered, and the slow-start screen's Restart button had no colours.
export const PALETTE_CSS = `
        :root {
          color-scheme: light; /* native controls (select popups, scrollbars) match light theme */
          /* UI overhaul 2026-10 (docs/ui-overhaul.md): this block is the main lever of the look. */
          --c-brand: #DF2540; --c-brand-dark: #BE0E2B; --c-brand-soft: #FF5468;
          --c-bg: #F4F6F8; --c-bg-grad1: rgba(223,37,64,.025); --c-bg-grad2: rgba(17,168,160,.035);
          --c-surface: #FFFFFF; --c-surface-alt: #EDF0F3; --c-surface-sunken: #F3F5F7; --c-surface-raised: #FFFFFF;
          --c-border: #E3E7EB; --c-border-strong: #CBD2D9;
          --c-ink: #101820; --c-ink-dim: #4A5866; --c-ink-faint: #788693;
          --c-on-brand: #FFFFFF;
          /* Second pass: a solid ink surface (the selected segment, keyboard keys, the session pill). */
          --c-ink-solid: #101820; --c-on-ink: #FFFFFF;
          --c-brand-tint: rgba(223,37,64,.07); --c-brand-line: rgba(223,37,64,.24);
          --c-glass: rgba(255,255,255,.78); --c-glass-strong: rgba(255,255,255,.96);
          --c-hover: rgba(17,28,36,.05);
          --c-teal: #11A8A0; --c-teal-dark: #0C857F;
          /* Light-mode semantic colors run DEEPER than dark mode's: at small sizes on the light
             background, #18A957 green and #E8930C amber shared the same luminance and blended. */
          --c-success: #0E8746; --c-warning: #B36A00; --c-danger: #D32F24; --c-info: #2D86C9; --c-purple: #7C4DEF;
          /* Layered elevation: tight contact + wide ambient. --sh-sm stays ONE shadow (used in drop-shadow()). */
          --sh-hi: inset 0 1px 0 rgba(255,255,255,.7);
          --sh-sm: 0 1px 2px rgba(17,28,36,.07);
          --sh-card: 0 1px 2px rgba(17,28,36,.05), 0 4px 14px -6px rgba(17,28,36,.08);
          --sh-md: 0 2px 4px rgba(17,28,36,.04), 0 10px 26px -8px rgba(17,28,36,.14);
          --sh-lg: 0 4px 10px rgba(17,28,36,.05), 0 20px 44px -12px rgba(17,28,36,.18);
          --sh-xl: 0 8px 18px rgba(17,28,36,.08), 0 36px 80px -16px rgba(17,28,36,.30);
          /* Second pass: brand red is an ACCENT, not a wash: colored shadows are short and faint. */
          --sh-brand: 0 1px 2px rgba(190,14,43,.18), 0 6px 14px -8px rgba(223,37,64,.45);
          --sh-glow: 0 0 0 1px rgba(223,37,64,.16);
          --ring: 0 0 0 3px rgba(223,37,64,.24);
          --ease-out: cubic-bezier(.2,.8,.2,1); --ease-spring: cubic-bezier(.34,1.56,.64,1);
        }
        [data-theme="dark"] {
          color-scheme: dark; /* dark native select popups + scrollbars */
          --c-brand: #FF4D63; --c-brand-dark: #C81F38; --c-brand-soft: #FF6F80;
          --c-bg: #0A0E13; --c-bg-grad1: rgba(255,77,99,.035); --c-bg-grad2: rgba(43,196,187,.045);
          --c-surface: #121A21; --c-surface-alt: #19232C; --c-surface-sunken: #0D1419; --c-surface-raised: #18222B;
          --c-border: #212D37; --c-border-strong: #33424E;
          --c-ink: #EAF0F4; --c-ink-dim: #A6B4BF; --c-ink-faint: #71838F;
          --c-on-brand: #FFFFFF;
          --c-ink-solid: #EAF0F4; --c-on-ink: #0A0E13;
          --c-brand-tint: rgba(255,77,99,.10); --c-brand-line: rgba(255,77,99,.32);
          --c-glass: rgba(12,17,23,.78); --c-glass-strong: rgba(18,26,33,.96);
          --c-hover: rgba(255,255,255,.06);
          --c-teal: #2BC4BB; --c-teal-dark: #17A8A0;
          --c-success: #3BC873; --c-warning: #F2A93A; --c-danger: #FF5A4E; --c-info: #4FA3E0; --c-purple: #A684F7;
          --sh-hi: inset 0 1px 0 rgba(255,255,255,.045);
          --sh-sm: 0 1px 2px rgba(0,0,0,.45);
          --sh-card: inset 0 1px 0 rgba(255,255,255,.045), 0 1px 2px rgba(0,0,0,.35), 0 6px 18px -8px rgba(0,0,0,.6);
          --sh-md: inset 0 1px 0 rgba(255,255,255,.05), 0 2px 6px rgba(0,0,0,.35), 0 14px 32px -10px rgba(0,0,0,.7);
          --sh-lg: 0 4px 12px rgba(0,0,0,.4), 0 24px 52px -14px rgba(0,0,0,.75);
          --sh-xl: 0 8px 20px rgba(0,0,0,.45), 0 40px 90px -18px rgba(0,0,0,.85);
          --sh-brand: 0 1px 2px rgba(0,0,0,.4), 0 6px 16px -8px rgba(255,77,99,.45);
          --sh-glow: 0 0 0 1px rgba(255,77,99,.26);
          --ring: 0 0 0 3px rgba(255,77,99,.32);
        }
        html, body { background: var(--c-bg); }
`
