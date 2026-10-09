// CERBERUS: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./cerberus.parts.jsx.
export default {
  style: {
      color: '#3fffd5', accent: '#06302a', glyph: 'chain',
      hit: [['burst', { n: 5, spin: 200, size: 0.8 }], ['sparks', { n: 8, color: '#ff8a3a' }]],
      crit: [['lash', { small: true }], ['burst', { n: 9, spin: 260 }], ['starburst', { points: 3, inner: 0.3, spin: -120 }]],
      strike: [['lash', {}], ['bite', { n: 3, dir: 'v', small: true }]],
      ko: [['speedlines', { color: '#ff8a3a', n: 34, rot: 12 }], ['flash', { big: true }], ['chainsnap', { at: 200 }], ['sparks', { at: 780, n: 14, color: '#3fffd5' }],
        ['gutter', { at: 900, color: '#3fffd5' }], ['ring', { at: 1300, scale: 2.5, color: '#3fffd5' }], ['burst', { at: 1300, glyph: 'chain', n: 14, spin: 600, reach: 1.4 }], ['dust', { at: 1350, n: 12 }]],
      koMs: 2200, koPeak: 1300,
      sharpen: [['blade', { angle: -15, n: 3, color: '#ff8a3a', fan: 20 }], ['sparks', { n: 8, color: '#3fffd5' }]],
      heavy: [['rise', { n: 14, glyph: 'flame', size: 0.6, color: '#ff8a3a' }], ['claws', { n: 3, angle: 20, color: '#3fffd5' }], ['quake', { n: 2, color: '#ff8a3a' }]],
      block: [['sigil', { sides: 3, turn: 60 }], ['burst', { n: 6, glyph: 'chain', size: 0.6, spin: 300 }]],
      shield: [['bubble', {}], ['deflect', { n: 3, glyph: 'chain', from: 'side' }], ['sparks', { n: 6, color: '#ff8a3a' }]],
      wind: [['heart', {}], ['rise', { n: 6, glyph: 'flame', size: 0.5, color: '#3fffd5' }], ['gust', { n: 3, color: '#3fffd5', turn: -75 }]],
      body: { hit: 'reel', crit: 'knock', sharpen: 'gash', strike: 'rear', heavy: 'pounce', block: 'stumble', shield: 'ricochet', wind: 'falter', ko: 'unchained' },
  },
  assault: { travel: 'chain', impact: 'bite' }, // the chain lashes out, three jaws bite down
  body: {},
}
