// MOONMAW: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./moonmaw.parts.jsx.
export default {
  style: {
      color: '#c9b8ff', accent: '#20184a', glyph: 'crescent',
      hit: [['moonmawShed', {}], ['sparks', { n: 8, color: '#f2edff' }]],
      crit: [['talons', { small: true }], ['burst', { n: 9, spin: 200 }], ['starburst', { points: 12, inner: 0.35, spin: -60 }]],
      strike: [['talons', {}], ['burst', { n: 8, glyph: 'feather', size: 0.6, color: '#9a8ad6' }]],
      ko: [['speedlines', { color: '#f2edff', n: 36, rot: 18 }], ['flash', { big: true }], ['eclipse', { at: 200, cross: true, ms: 1350 }], ['diamondring', { at: 1250 }],
        ['rays', { at: 1500, n: 12, color: '#f2edff' }], ['ring', { at: 1500, color: '#c9b8ff', scale: 2.6 }], ['burst', { at: 1550, n: 14, spin: 300, reach: 1.3 }]],
      koMs: 2400, koPeak: 1500,
      sharpen: [['blade', { angle: 60, n: 2, color: '#f2edff', fan: 16 }], ['glint', { n: 5, color: '#c9b8ff' }]],
      heavy: [['moonmawGale', {}], ['claws', { n: 3, angle: -35, color: '#f2edff' }], ['quake', { n: 2, color: '#c9b8ff' }]],
      block: [['sigil', { sides: 12, rot: 15, turn: -45 }], ['burst', { n: 6, glyph: 'crescent', size: 0.6 }]],
      shield: [['bubble', {}], ['deflect', { n: 5, glyph: 'crescent' }]],
      wind: [['heart', {}], ['gust', { n: 3, color: '#f2edff', turn: 90 }]],
      body: { hit: 'reel', crit: 'whiplash', sharpen: 'gash', strike: 'swipe', heavy: 'overreach', block: 'recoil', shield: 'glance', wind: 'dim', ko: 'totality' },
  },
  assault: { travel: 'lunge', impact: 'bite' }, // the maw lunges at the camera and snaps shut
  body: {},
}
