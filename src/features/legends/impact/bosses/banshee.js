// BANSHEE: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./banshee.parts.jsx.
export default {
  style: {
      color: '#7ff0ff', accent: '#0b3a46', glyph: 'note',
      hit: [['burst', { n: 6, spin: 60 }], ['ring', { dashed: true }]],
      crit: [['burst', { n: 10, spin: 90, size: 1.3 }], ['scream', { n: 2 }], ['starburst', { points: 5, inner: 0.35, spin: 15 }]],
      strike: [['scream', { n: 4 }], ['vignette', { color: '#46d6ff' }]],
      ko: [['speedlines', { color: '#c8fbff', n: 48, rot: 4 }], ['flash', { big: true }], ['scream', { at: 100, n: 4 }], ['flatline', { at: 350 }],
        ['ring', { at: 1100, dashed: true, scale: 2.6, width: 4 }], ['smoke', { at: 1100, color: '#bff6ff', n: 8 }], ['rise', { at: 1150, n: 12, glyph: 'note' }]],
      koMs: 2000, koPeak: 1100,
      sharpen: [['blade', { angle: 10, n: 3, color: '#c8fbff', fan: 14 }], ['ring', { color: '#c8fbff', dashed: true, scale: 1.4 }]],
      heavy: [['pull', { n: 14, glyph: 'note' }], ['quake', { n: 1, color: '#7ff0ff' }], ['vignette', { color: '#0b8fb0' }]],
      block: [['sigil', { sides: 5, turn: -40 }], ['rise', { n: 8, glyph: 'note', size: 0.6 }]],
      shield: [['bubble', {}], ['deflect', { n: 4, from: 'side' }], ['scream', { n: 1, inward: true }]],
      wind: [['heart', {}], ['pulse', { color: '#7ff0ff' }], ['gust', { n: 2, color: '#c8fbff', turn: -45 }]],
      body: { hit: 'flicker', crit: 'jolt', sharpen: 'sever', strike: 'scream', heavy: 'charge', block: 'reel', shield: 'glance', wind: 'sway', ko: 'silence' },
  },
  assault: { travel: 'wave', impact: 'crack' }, // her scream rolls out in rings and shatters the glass
  body: {},
}
