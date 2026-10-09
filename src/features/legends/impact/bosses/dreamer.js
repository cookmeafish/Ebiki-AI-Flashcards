// DREAMER: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./dreamer.parts.jsx.
export default {
  style: {
      color: '#ff5cf0', accent: '#ffffff', glyph: 'bubble',
      hit: [['burst', { n: 6, size: 0.8 }], ['ring', { color: '#ffb3f7' }]],
      crit: [['tendrils', { n: 2 }], ['burst', { n: 10 }], ['starburst', { points: 7, inner: 0.65, spin: 200 }]],
      strike: [['tendrils', { n: 4 }], ['vignette', { color: '#c23cff' }]],
      ko: [['speedlines', { color: '#ffb3f7', n: 28, rot: 14 }], ['flash', { big: true }], ['bubbles', { at: 150 }], ['burst', { at: 1150, n: 20, reach: 1.4, size: 0.9 }],
        ['ring', { at: 1150, scale: 2.4, dashed: true, color: '#ff5cf0' }], ['glint', { at: 1200, n: 8, color: '#ffffff' }], ['rise', { at: 1250, n: 12, glyph: 'bubble', size: 0.6 }]],
      koMs: 2100, koPeak: 1150,
      sharpen: [['blade', { angle: 30, n: 3, color: '#ffb3f7', fan: 50 }], ['glint', { n: 6, color: '#ffffff' }]],
      heavy: [['pull', { n: 16, glyph: 'bubble' }], ['scream', { n: 3, color: '#ff5cf0', inward: true }], ['quake', { n: 2, color: '#c23cff' }]],
      block: [['sigil', { sides: 8, rot: 22, turn: -80 }], ['burst', { n: 8, glyph: 'bubble', size: 0.6 }]],
      shield: [['bubble', {}], ['deflect', { n: 6, glyph: 'bubble', from: 'side' }]],
      wind: [['heart', {}], ['pulse', { color: '#ff5cf0' }], ['rise', { n: 5, glyph: 'bubble', size: 0.4 }]],
      body: { hit: 'wobble', crit: 'twirl', sharpen: 'split', strike: 'surge', heavy: 'loom', block: 'rebound', shield: 'rebuff', wind: 'sway', ko: 'popped' },
  },
  assault: { travel: 'shadow', impact: 'frost', tint: '#7b5cff' }, // nightmare dark creeps in from the corners
  body: {},
}
