// PUPPETEER: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./puppeteer.parts.jsx.
export default {
  style: {
      color: '#ff3b52', accent: '#1a0006', glyph: 'needle',
      hit: [['burst', { n: 6, spin: 540, size: 0.8 }], ['sparks', { n: 6 }]],
      crit: [['strings', { n: 3 }], ['burst', { n: 10, spin: 720 }], ['starburst', { points: 8, inner: 0.15, spin: 22 }]],
      strike: [['strings', { n: 5, yank: true }], ['puppeteerHook', {}]],
      ko: [['speedlines', { color: '#ffb0bc', n: 30, rot: 21 }], ['flash', { big: true }], ['strings', { at: 150, n: 6 }], ['snip', { at: 650 }],
        ['strings', { at: 1050, n: 6, cut: true }], ['burst', { at: 1300, n: 12, spin: 720, reach: 1.3 }], ['dust', { at: 1300, n: 12 }], ['ring', { at: 1350, scale: 2.2, color: '#ff3b52' }]],
      koMs: 2200, koPeak: 1300,
      sharpen: [['blade', { angle: 80, n: 2, color: '#ffb0bc', fan: 12 }], ['strings', { n: 2, cut: true }]],
      heavy: [['puppeteerBar', {}], ['volley', { n: 10 }], ['quake', { n: 2 }], ['crack', { n: 5, color: '#ff3b52' }]],
      block: [['sigil', { sides: 4, rot: 0, turn: -90 }], ['strings', { n: 3, cut: true }]],
      shield: [['bubble', {}], ['deflect', { n: 6, glyph: 'needle' }]],
      wind: [['heart', {}], ['gust', { n: 2, color: '#ffb0bc', turn: -100 }]],
      body: { hit: 'puppeteerDangle', crit: 'whiplash', sharpen: 'sever', strike: 'dart', heavy: 'overreach', block: 'rebound', shield: 'skid', wind: 'falter', ko: 'cutStrings' },
  },
  assault: { travel: 'chain', impact: 'drain' }, // strings hook your heart and pull the life out of it
  body: {
    // a hit jerks it down on its strings and it bobs back up, swinging (a marionette, never a solid body)
    hit: { puppeteerDangle: '0% { transform: none } 12% { transform: translateY(9px) rotate(-5deg) } 30% { transform: translateY(-5px) rotate(4deg) } 48% { transform: translateY(3px) rotate(-3deg) } 66% { transform: translateY(-1px) rotate(1.5deg) } 100% { transform: none }' },
  },
}
