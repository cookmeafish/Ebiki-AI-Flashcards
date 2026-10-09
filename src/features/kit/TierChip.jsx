// The question ladder's chip (utils/questionTier.js): how far along this card is, shown above every question in
// Study, raids and Legends fights alike. One component so every surface looks the same.
import { C, FONT, RADIUS } from '../../config/tokens'
import { clampTier, tierIcon, tierLabelKey, tierTipKey } from '../../utils/questionTier'

// Color per tier: new is fresh green, then blue, brand purple, warning amber, brand red for mastery.
const TIER_COLOR = [C.success, C.teal, C.info, C.purple, C.warning, C.brand]

export default function TierChip({ t, tier, style }) {
  if (tier === undefined || tier === null || !t) return null
  const k = clampTier(tier)
  const color = TIER_COLOR[k]
  return (
    <span className="tip" data-tip={t(tierTipKey(k))} data-tier={k}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 8px', borderRadius: RADIUS.pill,
        fontFamily: FONT.display, fontSize: 11, fontWeight: 700, lineHeight: 1.6, whiteSpace: 'nowrap',
        color: k === 5 ? C.brandText : color, border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
        background: `color-mix(in srgb, ${color} 12%, transparent)`, ...style }}>
      <span aria-hidden="true">{tierIcon(k)}</span>{t(tierLabelKey(k))}
    </span>
  )
}
