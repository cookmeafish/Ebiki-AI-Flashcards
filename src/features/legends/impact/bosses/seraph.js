// SERAPH: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./seraph.parts.jsx.
export default {
  style: {
      color: '#ffe79a', accent: '#b8862b', glyph: 'feather',
      hit: [['burst', { n: 6, spin: 120 }], ['sparks', { n: 8, color: '#fffbe6' }]],
      crit: [['burst', { n: 10, spin: 180, size: 1.3 }], ['pillar', { width: 0.3, color: '#ffb300' }], ['starburst', { points: 8, inner: 0.25, spin: 45 }]],
      strike: [['beam', { dir: 'down', width: 0.5, color: '#ffb300' }], ['drops', { n: 8, glyph: 'feather', size: 0.6 }], ['ring', { color: '#ffb300', scale: 2, width: 4 }]],
      ko: [['speedlines', { color: '#fffbe6', n: 30, rot: 6 }], ['flash', { big: true }], ['pillar', { at: 150, width: 0.7, color: '#ffb300' }], ['wings', { at: 300 }],
        ['rise', { at: 1050, n: 16, glyph: 'ember', size: 0.4, color: '#ffb300' }], ['rays', { at: 1350, n: 18 }], ['ring', { at: 1350, color: '#ffe79a', scale: 2.6, width: 5 }], ['drops', { at: 1400, n: 14, glyph: 'feather', size: 0.6 }]],
      koMs: 2300, koPeak: 1350,
      sharpen: [['blade', { angle: -60, n: 2, color: '#fffbe6' }], ['rays', { n: 8, color: '#ffe79a' }]],
      heavy: [['drops', { n: 20, glyph: 'feather', size: 0.7 }], ['rays', { n: 10, color: '#ffb300' }], ['quake', { n: 2, color: '#ffe79a' }]],
      block: [['sigil', { sides: 8, turn: 22 }], ['glint', { n: 7, color: '#fffbe6' }]],
      shield: [['bubble', {}], ['deflect', { n: 6, glyph: 'feather' }], ['glint', { n: 4 }]],
      wind: [['heart', {}], ['pulse', { color: '#ffe79a' }], ['rise', { n: 5, glyph: 'feather', size: 0.5 }]],
      body: { hit: 'flinch', crit: 'whiplash', sharpen: 'carve', strike: 'cast', heavy: 'loom', block: 'recoil', shield: 'rebuff', wind: 'falter', ko: 'fallFromGrace' },
  },
  assault: { travel: 'beam', impact: 'blast' }, // a lance of judgment and a holy detonation
  body: {},
}
