// HYDRA: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./hydra.parts.jsx.
export default {
  style: {
      color: '#5fd0ff', accent: '#062436', glyph: 'fang',
      hit: [['burst', { n: 5, spin: 120, size: 0.8 }], ['splat', { n: 4, color: '#bde9ff' }]],
      crit: [['bite', { n: 1, dir: 'h', small: true }], ['burst', { n: 9 }], ['starburst', { points: 5, inner: 0.6, spin: 144 }]],
      strike: [['hydraFangs', { n: 5 }], ['bite', { n: 2, dir: 'h' }], ['splat', { n: 8, color: '#bde9ff' }]],
      ko: [['speedlines', { color: '#bde9ff', n: 40, rot: 19 }], ['flash', { big: true }], ['heads', { at: 150 }], ['splat', { at: 950, n: 14, color: '#bde9ff', reach: 1.2 }],
        ['whirl', { at: 1500, n: 2 }], ['ring', { at: 1600, color: '#5fd0ff', scale: 2.6 }], ['burst', { at: 1650, n: 12, spin: 200, reach: 1.3 }]],
      koMs: 2500, koPeak: 1600,
      sharpen: [['blade', { angle: -5, n: 3, color: '#bde9ff', fan: 60 }], ['splat', { n: 3, color: '#bde9ff' }]],
      heavy: [['pillar', { width: 0.45, color: '#5fd0ff' }], ['splat', { n: 12, color: '#bde9ff', big: true }], ['quake', { n: 3, color: '#5fd0ff' }]],
      block: [['sigil', { sides: 5, rot: 0, turn: 144 }], ['burst', { n: 6, glyph: 'fang', size: 0.6, spin: 120 }]],
      shield: [['bubble', {}], ['deflect', { n: 3, glyph: 'fang', from: 'side' }]],
      wind: [['heart', {}], ['pulse', { color: '#5fd0ff' }], ['gust', { n: 2, color: '#bde9ff', turn: 60 }]],
      body: { hit: 'reel', crit: 'knock', sharpen: 'sever', strike: 'rear', heavy: 'pounce', block: 'stumble', shield: 'skid', wind: 'falter', ko: 'severed' },
  },
  assault: { travel: 'shards', impact: 'poison', glyph: 'fang' }, // a hail of fangs and spat venom
  body: {},
}
