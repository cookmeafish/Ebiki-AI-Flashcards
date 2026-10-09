// SWARMQUEEN: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./swarmqueen.parts.jsx.
export default {
  style: {
      color: '#ffb21a', accent: '#5a2d00', glyph: 'hex',
      hit: [['swarmqueenSplinter', {}], ['volley', { n: 5, small: true }]],
      crit: [['volley', { n: 10, small: true }], ['burst', { n: 10 }], ['starburst', { points: 6, inner: 0.7, spin: 30 }]],
      strike: [['swarmqueenCharge', {}], ['sparks', { n: 8, color: '#ffb21a' }]],
      ko: [['speedlines', { color: '#ffe08a', n: 32, rot: 17 }], ['flash', { big: true }], ['volley', { at: 150, n: 12, scatter: true }], ['swarm', { at: 450 }],
        ['burst', { at: 1250, n: 18, reach: 1.4, spin: 200 }], ['ring', { at: 1250, scale: 2.4, color: '#ffb21a' }], ['dust', { at: 1300, n: 12, color: '#ffd27a' }]],
      koMs: 2200, koPeak: 1250,
      sharpen: [['blade', { angle: -25, n: 3, color: '#ffe08a', fan: 8, gap: 50 }], ['volley', { n: 6, small: true }]],
      heavy: [['swarmqueenLegion', {}], ['swarmqueenStab', {}], ['quake', { n: 1, color: '#ffb21a' }]],
      block: [['swarmqueenRebound', {}], ['sigil', { sides: 6, rot: 0, turn: 120 }], ['burst', { n: 6, glyph: 'hex', size: 0.5, spin: 90 }]],
      shield: [['bubble', {}], ['swarmqueenRebound', { dome: true, n: 9 }], ['deflect', { n: 8, glyph: 'hex' }]],
      wind: [['heart', {}], ['glint', { n: 6, color: '#ffe08a' }]],
      body: { hit: 'flinch', crit: 'jolt', sharpen: 'nick', strike: 'dart', heavy: 'pounce', block: 'reel', shield: 'ricochet', wind: 'shrink', ko: 'scattered' },
  },
  assault: { travel: 'swarm', impact: 'poison' }, // the swarm stings, venom drips down the screen
  body: {},
}
