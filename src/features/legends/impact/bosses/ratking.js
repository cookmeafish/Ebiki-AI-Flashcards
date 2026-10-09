// RATKING: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./ratking.parts.jsx.
export default {
  style: {
      color: '#ffc93a', accent: '#7a4f00', glyph: 'coin',
      hit: [['burst', { n: 6, spin: 720, size: 0.8 }], ['sparks', { n: 6, color: '#fff2b0' }]],
      crit: [['burst', { n: 14, spin: 900, size: 0.9, reach: 1.2 }], ['ring', { scale: 2 }], ['starburst', { points: 16, inner: 0.8, spin: 90 }]],
      strike: [['ratkingScepterSwing', {}], ['ratkingVolley', { n: 7 }], ['vignette', {}]],
      ko: [['speedlines', { color: '#fff2b0', n: 30, rot: 7 }], ['flash', { big: true }], ['crown', { at: 200 }], ['fountain', { at: 950, n: 26, glyph: 'coin', size: 0.7 }],
        ['ring', { at: 1300, scale: 2.6, width: 5 }], ['sparks', { at: 1300, n: 14, color: '#fff2b0', reach: 1.3 }], ['burst', { at: 1350, n: 12, spin: 900, reach: 1.4, size: 0.8 }], ['ratkingAvalanche', { at: 750, n: 22 }]],
      koMs: 2200, koPeak: 1300,
      sharpen: [['blade', { angle: 25, n: 2, color: '#fff2b0' }], ['fountain', { n: 10, glyph: 'coin', size: 0.5 }]],
      heavy: [['ratkingIngot', {}], ['drops', { n: 14, glyph: 'coin', size: 0.5 }], ['quake', { n: 2 }]],
      block: [['sigil', { sides: 10, turn: 36 }], ['burst', { n: 10, glyph: 'coin', size: 0.5, spin: 900 }]],
      shield: [['bubble', {}], ['deflect', { n: 7, glyph: 'coin' }]],
      wind: [['heart', {}], ['glint', { n: 8, color: '#ffe68a', size: 0.8 }]],
      body: { hit: 'spin', crit: 'twirl', sharpen: 'nick', strike: 'swipe', heavy: 'charge', block: 'rebound', shield: 'skid', wind: 'shrink', ko: 'dethroned' },
  },
  assault: { travel: 'shards', impact: 'blast', glyph: 'coin' }, // a volley of hard coins and a gold burst
  body: {},
}
