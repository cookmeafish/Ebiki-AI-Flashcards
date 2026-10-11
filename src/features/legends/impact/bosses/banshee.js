// BANSHEE: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./banshee.parts.jsx.
export default {
  style: {
      color: '#7ff0ff', accent: '#0b3a46', glyph: 'note',
      hit: [['bansheeNotes', { n: 6, spin: 60 }]],
      crit: [['bansheeNotes', { n: 12, spin: 90, size: 1.4 }], ['bansheeScream', { n: 3 }]],
      strike: [['bansheeScream', { n: 4 }], ['vignette', { color: '#46d6ff' }]],
      ko: [['speedlines', { color: '#c8fbff', n: 48, rot: 4 }], ['flash', { big: true, y: 80, size: 26 }], ['bansheeScream', { at: 100, n: 4, inward: true }], ['bansheeLastNote', { at: 350 }], ['bansheeMotes', { at: 500, n: 16 }],
        ['ring', { at: 1100, scale: 2.4, width: 3 }], ['bansheeNoteRise', { at: 1150, n: 12 }]],
      koMs: 2000, koPeak: 1100,
      sharpen: [['blade', { angle: 10, n: 3, color: '#c8fbff', fan: 14 }], ['bansheeScream', { color: '#c8fbff', n: 2 }]],
      heavy: [['bansheeNotes', { n: 14, mode: 'in' }], ['quake', { n: 1, color: '#7ff0ff' }], ['vignette', { color: '#0b8fb0' }]],
      block: [['deflect', { n: 6, from: 'side' }], ['bansheeNoteRise', { n: 10, size: 0.7 }]],
      shield: [['bubble', {}], ['deflect', { n: 4, from: 'side' }], ['bansheeScream', { n: 1, inward: true }]],
      wind: [['heart', {}], ['pulse', { color: '#7ff0ff' }], ['gust', { n: 2, color: '#c8fbff', turn: -45 }]],
      flash: { y: 80, size: 26 }, // the shared hit flash lands on her chest, never over her face
      body: { hit: 'flicker', crit: 'jolt', sharpen: 'sever', strike: 'scream', heavy: 'charge', block: 'reel', shield: 'glance', wind: 'sway', ko: 'silence' },
  },
  assault: { travel: 'wave', impact: 'crack' }, // her scream rolls out in rings and shatters the glass
  body: {},
}
