// The app's color palettes as CSS variables: :root = Ocean Light, [data-theme="dark"] = Dark. The single source of
// the --c-* values that src/config/tokens.js names. Rendered by App (and its pre-config screen) and by dev tools
// such as the Legends art gallery (dev/legends-gallery).
// App note: Also rendered by the pre-config screen: without it a dark-theme user saw a LIGHT screen on
// every launch until the config answered, and the slow-start screen's Restart button had no colours.
export const PALETTE_CSS = `
        :root {
          color-scheme: light; /* native controls (select popups, scrollbars) match light theme */
          --c-brand: #DF2540; --c-brand-dark: #C00A29; --c-brand-soft: #FF5468;
          --c-bg: #F2F5F8; --c-bg-grad1: rgba(223,37,64,.05); --c-bg-grad2: rgba(17,168,160,.045);
          --c-surface: #FFFFFF; --c-surface-alt: #EAEEF2; --c-surface-sunken: #F5F8FA;
          --c-border: #E2E8ED; --c-border-strong: #CDD7DE;
          --c-ink: #16242C; --c-ink-dim: #51626C; --c-ink-faint: #8A99A3;
          --c-on-brand: #FFFFFF;
          --c-glass: rgba(255,255,255,.82); --c-glass-strong: rgba(255,255,255,.97);
          --c-teal: #11A8A0; --c-teal-dark: #0C857F;
          /* Light-mode semantic colors run DEEPER than dark mode's: at small sizes on the light
             background, #18A957 green and #E8930C amber shared the same luminance and blended. */
          --c-success: #0E8746; --c-warning: #B36A00; --c-danger: #D32F24; --c-info: #2D86C9; --c-purple: #7C4DEF;
          --sh-sm: 0 1px 2px rgba(16,36,44,.06); --sh-md: 0 4px 14px rgba(16,36,44,.08);
          --sh-lg: 0 12px 32px rgba(16,36,44,.10); --sh-xl: 0 24px 60px rgba(16,36,44,.16);
          --sh-brand: 0 6px 18px rgba(223,37,64,.28);
        }
        [data-theme="dark"] {
          color-scheme: dark; /* dark native select popups + scrollbars */
          --c-brand: #FF4D63; --c-brand-dark: #C81F38; --c-brand-soft: #FF6F80;
          --c-bg: #0E1419; --c-bg-grad1: rgba(255,77,99,.07); --c-bg-grad2: rgba(17,168,160,.06);
          --c-surface: #18222B; --c-surface-alt: #202C36; --c-surface-sunken: #131C24;
          --c-border: #2A3742; --c-border-strong: #3A4955;
          --c-ink: #E8EEF2; --c-ink-dim: #A2B0BB; --c-ink-faint: #6E808C;
          --c-on-brand: #FFFFFF;
          --c-glass: rgba(20,28,35,.78); --c-glass-strong: rgba(22,30,38,.96);
          --c-teal: #2BC4BB; --c-teal-dark: #17A8A0;
          --c-success: #3BC873; --c-warning: #F2A93A; --c-danger: #FF5A4E; --c-info: #4FA3E0; --c-purple: #A684F7;
          --sh-sm: 0 1px 2px rgba(0,0,0,.4); --sh-md: 0 4px 14px rgba(0,0,0,.5);
          --sh-lg: 0 12px 32px rgba(0,0,0,.55); --sh-xl: 0 24px 60px rgba(0,0,0,.65);
          --sh-brand: 0 6px 18px rgba(255,77,99,.35);
        }
        html, body { background: var(--c-bg); }
`
