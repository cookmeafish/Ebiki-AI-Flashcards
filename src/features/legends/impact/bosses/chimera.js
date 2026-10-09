// CHIMERA: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./chimera.parts.jsx.
export default {
  style: {
      color: '#ff6a2a', accent: '#3b0f00', glyph: 'claw',
      hit: [['burst', { n: 5, spin: 40 }], ['sparks', { n: 8 }]],
      crit: [['claws', { n: 3, angle: -30, small: true }], ['burst', { n: 9, size: 1.2 }], ['starburst', { points: 3, inner: 0.4, spin: 120 }]],
      strike: [['bite', { n: 3, dir: 'v' }], ['vignette', {}]],
      ko: [['speedlines', { color: '#ffb36a', n: 34, rot: 5 }], ['flash', { big: true }], ['roar', { at: 280, color: '#ff6a2a', spikes: 11 }], ['roar', { at: 630, color: '#f2e6c8', spikes: 8, turn: -30 }],
        ['roar', { at: 980, color: '#5dff8a', spikes: 15, turn: 40 }], ['dust', { at: 1400, n: 16 }], ['ring', { at: 1400, scale: 2.6, color: '#ff6a2a', width: 6 }], ['burst', { at: 1450, n: 10, spin: 90 }]],
      koMs: 2300, koPeak: 1400,
      sharpen: [['blade', { angle: -10, n: 3, color: '#ffb36a', fan: 40 }], ['claws', { n: 2, angle: 30, small: true }]],
      heavy: [['chimeraTrio', {}], ['claws', { n: 5, angle: 15 }], ['quake', { n: 1 }]],
      block: [['sigil', { sides: 3, rot: 180, turn: -60 }], ['sparks', { n: 10, color: '#ffb36a' }]],
      shield: [['bubble', {}], ['deflect', { n: 6, glyph: 'claw' }]],
      wind: [['heart', {}], ['rise', { n: 8, glyph: 'ember', size: 0.35, color: '#ffb36a' }]],
      body: { hit: 'reel', crit: 'knock', sharpen: 'carve', strike: 'lunge', heavy: 'pounce', block: 'stumble', shield: 'glance', wind: 'falter', ko: 'threeRoars' },
  },
  assault: { travel: 'lunge', impact: 'claws' }, // a pounce and three claw rakes across the screen
  body: {},
}
