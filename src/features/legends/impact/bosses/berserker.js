// BERSERKER: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./berserker.parts.jsx.
export default {
  style: {
      color: '#ff4a1a', accent: '#2a0a00', glyph: 'axe',
      hit: [['sparks', { n: 10, color: '#ffb36a' }], ['burst', { n: 4, size: 0.8, spin: 300 }]],
      crit: [['cleave', { small: true }], ['sparks', { n: 16, color: '#ffb36a' }], ['starburst', { points: 9, inner: 0.3, spin: -25 }]],
      strike: [['cleave', {}], ['rise', { n: 8, glyph: 'ember', size: 0.35 }], ['vignette', {}]],
      ko: [['speedlines', { color: '#ffb36a', n: 46, rot: 15 }], ['flash', { big: true }], ['rise', { at: 100, n: 18, glyph: 'ember', size: 0.45 }], ['axefall', { at: 650 }],
        ['crack', { at: 1300, n: 7, color: '#ffb36a' }], ['dust', { at: 1300, n: 16 }], ['ring', { at: 1350, scale: 2.6, color: '#ff4a1a', width: 7 }], ['drops', { at: 1400, n: 14, glyph: 'ember', size: 0.4, color: '#7a2a10' }]],
      koMs: 2200, koPeak: 1350,
      sharpen: [['blade', { angle: -40, n: 2, color: '#ffb36a', fan: 80 }], ['sparks', { n: 14, color: '#ffe0a0' }]],
      heavy: [['claws', { n: 4, angle: 30, color: '#ff4a1a' }], ['quake', { n: 3, rubble: 8 }], ['rise', { n: 12, glyph: 'ember', size: 0.4 }]],
      block: [['sigil', { sides: 4, turn: 45 }], ['sparks', { n: 16, color: '#ffb36a' }]],
      shield: [['bubble', {}], ['deflect', { n: 4, glyph: 'axe' }]],
      wind: [['heart', {}], ['dust', { n: 8, color: '#ff8a5a' }], ['gust', { n: 2, color: '#ff4a1a', turn: 160 }]],
      body: { hit: 'reel', crit: 'buckle', sharpen: 'carve', strike: 'slam', heavy: 'overreach', block: 'stumble', shield: 'ricochet', wind: 'falter', ko: 'lastStand' },
  },
  assault: { travel: 'thrown', impact: 'crush' }, // a spinning axe hurled at you, the ground caves in
  body: {},
}
