// SUGARQUEEN: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./sugarqueen.parts.jsx.
export default {
  style: {
      color: '#ff5fa2', accent: '#ffffff', glyph: 'candy',
      hit: [['burst', { n: 6, spin: 360, size: 0.8 }], ['confetti', { n: 8, sprinkles: true }]],
      crit: [['splat', { n: 6, color: '#ff9cc7' }], ['burst', { n: 10, spin: 540 }], ['starburst', { points: 10, inner: 0.75, spin: 120 }]],
      strike: [['sugarqueenBonbons', { n: 6 }], ['splat', { n: 10, color: '#ff2f87', big: true }], ['drops', { n: 8, glyph: 'candy', size: 0.5 }]],
      ko: [['speedlines', { color: '#ffffff', n: 24, rot: 22 }], ['flash', { big: true }], ['drip', { at: 150, n: 9, color: '#ff9cc7' }], ['puddle', { at: 600 }],
        ['confetti', { at: 1350, n: 34, sprinkles: true }], ['splat', { at: 1350, n: 10, color: '#ff9cc7', big: true }], ['ring', { at: 1400, scale: 2.4, color: '#ff9cc7' }], ['burst', { at: 1450, n: 12, spin: 720, reach: 1.3 }]],
      koMs: 2300, koPeak: 1350,
      sharpen: [['blade', { angle: 20, n: 3, color: '#ffffff', fan: 22 }], ['confetti', { n: 10, sprinkles: true }]],
      heavy: [['volley', { n: 12 }], ['fountain', { n: 16, glyph: 'candy', size: 0.5 }], ['quake', { n: 2, color: '#ff9cc7' }]],
      block: [['sigil', { sides: 8, rot: 0, turn: 45 }], ['burst', { n: 8, glyph: 'candy', size: 0.5, spin: 500 }]],
      shield: [['bubble', {}], ['deflect', { n: 6, glyph: 'candy', from: 'side' }]],
      wind: [['heart', {}], ['pulse', { color: '#ff9cc7' }], ['glint', { n: 6, color: '#ffffff', size: 0.7 }]],
      body: { hit: 'wobble', crit: 'buckle', sharpen: 'carve', strike: 'surge', heavy: 'crush', block: 'jar', shield: 'rebuff', wind: 'shrink', ko: 'melted' },
  },
  assault: { travel: 'thrown', impact: 'flood' }, // a candy hurled at you, syrup floods the screen
  body: {},
}
