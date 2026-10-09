// LEVIATHAN: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./leviathan.parts.jsx.
export default {
  style: {
      color: '#38b6ff', accent: '#e8f8ff', glyph: 'drop',
      hit: [['burst', { n: 7, size: 0.7 }], ['splat', { n: 5, color: '#9fdcff' }]],
      crit: [['wave', { small: true }], ['burst', { n: 10, size: 0.9 }], ['starburst', { points: 9, inner: 0.6, spin: -40 }]],
      strike: [['leviathanTide', {}], ['drops', { n: 12, glyph: 'drop', size: 0.45 }]],
      ko: [['speedlines', { color: '#e8f8ff', n: 36, rot: 10 }], ['flash', { big: true }], ['splat', { at: 150, n: 10, color: '#9fdcff' }], ['flood', { at: 300 }],
        ['whirl', { at: 700, n: 4 }], ['ring', { at: 1400, scale: 2.6, color: '#38b6ff', width: 5 }], ['burst', { at: 1400, n: 16, size: 0.8, reach: 1.3 }]],
      koMs: 2300, koPeak: 1400,
      sharpen: [['blade', { angle: 5, n: 2, color: '#e8f8ff', fan: 10 }], ['splat', { n: 4, color: '#9fdcff' }]],
      heavy: [['pillar', { width: 0.6, color: '#38b6ff' }], ['drops', { n: 16, glyph: 'drop', size: 0.5 }], ['quake', { n: 2, color: '#38b6ff' }]],
      block: [['sigil', { sides: 9, turn: 40 }], ['splat', { n: 6, color: '#e8f8ff' }]],
      shield: [['bubble', {}], ['deflect', { n: 6, glyph: 'drop' }]],
      wind: [['heart', {}], ['gust', { n: 3, color: '#9fdcff', turn: -60 }]],
      body: { hit: 'wobble', crit: 'knock', sharpen: 'gash', strike: 'surge', heavy: 'charge', block: 'reel', shield: 'skid', wind: 'sway', ko: 'founder' },
  },
  assault: { travel: 'wave', impact: 'flood' }, // a tide rolls out and the screen floods
  body: {},
}
