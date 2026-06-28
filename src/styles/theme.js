import { C, FONT, RADIUS, SHADOW } from '../config/tokens'

// Ebiki — Ocean Light theme. Bright, friendly, red-focused (mascot #DF2540).
// Primary CTAs use the "3D" look (hard bottom edge in brandDark); add the
// className "btn-press" in JSX to get the Duolingo press-down on :active.

export const S = {
  app: {
    height: '100vh', color: C.ink,
    background: `radial-gradient(1100px 620px at 84% -12%, ${C.bgGrad1}, transparent 60%), radial-gradient(900px 560px at -6% 110%, ${C.bgGrad2}, transparent 55%), ${C.bg}`,
    fontFamily: FONT.body,
    display: 'flex', flexDirection: 'column', position: 'relative',
  },

  // Header
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px', borderBottom: `1px solid ${C.border}`,
    background: 'rgba(255,255,255,.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    flexWrap: 'wrap', gap: 8, position: 'relative', zIndex: 20,
    boxShadow: SHADOW.sm,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  tabBar: {
    display: 'flex', gap: 2, marginLeft: 16, borderRadius: RADIUS.pill, padding: 4,
    background: C.surfaceAlt, border: `1px solid ${C.border}`,
  },
  tab: {
    padding: '6px 16px', borderRadius: RADIUS.pill, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', border: 'none', fontFamily: FONT.body,
    background: 'transparent', color: C.inkDim, transition: 'color .18s ease, background .18s ease',
  },
  tabActive: {
    background: C.surface,
    color: C.brand,
    boxShadow: `${SHADOW.sm}, inset 0 0 0 1.5px ${C.brandRing}`,
  },
  title: {
    fontSize: 20, fontWeight: 800, margin: 0, fontFamily: FONT.display, letterSpacing: '.2px',
    background: `linear-gradient(92deg, ${C.brand}, ${C.brandDark})`,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  badge: {
    fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em',
    color: C.success, background: C.successTint,
    padding: '3px 8px', borderRadius: RADIUS.sm, border: `1px solid ${C.successTint}`,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  select: {
    padding: '7px 11px', background: C.surface, color: C.ink,
    border: `1px solid ${C.border}`, borderRadius: RADIUS.md, fontSize: 13,
    fontFamily: FONT.body, cursor: 'pointer', outline: 'none', fontWeight: 600,
  },
  ghostBtn: {
    padding: '7px 13px', background: C.surface, color: C.inkDim,
    border: `1px solid ${C.border}`, borderRadius: RADIUS.md, fontWeight: 700,
    fontSize: 12, fontFamily: FONT.body, cursor: 'pointer',
  },
  captureGroup: { display: 'flex', gap: 0, borderRadius: RADIUS.md, boxShadow: SHADOW.brand },
  captureBtn: {
    padding: '8px 15px', background: C.brand, color: C.white,
    border: 'none', borderRadius: `${RADIUS.md}px 0 0 ${RADIUS.md}px`, fontWeight: 800,
    fontSize: 13, fontFamily: FONT.body, cursor: 'pointer',
    display: 'flex', alignItems: 'center', boxShadow: `inset 0 -3px 0 ${C.brandDark}`,
  },
  uploadBtn: {
    padding: '8px 15px', background: C.brandDark, color: C.white,
    border: 'none', borderRadius: `0 ${RADIUS.md}px ${RADIUS.md}px 0`, fontWeight: 800,
    fontSize: 13, fontFamily: FONT.body, cursor: 'pointer',
    borderLeft: '1px solid rgba(255,255,255,.18)', boxShadow: `inset 0 -3px 0 rgba(0,0,0,.18)`,
  },
  kbd: {
    fontSize: 10, color: C.inkDim, background: C.surfaceAlt,
    border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 8px',
    fontFamily: FONT.mono,
  },
  kbdInline: {
    fontSize: '0.85em', color: C.inkDim, background: C.surfaceAlt,
    border: `1px solid ${C.border}`, borderRadius: 5, padding: '1px 5px',
    fontFamily: FONT.mono,
  },

  // API Key bar
  keyBar: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px',
    background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap',
  },
  keyLabel: { fontSize: 13, color: C.inkDim, fontWeight: 700 },
  keyInput: {
    flex: 1, minWidth: 200, padding: '9px 12px', background: C.surface,
    color: C.ink, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
    fontSize: 13, fontFamily: FONT.body, outline: 'none', fontWeight: 500,
  },
  getKeyLink: {
    padding: '8px 13px', background: C.brandTint, color: C.brand,
    border: `1px solid ${C.brandRing}`, borderRadius: RADIUS.md, fontWeight: 700,
    fontSize: 12, fontFamily: FONT.body, cursor: 'pointer', textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  keyDone: {
    padding: '8px 16px', background: C.brand, color: C.white,
    border: 'none', borderRadius: RADIUS.md, fontWeight: 800, fontSize: 13,
    fontFamily: FONT.body, cursor: 'pointer', boxShadow: `inset 0 -3px 0 ${C.brandDark}, ${SHADOW.brand}`,
  },

  // Main
  main: { flex: 1, padding: 20, overflow: 'auto', animation: 'fadeIn .28s ease' },

  // Empty state
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '65vh', textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 26, fontWeight: 800, margin: '0 0 10px', fontFamily: FONT.display,
    color: C.ink,
  },
  emptyDesc: {
    fontSize: 14, color: C.inkDim, maxWidth: 520, lineHeight: 1.7, margin: 0, fontWeight: 500,
  },
  methods: { display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' },
  methodCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '18px 28px', borderRadius: RADIUS.lg, border: `1px solid ${C.border}`,
    background: C.surface,
    fontSize: 13, fontWeight: 700, fontFamily: FONT.body,
    transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
    boxShadow: SHADOW.md, cursor: 'pointer', color: C.ink,
  },

  // Error
  errorBar: {
    background: C.dangerTint, border: `1px solid ${C.danger}`,
    color: C.danger, padding: '12px 16px', borderRadius: RADIUS.md,
    fontSize: 13, marginBottom: 16, fontWeight: 600,
  },
  errorActions: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap',
  },
  errorLink: {
    padding: '8px 14px', background: C.danger, color: C.white,
    borderRadius: RADIUS.md, fontWeight: 700, fontSize: 12, textDecoration: 'none',
    fontFamily: FONT.body,
  },
  errorSwitchBtn: {
    padding: '8px 12px', background: C.surface, color: C.inkDim,
    border: `1px solid ${C.border}`, borderRadius: RADIUS.md, fontWeight: 700,
    fontSize: 12, fontFamily: FONT.body, cursor: 'pointer',
  },

  // Progress
  progressBar: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, marginBottom: 12,
    boxShadow: SHADOW.sm,
  },
  progressDot: {
    width: 12, height: 12, borderRadius: '50%', background: C.brand,
    animation: 'pulse 1.5s ease infinite', flexShrink: 0,
  },
  progressText: { fontSize: 13, color: C.inkDim, fontWeight: 600 },

  // Image
  imageContainer: {
    position: 'relative', borderRadius: RADIUS.lg, overflow: 'hidden',
    border: `1px solid ${C.border}`, cursor: 'pointer', background: '#0b0e14',
    display: 'inline-block', maxWidth: '100%', margin: '0 auto',
    boxShadow: SHADOW.lg,
  },
  mainImage: { display: 'block', maxWidth: '100%', maxHeight: '75vh', height: 'auto', width: 'auto' },
  overlayLayer: { position: 'absolute', inset: 0 },
  capturedOverlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'rgba(11,14,20,.5)',
    backdropFilter: 'blur(2px)',
  },
  bigBtn: {
    display: 'flex', alignItems: 'center', padding: '16px 36px',
    background: C.brand, color: C.white, border: 'none', borderRadius: RADIUS.lg,
    fontWeight: 800, fontSize: 16, fontFamily: FONT.body, cursor: 'pointer',
    boxShadow: `inset 0 -4px 0 ${C.brandDark}, ${SHADOW.brand}`,
  },
  hint: {
    position: 'absolute', bottom: 12, right: 12,
    background: 'rgba(255,255,255,.92)', color: C.inkDim,
    padding: '6px 12px', borderRadius: RADIUS.sm, fontSize: 11,
    display: 'flex', alignItems: 'center', gap: 6,
    border: `1px solid ${C.border}`, pointerEvents: 'none', fontWeight: 600,
  },

  // Stats
  stats: { display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  stat: {
    fontSize: 12, color: C.inkDim, background: C.surface,
    border: `1px solid ${C.border}`, padding: '5px 11px', borderRadius: RADIUS.sm, fontWeight: 600,
  },

  // Expanded
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(22,36,44,.6)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, cursor: 'pointer', animation: 'fadeIn .2s ease', overflow: 'auto',
  },
  closeBadge: {
    position: 'fixed', top: 16, right: 20, zIndex: 1010,
    color: C.white, fontSize: 13, display: 'flex', alignItems: 'center',
    fontFamily: FONT.body, fontWeight: 700,
  },
  expandedWrap: {
    position: 'relative', maxWidth: '95vw', maxHeight: '92vh',
    display: 'inline-block',
    cursor: 'default', borderRadius: RADIUS.lg, overflow: 'hidden',
    boxShadow: SHADOW.xl,
  },
  expandedImg: {
    display: 'block', maxWidth: '95vw', maxHeight: '92vh', width: 'auto', height: 'auto',
  },

  // Tooltip
  tooltip: {
    position: 'fixed', transform: 'translate(-50%, -100%)',
    background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    border: `1px solid ${C.border}`,
    borderRadius: RADIUS.lg, padding: '12px 16px', zIndex: 9999,
    boxShadow: SHADOW.xl,
    minWidth: 170, maxWidth: 300, pointerEvents: 'none',
    animation: 'fadeUp .14s ease',
    fontFamily: FONT.body, color: C.ink,
  },
  tooltipBackdrop: {
    position: 'fixed', inset: 0, zIndex: 9998,
    background: 'rgba(22,36,44,.25)',
  },
  tooltipExpanded: {
    position: 'fixed', left: '50%', top: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: 900, width: '92vw', maxHeight: '85vh',
    overflowY: 'auto', pointerEvents: 'auto',
    borderRadius: RADIUS.lg, padding: '24px 32px',
    boxShadow: SHADOW.xl,
    border: `1px solid ${C.border}`,
    background: 'rgba(255,255,255,.98)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    animation: 'pop .18s cubic-bezier(.34,1.56,.64,1)', color: C.ink,
  },
  ttWord: { fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 2, fontFamily: FONT.display },
  ttTrans: { fontSize: 14, color: C.brand, fontWeight: 700, marginBottom: 8 },
  ttEng: {
    fontSize: 11, color: C.success, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8,
  },
  ttSynWrap: { borderTop: `1px solid ${C.border}`, paddingTop: 8 },
  ttSynLabel: {
    fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em',
    color: C.inkFaint, marginBottom: 6, fontWeight: 700,
  },
  ttSynList: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  ttSynChip: {
    fontSize: 11, background: C.brandTint, color: C.brand,
    padding: '3px 8px', borderRadius: RADIUS.sm, fontWeight: 700,
  },
  ttConf: {
    fontSize: 10, color: C.inkFaint, marginTop: 8,
    borderTop: `1px solid ${C.border}`, paddingTop: 6,
  },
  ttClose: {
    fontSize: 18, color: C.inkFaint, cursor: 'pointer', lineHeight: 1,
    padding: '0 2px', marginLeft: 8,
  },
  ttClickHint: {
    fontSize: 10, color: C.inkFaint, marginTop: 8,
    borderTop: `1px solid ${C.border}`, paddingTop: 6, textAlign: 'center',
  },
  ttActions: {
    marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8,
  },
  ttExplainBtn: {
    display: 'flex', alignItems: 'center', width: '100%',
    padding: '8px 12px', background: C.brandTint, color: C.brand,
    border: `1px solid ${C.brandRing}`, borderRadius: RADIUS.md,
    fontWeight: 700, fontSize: 12, fontFamily: FONT.body, cursor: 'pointer',
    justifyContent: 'center',
  },
  ttExplaining: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 12, color: C.inkDim,
  },
  ttExplainingDot: {
    width: 8, height: 8, borderRadius: '50%', background: C.brand,
    animation: 'pulse 1.5s ease infinite', flexShrink: 0,
  },
  ttExplanation: {
    fontSize: 14, color: C.ink, lineHeight: 1.7,
    background: C.surfaceSunken, borderRadius: RADIUS.md,
    padding: '10px 14px', marginTop: 6,
  },
  ttBtnRow: {
    display: 'flex', gap: 6, marginTop: 8,
  },
  ttDeepBtn: {
    flex: 1, padding: '8px 10px', background: C.purpleTint, color: C.purple,
    border: `1px solid ${C.purpleTint}`, borderRadius: RADIUS.md,
    fontWeight: 700, fontSize: 12, fontFamily: FONT.body, cursor: 'pointer',
    textAlign: 'center',
  },
  ttStudyBtn: {
    flex: 1, padding: '8px 10px', background: C.successTint, color: C.success,
    border: `1px solid ${C.successTint}`, borderRadius: RADIUS.md,
    fontWeight: 700, fontSize: 12, fontFamily: FONT.body, cursor: 'pointer',
    textAlign: 'center',
  },
  ttAnkiBtn: {
    flex: 1, padding: '8px 10px', background: C.brandTint, color: C.brand,
    border: `1px solid ${C.brandRing}`, borderRadius: RADIUS.md,
    fontWeight: 700, fontSize: 12, fontFamily: FONT.body, cursor: 'pointer',
    textAlign: 'center',
  },
  ttAnkiCard: {
    marginTop: 8, background: C.surfaceSunken,
    border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
    padding: '10px 14px', fontSize: 12, lineHeight: 1.6,
  },
  ttAnkiCardLabel: {
    fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em',
    color: C.inkFaint, marginBottom: 2,
  },
  ttAnkiCardContent: {
    color: C.ink, marginBottom: 8,
  },
  ttAnkiSyncBtn: {
    padding: '6px 12px', background: C.brand, color: C.white,
    border: 'none', borderRadius: RADIUS.sm,
    fontWeight: 700, fontSize: 10, fontFamily: FONT.body, cursor: 'pointer',
  },
  ttAnkiSynced: {
    fontSize: 10, fontWeight: 700, color: C.success,
  },
  ttAnkiWarning: {
    fontSize: 10, color: C.warning, marginTop: 6, lineHeight: 1.4,
  },
  ttDeepExplanation: {
    fontSize: 14, color: C.ink, lineHeight: 1.8, whiteSpace: 'pre-wrap',
    background: C.purpleTint, border: `1px solid ${C.purpleTint}`,
    borderRadius: RADIUS.md, padding: '14px 18px', marginTop: 8,
  },
  ttWordStudy: {
    marginTop: 8, border: `1px solid ${C.successTint}`,
    borderRadius: RADIUS.md, overflow: 'hidden',
  },
  ttWordStudyHeader: {
    fontSize: 12, fontWeight: 800, color: C.success,
    background: C.successTint, padding: '8px 10px',
    borderBottom: `1px solid ${C.successTint}`,
  },
  ttWordStudyBody: {
    padding: '14px 16px', background: C.surfaceSunken,
  },
  ttChatSection: {
    marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8,
  },
  ttChatLabel: {
    fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em',
    color: C.inkFaint, marginBottom: 6, fontWeight: 700,
  },
  ttChatUser: {
    fontSize: 12, color: C.ink, background: C.brandTint,
    borderRadius: RADIUS.md, padding: '6px 10px', marginBottom: 4, textAlign: 'right',
  },
  ttChatAssistant: {
    fontSize: 12, color: C.ink, background: C.surfaceSunken,
    borderRadius: RADIUS.md, padding: '6px 10px', marginBottom: 4, lineHeight: 1.5,
  },
  ttChatInputRow: {
    display: 'flex', gap: 4, marginTop: 4,
  },
  ttChatInput: {
    flex: 1, padding: '7px 9px', background: C.surface, color: C.ink,
    border: `1px solid ${C.border}`, borderRadius: RADIUS.md, fontSize: 11,
    fontFamily: FONT.body, outline: 'none',
  },
  ttChatSend: {
    padding: '7px 11px', background: C.brand, color: C.white,
    border: 'none', borderRadius: RADIUS.md, fontWeight: 700, fontSize: 11,
    fontFamily: FONT.body, cursor: 'pointer',
  },

  // Drag overlay
  dragOverlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(242,245,248,.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dragBox: {
    border: `2px dashed ${C.brand}`, borderRadius: RADIUS.xl,
    padding: '48px 64px', display: 'flex',
    flexDirection: 'column', alignItems: 'center',
    background: C.brandTint2, boxShadow: SHADOW.lg,
    animation: 'pop .2s ease', color: C.ink,
  },
}
