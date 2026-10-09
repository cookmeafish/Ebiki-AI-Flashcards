// TITAN: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./titan.parts.jsx.
export default {
  style: {
      color: '#ff7a1c', accent: '#3a1a08', glyph: 'fist',
      hit: [['burst', { n: 5, glyph: 'nut', size: 0.7, spin: 300 }], ['sparks', { n: 10, color: '#ffd27a' }]],
      crit: [['sparks', { n: 18, color: '#ffe0a0', reach: 1.2 }], ['ring', { scale: 2.2, width: 5 }], ['crack', { n: 4 }], ['starburst', { points: 6, inner: 0.55, spin: 0 }]],
      strike: [['slam', { glyph: 'fist' }], ['crack', { n: 5 }], ['dust', { n: 10 }]],
      ko: [['speedlines', { color: '#ffd27a', n: 32 }], ['flash', { big: true }], ['popchain', { at: 200, n: 6 }], ['sparks', { at: 300, n: 18, color: '#ffe0a0', reach: 1.2 }],
        ['crack', { at: 1450, n: 9 }], ['dust', { at: 1550, n: 18 }], ['ring', { at: 1550, scale: 2.8, width: 7 }], ['burst', { at: 1600, glyph: 'nut', n: 12, spin: 400, reach: 1.3 }]],
      koMs: 2400, koPeak: 1550,
      sharpen: [['blade', { angle: 0, n: 1, color: '#ffd27a', ms: 380 }], ['sparks', { n: 22, color: '#ffe0a0', reach: 1.3 }]],
      heavy: [['quake', { n: 3, rubble: 10 }], ['crack', { n: 8 }], ['sparks', { n: 18, color: '#ffd27a', reach: 1.4 }], ['dust', { n: 14 }]],
      block: [['sigil', { sides: 6, turn: 0 }], ['burst', { n: 6, glyph: 'nut', size: 0.6, spin: 400 }]],
      shield: [['bubble', {}], ['deflect', { n: 3, glyph: 'fist' }]],
      wind: [['heart', {}], ['dust', { n: 10, color: '#ffd27a' }], ['gust', { n: 3, color: '#ff7a1c', turn: 70 }]],
      body: { hit: 'clank', crit: 'buckle', sharpen: 'nick', strike: 'slam', heavy: 'crush', block: 'jar', shield: 'skid', wind: 'shrink', ko: 'topple' },
  },
  assault: { travel: 'lunge', impact: 'crush' }, // the fist comes at the camera and slams down
  body: {},
}
