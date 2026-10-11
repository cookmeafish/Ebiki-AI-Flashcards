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
      // her knockout (no spin): frozen on the blow (a small flash on her chest, never a white-out over her), fox-fire
      // flames rise all round her (lifted, trembling, her OWN nine tails bursting in the drawing); at the climax her fox
      // spirit tears away high above her ears, a shockwave from her chest, flames and petals thrown out, a storm of
      // petals. No overlay tail fan: the parts layer draws over her, and a fan there covered her chest (round 3 review).
      ko: [['speedlines', { color: '#7fe8ff', n: 42, rot: 23 }], ['flash', { y: 72, size: 34 }], ['kitsuneFlare', { at: 250 }],
        ['kitsuneSpirit', { at: 1380 }], ['ring', { at: 1400, color: '#ff5a7a', scale: 2.6, top: 74, width: 4 }], ['ring', { at: 1480, color: '#7fe8ff', scale: 2, dashed: true, width: 2, top: 74 }],
        ['kitsuneShock', { at: 1400 }], ['drops', { at: 1500, n: 28, glyph: 'petal', size: 0.6 }]],
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
