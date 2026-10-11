// HORSEMAN: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts live in ./horseman.parts.jsx; his drawing acts every moment from fx/horseman.jsx.
// Two colors: his soulfire green and the lantern's pumpkin orange. Glyph: the carved pumpkin.
// The knockout (2400 ms, climax 1400): the killing blow freezes him, the soulfire leaves his collar as one small wisp
// and goes out, smoke rolls off him, then the lantern head cracks in two at the climax (seeds and fire spill, a
// shockwave, the road's dust) while he topples out of the saddle and the horse goes down into the fog
// (impact/body.js KO_FRAMES.unhorsed; his parts fall in fx/horseman.jsx and hold the fallen pose).
export default {
  style: {
      color: '#6dff9c', accent: '#ff8a1c', glyph: 'pumpkin',
      hit: [['burst', { n: 6, spin: -90, size: 0.8 }], ['sparks', { n: 8, color: '#ff7a1a' }]],
      crit: [['burst', { n: 10, spin: 320 }], ['starburst', { points: 5, inner: 0.35, spin: -90 }], ['embers', { n: 9, color: '#ff7a1a' }]],
      sharpen: [['blade', { angle: 20, n: 2, color: '#6dff9c', fan: 30 }], ['glint', { n: 4 }]],
      strike: [['horsemanHurl', {}], ['vignette', {}]],
      heavy: [['horsemanHooves', {}], ['quake', { n: 2, color: '#ff7a1a' }], ['dust', { n: 10 }]],
      block: [['sigil', { sides: 6, turn: 45 }], ['burst', { n: 6, glyph: 'pumpkin', size: 0.6, spin: -200 }]],
      shield: [['bubble', {}], ['deflect', { n: 4, glyph: 'pumpkin' }], ['sparks', { n: 6, color: '#ffd25a' }]],
      wind: [['heart', {}], ['gust', { n: 4, color: '#6dff9c', turn: 70, y: 28, size: 50 }], ['rise', { n: 6, glyph: 'ember', size: 0.4, color: '#6dff9c', from: 34, to: 24 }]],
      ko: [['speedlines', { color: '#6dff9c', n: 30, rot: -10 }], ['flash', { big: true }], ['horsemanWisp', { at: 300 }], ['rays', { at: 800, n: 10, color: '#6dff9c' }],
        ['horsemanShatter', { at: 1300 }], ['ring', { at: 1400, scale: 2.6, color: '#ff7a1a' }], ['sparks', { at: 1400, n: 14, color: '#ffd25a' }], ['dust', { at: 1450, n: 14 }]],
      koMs: 2400, koPeak: 1400,
      body: { hit: 'reel', crit: 'whiplash', sharpen: 'nick', strike: 'surge', heavy: 'charge', block: 'jar', shield: 'skid', wind: 'sway', ko: 'unhorsed' },
  },
  assault: { travel: 'thrown', impact: 'crack' }, // he hurls his blazing lantern head at you and it cracks the screen where it hits
  body: {},
}
