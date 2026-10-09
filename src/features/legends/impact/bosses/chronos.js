// CHRONOS: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./chronos.parts.jsx.
export default {
  style: {
      color: '#f2c14e', accent: '#7a4a12', glyph: 'gear',
      hit: [['burst', { n: 6, spin: 240 }], ['sparks', { n: 6 }], ['ring', {}]],
      crit: [['burst', { n: 10, spin: 360, size: 1.3 }], ['hands', { ms: 700 }], ['starburst', { points: 12, inner: 0.7, spin: 30 }]],
      strike: [['hands', { ms: 620 }], ['burst', { n: 14, glyph: 'grain', size: 0.4, reach: 1.1 }], ['vignette', {}]],
      ko: [['speedlines', { color: '#fff2b0', n: 36 }], ['flash', { big: true }], ['dial', { at: 150 }], ['hands', { at: 250, ms: 1000 }], ['crack', { at: 900, n: 8 }],
        ['shards', { at: 1300, n: 18, color: '#dff6ff', reach: 1.3 }], ['ring', { at: 1300, scale: 2.4, width: 6 }], ['burst', { at: 1350, n: 10, spin: 540, size: 1.1 }], ['drops', { at: 1450, n: 16, glyph: 'grain', size: 0.45 }]],
      koMs: 2200, koPeak: 1300,
      sharpen: [['blade', { angle: -20, n: 2, color: '#ffe9a0' }], ['glint', { n: 6, color: '#fff2b0' }], ['burst', { n: 5, glyph: 'grain', size: 0.5, spin: 180 }]],
      heavy: [['quake', { n: 3 }], ['pillar', { width: 0.25 }], ['drops', { n: 18, glyph: 'grain', size: 0.45 }], ['crack', { n: 5 }]],
      block: [['sigil', { sides: 12, turn: 60 }], ['sparks', { n: 12, color: '#fff2b0' }]],
      shield: [['bubble', {}], ['deflect', { n: 5 }]],
      wind: [['heart', {}], ['gust', { n: 3, color: '#ffd27a', turn: -90 }]],
      body: { hit: 'clank', crit: 'stun', sharpen: 'nick', strike: 'rear', heavy: 'loom', block: 'jar', shield: 'rebuff', wind: 'dim', ko: 'timeStop' },
  },
  assault: { travel: 'swarm', impact: 'drain', glyph: 'gear' }, // a storm of gears, then time drains your heart away
  body: {},
}
