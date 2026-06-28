export const S = {
  app: {
    height: '100vh', color: '#e6edf3',
    background: 'radial-gradient(1100px 620px at 82% -12%, rgba(88,166,255,.10), transparent 60%), radial-gradient(900px 560px at -5% 108%, rgba(210,168,255,.08), transparent 55%), linear-gradient(180deg, #0d1117 0%, #0b0e14 100%)',
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    display: 'flex', flexDirection: 'column', position: 'relative',
  },

  // Header
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.06)',
    background: 'rgba(18,22,29,.72)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    flexWrap: 'wrap', gap: 8, position: 'relative', zIndex: 20,
    boxShadow: '0 1px 0 rgba(255,255,255,.03), 0 8px 24px -16px rgba(0,0,0,.6)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  tabBar: {
    display: 'flex', gap: 2, marginLeft: 16, borderRadius: 9, padding: 3,
    background: 'rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.05)',
  },
  tab: {
    padding: '6px 15px', borderRadius: 7, fontSize: 11, fontWeight: 600,
    cursor: 'pointer', border: 'none', fontFamily: 'inherit',
    background: 'transparent', color: '#8b95a3', transition: 'color .18s ease, background .18s ease',
  },
  tabActive: {
    background: 'linear-gradient(180deg, rgba(88,166,255,.22), rgba(88,166,255,.09))',
    color: '#fff',
    boxShadow: '0 2px 10px rgba(88,166,255,.22), inset 0 0 0 1px rgba(88,166,255,.32)',
  },
  title: {
    fontSize: 16, fontWeight: 700, margin: 0,
    background: 'linear-gradient(90deg, #e6edf3, #9db4d6)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  badge: {
    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em',
    color: '#7ee787', background: 'linear-gradient(180deg, rgba(126,231,135,.22), rgba(126,231,135,.08))',
    padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(126,231,135,.22)',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  select: {
    padding: '6px 10px', background: '#1a2029', color: '#e6edf3',
    border: '1px solid #2f3947', borderRadius: 8, fontSize: 11,
    fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
  },
  ghostBtn: {
    padding: '6px 12px', background: 'rgba(255,255,255,.02)', color: '#8b95a3',
    border: '1px solid #2f3947', borderRadius: 8, fontWeight: 600,
    fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
  },
  captureGroup: { display: 'flex', gap: 0, boxShadow: '0 4px 14px rgba(88,166,255,.30)', borderRadius: 8 },
  captureBtn: {
    padding: '7px 14px', background: 'linear-gradient(135deg, #58a6ff, #4b87e0)', color: '#0a1020',
    border: 'none', borderRadius: '8px 0 0 8px', fontWeight: 700,
    fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
  },
  uploadBtn: {
    padding: '7px 14px', background: 'linear-gradient(135deg, #4b87e0, #3a6fcc)', color: '#0a1020',
    border: 'none', borderRadius: '0 8px 8px 0', fontWeight: 700,
    fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
    borderLeft: '1px solid rgba(10,16,32,.3)',
  },
  kbd: {
    fontSize: 10, color: '#7d8590', background: '#1c2129',
    border: '1px solid rgba(255,255,255,.08)', borderRadius: 4, padding: '3px 8px',
    fontFamily: 'inherit',
  },
  kbdInline: {
    fontSize: '0.85em', color: '#7d8590', background: '#1c2129',
    border: '1px solid rgba(255,255,255,.08)', borderRadius: 3, padding: '1px 5px',
    fontFamily: 'inherit',
  },

  // API Key bar
  keyBar: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
    background: 'rgba(20,25,33,.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,.06)', flexWrap: 'wrap',
  },
  keyLabel: { fontSize: 12, color: '#8b95a3', fontWeight: 600 },
  keyInput: {
    flex: 1, minWidth: 200, padding: '7px 11px', background: 'rgba(0,0,0,.28)',
    color: '#e6edf3', border: '1px solid #2f3947', borderRadius: 8,
    fontSize: 12, fontFamily: 'inherit', outline: 'none',
  },
  getKeyLink: {
    padding: '6px 12px', background: 'rgba(88,166,255,.12)', color: '#58a6ff',
    border: '1px solid rgba(88,166,255,.25)', borderRadius: 8, fontWeight: 600,
    fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  keyDone: {
    padding: '6px 14px', background: 'linear-gradient(135deg, #58a6ff, #4b87e0)', color: '#0a1020',
    border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12,
    fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 14px rgba(88,166,255,.30)',
  },

  // Main
  main: { flex: 1, padding: 20, overflow: 'auto', animation: 'fadeIn .28s ease' },

  // Empty state
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '65vh', textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 22, fontWeight: 700, margin: '0 0 10px',
    background: 'linear-gradient(90deg, #e6edf3, #9db4d6)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  emptyDesc: {
    fontSize: 13, color: '#7d8590', maxWidth: 520, lineHeight: 1.7, margin: 0,
  },
  methods: { display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' },
  methodCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '18px 28px', borderRadius: 14, border: '1px solid',
    background: 'linear-gradient(180deg, rgba(30,36,46,.9), rgba(20,25,33,.9))',
    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
    transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
    boxShadow: '0 8px 24px -18px rgba(0,0,0,.8)', cursor: 'pointer',
  },

  // Error
  errorBar: {
    background: 'rgba(248,81,73,.1)', border: '1px solid #f85149',
    color: '#f85149', padding: '12px 16px', borderRadius: 6,
    fontSize: 13, marginBottom: 16,
  },
  errorActions: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap',
  },
  errorLink: {
    padding: '6px 14px', background: '#f85149', color: '#fff',
    borderRadius: 6, fontWeight: 700, fontSize: 12, textDecoration: 'none',
    fontFamily: 'inherit',
  },
  errorSwitchBtn: {
    padding: '6px 12px', background: 'transparent', color: '#7d8590',
    border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, fontWeight: 600,
    fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
  },

  // Progress
  progressBar: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
    background: 'linear-gradient(180deg, rgba(30,36,46,.9), rgba(20,25,33,.9))',
    border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, marginBottom: 12,
    boxShadow: '0 8px 24px -18px rgba(0,0,0,.8)',
  },
  progressDot: {
    width: 12, height: 12, borderRadius: '50%', background: '#58a6ff',
    animation: 'pulse 1.5s ease infinite', flexShrink: 0,
  },
  progressText: { fontSize: 12, color: '#7d8590' },

  // Image
  imageContainer: {
    position: 'relative', borderRadius: 14, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,.08)', cursor: 'pointer', background: '#000',
    display: 'inline-block', maxWidth: '100%', margin: '0 auto',
    boxShadow: '0 20px 60px -28px rgba(0,0,0,.9)',
  },
  mainImage: { display: 'block', maxWidth: '100%', maxHeight: '75vh', height: 'auto', width: 'auto' },
  overlayLayer: { position: 'absolute', inset: 0 },
  capturedOverlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'rgba(14,17,23,.55)',
    backdropFilter: 'blur(2px)',
  },
  bigBtn: {
    display: 'flex', alignItems: 'center', padding: '16px 36px',
    background: 'linear-gradient(135deg, #d2a8ff, #a371f7)', color: '#0a1020', border: 'none', borderRadius: 12,
    fontWeight: 700, fontSize: 16, fontFamily: 'inherit', cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(163,113,247,.4)',
  },
  hint: {
    position: 'absolute', bottom: 12, right: 12,
    background: 'rgba(14,17,23,.85)', color: '#7d8590',
    padding: '6px 12px', borderRadius: 6, fontSize: 11,
    display: 'flex', alignItems: 'center', gap: 6,
    border: '1px solid rgba(255,255,255,.08)', pointerEvents: 'none',
  },

  // Stats
  stats: { display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  stat: {
    fontSize: 11, color: '#8b95a3', background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.06)', padding: '4px 10px', borderRadius: 6,
  },

  // Expanded
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(2,4,8,.94)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, cursor: 'pointer', animation: 'fadeIn .2s ease', overflow: 'auto',
  },
  closeBadge: {
    position: 'fixed', top: 16, right: 20, zIndex: 1010,
    color: '#7d8590', fontSize: 13, display: 'flex', alignItems: 'center',
    fontFamily: "'JetBrains Mono', monospace",
  },
  expandedWrap: {
    position: 'relative', maxWidth: '95vw', maxHeight: '92vh',
    display: 'inline-block',
    cursor: 'default', borderRadius: 8, overflow: 'hidden',
    boxShadow: '0 16px 64px rgba(0,0,0,.6)',
  },
  expandedImg: {
    display: 'block', maxWidth: '95vw', maxHeight: '92vh', width: 'auto', height: 'auto',
  },

  // Tooltip
  tooltip: {
    position: 'fixed', transform: 'translate(-50%, -100%)',
    background: 'rgba(26,32,41,.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 12, padding: '12px 16px', zIndex: 9999,
    boxShadow: '0 18px 50px rgba(0,0,0,.7)',
    minWidth: 170, maxWidth: 300, pointerEvents: 'none',
    animation: 'fadeUp .14s ease',
    fontFamily: "'JetBrains Mono', monospace",
  },
  tooltipBackdrop: {
    position: 'fixed', inset: 0, zIndex: 9998,
    background: 'rgba(2,4,8,.35)',
  },
  tooltipExpanded: {
    position: 'fixed', left: '50%', top: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: 900, width: '92vw', maxHeight: '85vh',
    overflowY: 'auto', pointerEvents: 'auto',
    borderRadius: 16, padding: '24px 32px',
    boxShadow: '0 32px 90px rgba(0,0,0,.85)',
    border: '1px solid rgba(255,255,255,.1)',
    background: 'rgba(22,27,34,.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    animation: 'pop .18s cubic-bezier(.34,1.56,.64,1)',
  },
  ttWord: { fontSize: 17, fontWeight: 700, color: '#e6edf3', marginBottom: 2 },
  ttTrans: { fontSize: 14, color: '#58a6ff', fontWeight: 500, marginBottom: 8 },
  ttEng: {
    fontSize: 11, color: '#7ee787', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8,
  },
  ttSynWrap: { borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 8 },
  ttSynLabel: {
    fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em',
    color: '#7d8590', marginBottom: 6, fontWeight: 600,
  },
  ttSynList: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  ttSynChip: {
    fontSize: 11, background: 'rgba(88,166,255,.12)', color: '#58a6ff',
    padding: '3px 8px', borderRadius: 4, fontWeight: 500,
  },
  ttConf: {
    fontSize: 10, color: '#7d8590', marginTop: 8,
    borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 6,
  },
  ttClose: {
    fontSize: 18, color: '#7d8590', cursor: 'pointer', lineHeight: 1,
    padding: '0 2px', marginLeft: 8,
  },
  ttClickHint: {
    fontSize: 10, color: '#484f58', marginTop: 8,
    borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 6, textAlign: 'center',
  },
  ttActions: {
    marginTop: 8, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 8,
  },
  ttExplainBtn: {
    display: 'flex', alignItems: 'center', width: '100%',
    padding: '7px 12px', background: 'rgba(88,166,255,.12)', color: '#58a6ff',
    border: '1px solid rgba(88,166,255,.25)', borderRadius: 6,
    fontWeight: 600, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
    justifyContent: 'center',
  },
  ttExplaining: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11, color: '#7d8590',
  },
  ttExplainingDot: {
    width: 8, height: 8, borderRadius: '50%', background: '#58a6ff',
    animation: 'pulse 1.5s ease infinite', flexShrink: 0,
  },
  ttExplanation: {
    fontSize: 14, color: '#c9d1d9', lineHeight: 1.7,
    background: 'rgba(88,166,255,.06)', borderRadius: 6,
    padding: '10px 14px', marginTop: 6,
  },
  ttBtnRow: {
    display: 'flex', gap: 6, marginTop: 8,
  },
  ttDeepBtn: {
    flex: 1, padding: '7px 10px', background: 'rgba(210,168,255,.12)', color: '#d2a8ff',
    border: '1px solid rgba(210,168,255,.25)', borderRadius: 6,
    fontWeight: 600, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
    textAlign: 'center',
  },
  ttStudyBtn: {
    flex: 1, padding: '7px 10px', background: 'rgba(126,231,135,.12)', color: '#7ee787',
    border: '1px solid rgba(126,231,135,.25)', borderRadius: 6,
    fontWeight: 600, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
    textAlign: 'center',
  },
  ttAnkiBtn: {
    flex: 1, padding: '7px 10px', background: 'rgba(88,166,255,.12)', color: '#58a6ff',
    border: '1px solid rgba(88,166,255,.25)', borderRadius: 6,
    fontWeight: 600, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
    textAlign: 'center',
  },
  ttAnkiCard: {
    marginTop: 8, background: 'rgba(88,166,255,.04)',
    border: '1px solid rgba(88,166,255,.15)', borderRadius: 8,
    padding: '10px 14px', fontSize: 12, lineHeight: 1.6,
  },
  ttAnkiCardLabel: {
    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
    color: '#7d8590', marginBottom: 2,
  },
  ttAnkiCardContent: {
    color: '#e6edf3', marginBottom: 8,
  },
  ttAnkiSyncBtn: {
    padding: '5px 12px', background: 'rgba(88,166,255,.2)', color: '#58a6ff',
    border: '1px solid rgba(88,166,255,.3)', borderRadius: 5,
    fontWeight: 600, fontSize: 10, fontFamily: 'inherit', cursor: 'pointer',
  },
  ttAnkiSynced: {
    fontSize: 10, fontWeight: 600, color: '#7ee787',
  },
  ttAnkiWarning: {
    fontSize: 10, color: '#d29922', marginTop: 6, lineHeight: 1.4,
  },
  ttDeepExplanation: {
    fontSize: 14, color: '#c9d1d9', lineHeight: 1.8, whiteSpace: 'pre-wrap',
    background: 'rgba(210,168,255,.04)', border: '1px solid rgba(210,168,255,.12)',
    borderRadius: 8, padding: '14px 18px', marginTop: 8,
  },
  ttWordStudy: {
    marginTop: 8, border: '1px solid rgba(126,231,135,.2)',
    borderRadius: 8, overflow: 'hidden',
  },
  ttWordStudyHeader: {
    fontSize: 12, fontWeight: 700, color: '#7ee787',
    background: 'rgba(126,231,135,.08)', padding: '8px 10px',
    borderBottom: '1px solid rgba(126,231,135,.15)',
  },
  ttWordStudyBody: {
    padding: '14px 16px', background: 'rgba(126,231,135,.03)',
  },
  ttChatSection: {
    marginTop: 8, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 8,
  },
  ttChatLabel: {
    fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em',
    color: '#7d8590', marginBottom: 6, fontWeight: 600,
  },
  ttChatUser: {
    fontSize: 12, color: '#e6edf3', background: 'rgba(88,166,255,.1)',
    borderRadius: 6, padding: '6px 10px', marginBottom: 4, textAlign: 'right',
  },
  ttChatAssistant: {
    fontSize: 12, color: '#c9d1d9', background: 'rgba(126,231,135,.06)',
    borderRadius: 6, padding: '6px 10px', marginBottom: 4, lineHeight: 1.5,
  },
  ttChatInputRow: {
    display: 'flex', gap: 4, marginTop: 4,
  },
  ttChatInput: {
    flex: 1, padding: '6px 8px', background: '#0e1117', color: '#e6edf3',
    border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, fontSize: 11,
    fontFamily: 'inherit', outline: 'none',
  },
  ttChatSend: {
    padding: '6px 10px', background: '#58a6ff', color: '#0e1117',
    border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 11,
    fontFamily: 'inherit', cursor: 'pointer',
  },

  // Drag overlay
  dragOverlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(14,17,23,.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dragBox: {
    border: '2px dashed #58a6ff', borderRadius: 20,
    padding: '48px 64px', display: 'flex',
    flexDirection: 'column', alignItems: 'center',
    background: 'rgba(88,166,255,.06)', boxShadow: '0 0 60px rgba(88,166,255,.15)',
    animation: 'pop .2s ease',
  },
}
