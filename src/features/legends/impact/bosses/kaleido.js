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
      crit: [['shards', { n: 14, rainbow: true }], ['rays', { n: 12, rainbow: true }], ['starburst', { points: 6, inner: 0.2, spin: 180 }]],
      strike: [['kaleidoRay', {}], ['shards', { n: 12, rainbow: true, inward: true }]],
      ko: [['speedlines', { color: '#ffffff', n: 54, rot: 20 }], ['flash', { big: true }], ['mandala', { at: 100 }], ['crack', { at: 750, n: 10, color: '#ffffff' }],
        ['shards', { at: 1150, n: 28, rainbow: true, reach: 1.5 }], ['rays', { at: 1150, n: 18, rainbow: true }], ['ring', { at: 1200, color: '#ffffff', scale: 2.8, width: 5 }]],
      koMs: 2100, koPeak: 1150,
      sharpen: [['blade', { angle: -50, n: 3, color: '#ffffff', fan: 60, gap: 40 }], ['shards', { n: 8, rainbow: true }]],
      heavy: [['kaleidoTriSlash', {}], ['shards', { n: 16, rainbow: true, reach: 1.3 }], ['quake', { n: 2, color: '#ff8a1a' }]],
      block: [['sigil', { sides: 6, rot: 30, turn: 180 }], ['shards', { n: 12, rainbow: true }]],
      shield: [['bubble', {}], ['deflect', { n: 6, glyph: 'shard' }]],
      wind: [['heart', {}], ['glint', { n: 10, color: '#ffffff', size: 0.7 }]],
      body: { hit: 'flinch', crit: 'twirl', sharpen: 'split', strike: 'cast', heavy: 'quake', block: 'jar', shield: 'rebuff', wind: 'sway', ko: 'refract' },
  },
  assault: { travel: 'beam', impact: 'crack' }, // a prism ray and the screen splinters into facets
  body: {},
}
