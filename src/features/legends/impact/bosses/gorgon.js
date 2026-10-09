// GORGON: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./gorgon.parts.jsx.
export default {
  style: {
      color: '#3fe08a', accent: '#0d3a1f', glyph: 'scale',
      hit: [['burst', { n: 6, spin: 90 }], ['ring', { color: '#9fffc8' }]],
      crit: [['burst', { n: 10, spin: 120, size: 1.2 }], ['beam', { dir: 'cone', width: 0.5, small: true }], ['starburst', { points: 10, inner: 0.5, spin: 70 }]],
      strike: [['gorgonGlare', {}], ['crack', { n: 5, color: '#c9d1cc' }]],
      ko: [['speedlines', { color: '#9fffc8', n: 38, rot: 3 }], ['flash', { big: true }], ['front', { at: 200, ms: 1100 }], ['crack', { at: 1350, n: 10, color: '#c9d1cc' }],
        ['dust', { at: 1450, n: 16, color: '#a7b0aa' }], ['drops', { at: 1450, n: 16, glyph: 'rubble', size: 0.6, color: '#8b938e' }], ['burst', { at: 1500, n: 10, spin: 120 }], ['ring', { at: 1450, color: '#c9d1cc', scale: 2.4, width: 5 }]],
      koMs: 2300, koPeak: 1450,
      sharpen: [['blade', { angle: -45, n: 3, color: '#9fffc8', fan: 30 }], ['shards', { n: 6, color: '#9fffc8' }]],
      heavy: [['gorgonFangs', { n: 5 }], ['quake', { n: 2, color: '#c9d1cc', rubble: 8 }], ['dust', { n: 12, color: '#a7b0aa' }]],
      block: [['sigil', { sides: 3, turn: 120 }], ['shards', { n: 8, color: '#c9d1cc', inward: true }]],
      shield: [['bubble', {}], ['deflect', { n: 4, glyph: 'scale' }], ['crack', { n: 3, color: '#c9d1cc' }]],
      wind: [['heart', {}], ['gust', { n: 2, color: '#3fe08a', turn: 80 }]],
      body: { hit: 'flinch', crit: 'stun', sharpen: 'split', strike: 'rear', heavy: 'loom', block: 'reel', shield: 'rebuff', wind: 'sway', ko: 'stoneSet' },
  },
  assault: { travel: 'beam', impact: 'frost', tint: '#b9c4bd' }, // her gaze turns the screen to stone from the corners
  body: {},
}
