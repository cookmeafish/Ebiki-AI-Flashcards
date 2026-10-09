// VOID: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./void.parts.jsx.
export default {
  style: {
      color: '#b067ff', accent: '#ffffff', glyph: 'star4',
      hit: [['burst', { n: 6, spin: 180, size: 0.8 }], ['ring', { color: '#e3c9ff', dashed: true }]],
      crit: [['pull', { n: 10, small: true }], ['burst', { n: 10, spin: 240 }], ['starburst', { points: 4, inner: 0.45, spin: 360 }]],
      strike: [['voidMaw', {}], ['pull', { n: 16 }], ['tendrils', { n: 3, color: '#6a2bd6' }]],
      ko: [['speedlines', { color: '#e3c9ff', n: 44, rot: 25 }], ['flash', { big: true }], ['pull', { at: 100, n: 28 }], ['singularity', { at: 300, color: '#ffc46a' }],
        ['ring', { at: 1350, scale: 2.8, width: 8, color: '#ffffff' }], ['burst', { at: 1350, n: 18, reach: 1.5, spin: 360 }], ['shards', { at: 1400, n: 14, color: '#b067ff' }]],
      koMs: 2300, koPeak: 1350,
      sharpen: [['blade', { angle: 40, n: 3, color: '#e3c9ff', fan: 120 }], ['pull', { n: 8, small: true }]],
      heavy: [['voidRend', {}], ['shards', { n: 14, color: '#b067ff', inward: true }], ['quake', { n: 3, color: '#b067ff' }]],
      block: [['sigil', { sides: 8, rot: 0, turn: 270 }], ['shards', { n: 10, color: '#e3c9ff', inward: true }]],
      shield: [['bubble', {}], ['deflect', { n: 7, glyph: 'star4', from: 'side' }]],
      wind: [['heart', {}], ['gust', { n: 4, color: '#e3c9ff', turn: 200 }]],
      body: { hit: 'flicker', crit: 'jolt', sharpen: 'split', strike: 'surge', heavy: 'quake', block: 'reel', shield: 'ricochet', wind: 'shrink', ko: 'eventHorizon' },
  },
  assault: { travel: 'orb', impact: 'drain' }, // a black hole that swallows your heart's light
  body: {},
}
