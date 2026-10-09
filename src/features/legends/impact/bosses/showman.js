// SHOWMAN: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./showman.parts.jsx.
export default {
  style: {
      color: '#ff4fb0', accent: '#ffffff', glyph: 'card',
      hit: [['burst', { n: 5, spin: 540, size: 0.8 }], ['confetti', { n: 10 }]],
      crit: [['burst', { n: 9, spin: 720 }], ['confetti', { n: 22 }], ['starburst', { points: 5, inner: 0.5, spin: 216 }]],
      strike: [['showmanBoomerang', {}], ['cards', { n: 7 }], ['vignette', { color: '#ff4fb0' }]],
      ko: [['speedlines', { color: '#ffd6ee', n: 26, rot: 9 }], ['flash', { big: true }], ['spotlight', { at: 150, color: '#fff4c0' }], ['curtain', { at: 650, part: 36 }],
        ['confetti', { at: 1500, n: 44, reach: 1.5 }], ['burst', { at: 1500, n: 12, spin: 900, reach: 1.3 }], ['ring', { at: 1550, color: '#ff4fb0', scale: 2.4, dashed: true }]],
      koMs: 2400, koPeak: 1500,
      sharpen: [['blade', { angle: -35, n: 4, color: '#ffd6ee', fan: 18, gap: 60 }], ['cards', { n: 4 }]],
      heavy: [['rays', { n: 12, color: '#ff4fb0' }], ['volley', { n: 14 }], ['quake', { n: 1, color: '#ff4fb0' }]],
      block: [['sigil', { sides: 4, turn: 180 }], ['confetti', { n: 14 }]],
      shield: [['bubble', {}], ['deflect', { n: 5, glyph: 'card', from: 'side' }]],
      wind: [['heart', {}], ['glint', { n: 8, color: '#ffd6ee' }], ['gust', { n: 2, color: '#ff4fb0', turn: 140 }]],
      body: { hit: 'spin', crit: 'twirl', sharpen: 'split', strike: 'cast', heavy: 'overreach', block: 'rebound', shield: 'glance', wind: 'sway', ko: 'curtainCall' },
  },
  assault: { travel: 'shards', impact: 'cut', glyph: 'card' }, // razor cards fly, one slices the screen in two
  body: {},
}
