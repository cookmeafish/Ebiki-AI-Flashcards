// TEMPEST: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./tempest.parts.jsx.
export default {
  style: {
      color: '#9fd8ff', accent: '#ffffff', glyph: 'bolt',
      hit: [['burst', { n: 5, spin: 30 }], ['sparks', { n: 10, color: '#e6f6ff' }]],
      crit: [['bolt', { n: 1 }], ['burst', { n: 9 }], ['starburst', { points: 4, inner: 0.15, spin: 20 }]],
      strike: [['bolt', { n: 3 }], ['vignette', { color: '#7cc8ff' }]],
      ko: [['speedlines', { color: '#e6f6ff', n: 50, rot: 13 }], ['flash', { big: true }], ['bolt', { at: 100, n: 5 }], ['bolt', { at: 700, n: 2 }],
        ['smoke', { at: 850, dir: 'out', color: '#b4c2d2', n: 12, size: 0.75 }], ['sparks', { at: 1150, n: 18, color: '#e6f6ff', reach: 1.4 }], ['ring', { at: 1150, scale: 2.8, width: 6 }], ['drops', { at: 1250, n: 18, glyph: 'drop', size: 0.35, color: '#9fd8ff' }]],
      koMs: 2100, koPeak: 1150,
      sharpen: [['blade', { angle: -80, n: 2, color: '#ffffff', ms: 340 }], ['bolt', { n: 1 }]],
      heavy: [['beam', { dir: 'down', width: 0.4, color: '#e6f6ff' }], ['sparks', { n: 20, color: '#e6f6ff', reach: 1.3 }], ['quake', { n: 2, color: '#9fd8ff' }], ['vignette', { color: '#3d7cff' }]],
      block: [['sigil', { sides: 6, rot: 30, turn: 90 }], ['sparks', { n: 14, color: '#e6f6ff', reach: 1.3 }]],
      shield: [['bubble', {}], ['deflect', { n: 5, glyph: 'bolt' }]],
      wind: [['heart', {}], ['gust', { n: 4, color: '#e6f6ff', turn: 120 }]],
      body: { hit: 'flinch', crit: 'jolt', sharpen: 'sever', strike: 'cast', heavy: 'quake', block: 'recoil', shield: 'glance', wind: 'sway', ko: 'burnout' },
  },
  assault: { travel: 'bolt', impact: 'shock' }, // lightning to your heart, arcs crawl around the screen
  body: {},
}
