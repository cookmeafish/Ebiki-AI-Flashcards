// LICH: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./lich.parts.jsx.
export default {
  style: {
      color: '#5dff9e', accent: '#062a14', glyph: 'skull',
      hit: [['burst', { n: 4, spin: 180, size: 0.8 }], ['sparks', { n: 8, color: '#b8ffd4' }]],
      crit: [['burst', { n: 8, spin: 240 }], ['ring', { scale: 2.2, dashed: true }], ['starburst', { points: 6, inner: 0.25, spin: 60 }]],
      strike: [['projectile', { glyph: 'skull' }], ['ring', { scale: 2.4, width: 6 }], ['vignette', { color: '#2bd46f' }]],
      ko: [['speedlines', { color: '#b8ffd4', n: 40, rot: 11 }], ['flash', { big: true }], ['gem', { at: 150 }], ['crack', { at: 450, n: 6, color: '#b8ffd4' }],
        ['shards', { at: 1300, n: 16, color: '#5dff9e', reach: 1.3 }], ['ring', { at: 1350, color: '#5dff9e', scale: 2.6, width: 6 }], ['burst', { at: 1350, glyph: 'bone', n: 12, spin: 500, reach: 1.3 }], ['rise', { at: 1450, n: 12, glyph: 'wisp', color: '#5dff9e' }]],
      koMs: 2300, koPeak: 1350,
      sharpen: [['blade', { angle: 50, n: 2, color: '#b8ffd4' }], ['burst', { n: 6, glyph: 'bone', size: 0.5, spin: 600 }]],
      heavy: [['pull', { n: 12, glyph: 'skull' }], ['ring', { color: '#5dff9e', scale: 2.6, width: 6 }], ['quake', { n: 2, color: '#2bd46f' }]],
      block: [['sigil', { sides: 5, rot: 36, turn: 72 }], ['shards', { n: 8, color: '#5dff9e' }]],
      shield: [['bubble', {}], ['deflect', { n: 5, glyph: 'skull' }]],
      wind: [['heart', {}], ['rise', { n: 8, glyph: 'wisp', color: '#b8ffd4', size: 0.6 }], ['gust', { n: 2, color: '#5dff9e', turn: 100 }]],
      body: { hit: 'flicker', crit: 'jolt', sharpen: 'split', strike: 'cast', heavy: 'loom', block: 'jar', shield: 'rebuff', wind: 'shrink', ko: 'unbound' },
  },
  assault: { travel: 'orb', impact: 'curse' }, // a necrotic orb and a curse sigil burned onto your heart
  body: {},
}
