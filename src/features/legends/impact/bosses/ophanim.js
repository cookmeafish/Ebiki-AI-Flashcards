// OPHANIM: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./ophanim.parts.jsx.
export default {
  style: {
      color: '#ffcf4a', accent: '#5a3a00', glyph: 'eye',
      hit: [['burst', { n: 5, size: 0.8 }], ['halo', { n: 1, small: true }]],
      crit: [['halo', { n: 2 }], ['burst', { n: 9 }], ['starburst', { points: 16, inner: 0.55, spin: 45 }]],
      strike: [['ophanimGlare', {}], ['halo', { n: 3, slice: true }], ['beam', { dir: 'down', width: 0.3, color: '#ff9d00' }]],
      ko: [['speedlines', { color: '#fff6c8', n: 60, rot: 24 }], ['flash', { big: true }], ['halo', { at: 150, n: 3, collapse: true }], ['eyeclose', { at: 300 }],
        ['pull', { at: 1000, n: 18 }], ['shards', { at: 1500, n: 16, color: '#ffcf4a' }], ['ring', { at: 1500, color: '#ffcf4a', scale: 2.8, width: 6 }], ['rays', { at: 1550, n: 24, color: '#fff6c8' }]],
      koMs: 2400, koPeak: 1500,
      sharpen: [['blade', { angle: -90, n: 2, color: '#fff6c8', fan: 90 }], ['halo', { n: 1, small: true }]],
      heavy: [['ophanimWheels', {}], ['rays', { n: 24, color: '#ffcf4a' }], ['shards', { n: 14, color: '#ffcf4a' }], ['quake', { n: 2 }]],
      block: [['sigil', { sides: 16, turn: 45 }], ['rays', { n: 12, color: '#ffcf4a' }]],
      shield: [['bubble', {}], ['deflect', { n: 5, glyph: 'eye' }]],
      wind: [['heart', {}], ['gust', { n: 3, color: '#fff6c8', turn: -150 }], ['glint', { n: 5 }]],
      body: { hit: 'clank', crit: 'stun', sharpen: 'nick', strike: 'cast', heavy: 'loom', block: 'recoil', shield: 'rebuff', wind: 'dim', ko: 'eyeShut' },
  },
  assault: { travel: 'arc', impact: 'blast' }, // the wheels sweep across, a burst of blinding light
  body: {},
}
