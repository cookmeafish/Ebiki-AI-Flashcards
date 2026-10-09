// VAMPIRE: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./vampire.parts.jsx.
export default {
  style: {
      color: '#ff2442', accent: '#2a0008', glyph: 'bat',
      hit: [['burst', { n: 5, size: 0.8, spin: 30 }], ['drops', { n: 6, glyph: 'drop', size: 0.4, color: '#c8001e' }]],
      crit: [['burst', { n: 10, size: 1, spin: 40 }], ['fangs', { n: 2, small: true }], ['starburst', { points: 7, inner: 0.3, spin: -60 }]],
      strike: [['fangs', { n: 2 }], ['drops', { n: 10, glyph: 'drop', size: 0.5, color: '#c8001e' }], ['vignette', {}]],
      ko: [['speedlines', { color: '#ff8a9a', n: 44, rot: 2 }], ['flash', { big: true }], ['charge', { at: 200, glyph: 'drop', color: '#ff2442' }], ['smoke', { at: 1000, dir: 'out', color: '#c8001e', n: 12 }],
        ['splat', { at: 1150, n: 12, color: '#c8001e', big: true, reach: 1.2 }], ['rise', { at: 1150, n: 20, glyph: 'bat', size: 0.9 }], ['burst', { at: 1200, n: 12, spin: 60, reach: 1.4 }], ['ring', { at: 1200, scale: 2.4, color: '#ff2442' }]],
      koMs: 2100, koPeak: 1200,
      sharpen: [['blade', { angle: 35, n: 2, color: '#ff8a9a' }], ['drops', { n: 5, glyph: 'drop', size: 0.35, color: '#c8001e' }]],
      heavy: [['claws', { n: 4, angle: -20, color: '#ff2442' }], ['splat', { n: 8, color: '#c8001e', big: true }], ['quake', { n: 1, color: '#8a0016' }]],
      block: [['sigil', { sides: 4, rot: 45, turn: 90 }], ['burst', { n: 5, glyph: 'bat', size: 0.6, spin: 40 }]],
      shield: [['bubble', {}], ['deflect', { n: 6, glyph: 'bat', from: 'side' }]],
      wind: [['heart', {}], ['rise', { n: 6, glyph: 'drop', size: 0.4, color: '#ff6b8a' }], ['gust', { n: 3, color: '#ff2442', turn: -130 }]],
      body: { hit: 'flinch', crit: 'twirl', sharpen: 'gash', strike: 'dart', heavy: 'pounce', block: 'stumble', shield: 'ricochet', wind: 'dim', ko: 'batBurst' },
  },
  assault: { travel: 'swarm', impact: 'bite' }, // bats pour out, then the fangs close on you
  body: {},
}
