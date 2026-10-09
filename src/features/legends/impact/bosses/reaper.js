// REAPER: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./reaper.parts.jsx.
export default {
  style: {
      color: '#6fe3ff', accent: '#06222c', glyph: 'wisp',
      hit: [['burst', { n: 5, spin: 20 }], ['ring', { color: '#bff4ff' }]],
      crit: [['arc', { small: true }], ['burst', { n: 9, spin: 40 }], ['starburst', { points: 4, inner: 0.2, spin: 45 }]],
      strike: [['reaperBlade', {}], ['vignette', { color: '#3fb8d6' }]],
      ko: [['speedlines', { color: '#bff4ff', n: 42, rot: 8 }], ['flash', { big: true }], ['scythe', { at: 150 }], ['rise', { at: 1150, n: 16, glyph: 'wisp', size: 0.9 }],
        ['smoke', { at: 1200, color: '#6fe3ff', n: 8 }], ['ring', { at: 1250, color: '#bff4ff', dashed: true, scale: 2.2, width: 4 }], ['shards', { at: 1300, n: 10, color: '#e8fbff' }]],
      koMs: 2200, koPeak: 1250,
      sharpen: [['blade', { angle: -70, n: 1, color: '#e8fbff', ms: 520 }], ['arc', { small: true, reverse: true }]],
      heavy: [['cleave', {}], ['rise', { n: 10, glyph: 'wisp', size: 0.7 }], ['quake', { n: 2, color: '#3fb8d6' }]],
      block: [['sigil', { sides: 7, turn: -51 }], ['sparks', { n: 8, color: '#bff4ff' }]],
      shield: [['bubble', {}], ['deflect', { n: 4, glyph: 'wisp', from: 'side' }]],
      wind: [['heart', {}], ['pulse', { color: '#6fe3ff' }]],
      body: { hit: 'reel', crit: 'whiplash', sharpen: 'sever', strike: 'swipe', heavy: 'overreach', block: 'recoil', shield: 'glance', wind: 'dim', ko: 'reaped' },
  },
  assault: { travel: 'arc', impact: 'cut' }, // the scythe swings across the card and leaves a gash
  body: {},
}
