// INFERNO: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./inferno.parts.jsx.
export default {
  style: {
      color: '#ff7a14', accent: '#ffe08a', glyph: 'flame',
      hit: [['infernoChips', {}], ['rise', { n: 6, glyph: 'ember', size: 0.35 }]],
      crit: [['shards', { n: 10, color: '#ffe08a' }], ['burst', { n: 10 }], ['starburst', { points: 11, inner: 0.45, spin: 80 }]],
      strike: [['infernoGout', {}], ['rise', { n: 10, glyph: 'ember', size: 0.4 }]],
      ko: [['speedlines', { color: '#ffe08a', n: 38, rot: 16 }], ['flash', { big: true }], ['pillar', { at: 100, width: 0.6, color: '#ff7a14' }], ['rise', { at: 300, n: 18, glyph: 'flame', size: 0.7 }],
        ['smoke', { at: 1000, color: '#6a5f66', n: 14, size: 0.9 }], ['embers', { at: 1050 }], ['burst', { at: 1350, glyph: 'ember', n: 14, size: 0.6, reach: 1.4 }], ['ring', { at: 1350, color: '#ffe08a', scale: 2.4 }], ['sparks', { at: 1400, n: 12, color: '#ffb000' }]],
      koMs: 2300, koPeak: 1350,
      sharpen: [['blade', { angle: 15, n: 2, color: '#ffe08a' }], ['rise', { n: 6, glyph: 'ember', size: 0.3 }]],
      heavy: [['infernoGeyser', {}], ['drops', { n: 12, glyph: 'flame', size: 0.55 }], ['quake', { n: 2, color: '#ffe08a' }]],
      block: [['infernoBackfire', {}], ['sigil', { sides: 6, turn: -30 }], ['burst', { n: 8, glyph: 'ember', size: 0.5 }]],
      shield: [['infernoGout', { angle: -6, reach: 0.55 }], ['bubble', {}], ['deflect', { n: 6, glyph: 'flame', from: 'side' }]],
      wind: [['heart', {}], ['gust', { n: 3, color: '#ffe08a', turn: -120 }]],
      body: { hit: 'flinch', crit: 'stun', sharpen: 'nick', strike: 'lunge', heavy: 'charge', block: 'jar', shield: 'skid', wind: 'dim', ko: 'gutterOut' },
  },
  assault: { travel: 'beam', impact: 'burn' }, // fire breath and a wall of flame from below
  body: {},
}
