// KITSUNE: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./kitsune.parts.jsx.
export default {
  style: {
      color: '#ff5a7a', accent: '#ffd6e0', glyph: 'petal',
      hit: [['burst', { n: 7, spin: 200, size: 0.7 }], ['sparks', { n: 6, color: '#ffd6e0' }]],
      crit: [['orbit', { n: 3, color: '#7fe8ff' }], ['burst', { n: 12, spin: 300, size: 0.8 }], ['starburst', { points: 9, inner: 0.55, spin: 160 }]],
      strike: [['kitsuneWisps', {}], ['orbit', { n: 5, color: '#7fe8ff' }], ['vignette', { color: '#ff5a7a' }]],
      // her knockout (no spin): frozen on the blow; fox-fire flames rise all round her silhouette and gutter out; at
      // the climax the nine tails burst into flame, her fox spirit tears away upward, a shockwave and a storm of petals
      ko: [['speedlines', { color: '#7fe8ff', n: 42, rot: 23 }], ['flash', { big: true }], ['kitsuneFlare', { at: 250 }],
        ['tails', { at: 1300, ms: 1100 }], ['kitsuneSpirit', { at: 1400 }], ['ring', { at: 1400, color: '#ff5a7a', scale: 2.6 }], ['ring', { at: 1480, color: '#7fe8ff', scale: 2, dashed: true, width: 2 }],
        ['burst', { at: 1400, n: 18, spin: 400, reach: 1.5, size: 0.7 }], ['drops', { at: 1500, n: 28, glyph: 'petal', size: 0.6 }]],
      koMs: 2500, koPeak: 1400,
      sharpen: [['blade', { angle: -30, n: 2, color: '#7fe8ff', fan: 36 }], ['drops', { n: 8, glyph: 'petal', size: 0.45 }]],
      heavy: [['kitsuneSweep', {}], ['rise', { n: 12, glyph: 'flame', color: '#7fe8ff', size: 0.6 }], ['quake', { n: 2, color: '#ff5a7a' }]],
      block: [['sigil', { sides: 9, rot: 20, turn: 80 }], ['drops', { n: 6, glyph: 'petal', size: 0.5 }]],
      shield: [['bubble', {}], ['deflect', { n: 6, glyph: 'petal' }]],
      wind: [['heart', {}], ['drops', { n: 10, glyph: 'petal', size: 0.4, color: '#ffd6e0' }], ['gust', { n: 3, color: '#7fe8ff', turn: -170 }]],
      body: { hit: 'flinch', crit: 'twirl', sharpen: 'gash', strike: 'cast', heavy: 'charge', block: 'rebound', shield: 'glance', wind: 'sway', ko: 'foxfire' },
  },
  assault: { travel: 'orb', impact: 'burn' }, // foxfire and spirit flames rising
  body: {},
}
