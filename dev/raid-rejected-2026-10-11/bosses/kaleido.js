// KALEIDO: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./kaleido.parts.jsx.
export default {
  style: {
      color: '#ff8a1a', accent: '#ffffff', glyph: 'shard',
      hit: [['shards', { n: 6, rainbow: true }], ['ring', { color: '#ffffff' }]],
      crit: [['shards', { n: 14, rainbow: true }], ['rays', { n: 12, rainbow: true }], ['starburst', { points: 6, inner: 0.2, spin: 180, y: 72 }]],
      strike: [['kaleidoRay', { y: 76 }], ['shards', { n: 12, rainbow: true, inward: true }]],
      ko: [['speedlines', { color: '#ffffff', n: 54, rot: 20 }], ['flash', {}], ['mandala', { at: 100 }], ['crack', { at: 750, n: 10, color: '#ffffff' }],
        ['shards', { at: 1150, n: 28, rainbow: true, reach: 1.5 }], ['rays', { at: 1150, n: 18, rainbow: true }], ['ring', { at: 1200, color: '#ffffff', scale: 2.8, width: 5 }]],
      koMs: 2100, koPeak: 1150,
      sharpen: [['blade', { angle: -50, n: 3, color: '#ffffff', fan: 60, gap: 40 }], ['shards', { n: 8, rainbow: true }]],
      heavy: [['kaleidoTriSlash', { y: 70, x: 84, at: 220 }], ['shards', { n: 12, rainbow: true, reach: 1.3 }], ['quake', { n: 1, color: '#ff8a1a' }]],
      block: [['kaleidoPane', { y: 74 }], ['shards', { n: 12, rainbow: true }]],
      shield: [['bubble', {}], ['deflect', { n: 6, glyph: 'shard' }]],
      shieldRingTop: 80, // the save's ring starts at the chest prism (from the box's centre it sat on his mouth, an "O")
      wind: [['heart', {}], ['glint', { n: 10, color: '#ffffff', size: 0.7, y: 26, spread: 0.55 }]],
      body: { hit: 'flinch', crit: 'twirl', sharpen: 'split', strike: 'kaleidoThrow', heavy: 'kaleidoCleave', block: 'jar', shield: 'rebuff', wind: 'sway', ko: 'refract' },
  },
  assault: { travel: 'shards', impact: 'crack' }, // a volley of mirror shards flies off him and the screen splinters into facets (a beam crossed his own face and washed him out)
  // His own strike moves on the boss box (outside the art's clip, so the whole knight can lunge): he rears back and
  // THROWS himself into the ray at the player (to his right); the heavy blow throws twice, the second harder.
  body: {
    strike: { kaleidoThrow: '0% { transform: none } 22% { transform: translate(-10px, 2px) rotate(-5deg) scale(.97) } 40% { transform: translate(16px, 4px) rotate(5deg) scale(1.16) } 66% { transform: translate(5px, 1px) rotate(2deg) scale(1.05) } 100% { transform: none }' },
    // the heavy blow: a long wind-up (he rears back and sinks, gathering), then the whole knight CLEAVES down and across
    // at the hearts, far past his plain throw, and drives through a second time before he recovers
    heavy: { kaleidoCleave: '0% { transform: none } 16% { transform: translate(-16px, 3px) rotate(-10deg) scale(.9) } 30% { transform: translate(-18px, 4px) rotate(-11deg) scale(.89) } 40% { transform: translate(26px, 10px) rotate(12deg) scale(1.3) } 50% { transform: translate(21px, 8px) rotate(9deg) scale(1.26) } 60% { transform: translate(30px, 13px) rotate(14deg) scale(1.34) } 80% { transform: translate(8px, 3px) rotate(3deg) scale(1.08) } 100% { transform: none }' },
  },
}
