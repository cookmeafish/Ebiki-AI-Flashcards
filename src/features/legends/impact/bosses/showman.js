// SHOWMAN: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./showman.parts.jsx.
export default {
  style: {
      color: '#ffb52e', accent: '#ffffff', glyph: 'card',
      hit: [['burst', { n: 5, spin: 540, size: 0.8 }], ['confetti', { n: 10 }]],
      crit: [['burst', { n: 9, spin: 720 }], ['confetti', { n: 22 }], ['ring', { color: '#ffffff', scale: 2.2, width: 4 }]], // a white spotlight ring frames him (a star over his face hid it)
      strike: [['showmanBoomerang', {}], ['cards', { n: 7 }], ['vignette', { color: '#ffb52e' }]],
      ko: [['speedlines', { color: '#ffe7b0', n: 26, rot: 9 }], ['flash', { big: true }], ['spotlight', { at: 150, color: '#fff4c0' }], ['showmanCurtain', { at: 650, part: 36 }],
        ['confetti', { at: 1500, n: 44, reach: 1.5 }], ['burst', { at: 1500, n: 12, spin: 900, reach: 1.3 }], ['ring', { at: 1550, color: '#ffb52e', scale: 2.4, dashed: true }]],
      koMs: 2400, koPeak: 1500,
      sharpen: [['blade', { angle: -35, n: 4, color: '#ffe7b0', fan: 18, gap: 60 }], ['cards', { n: 4 }]],
      heavy: [['ring', { color: '#ffb52e', scale: 2.4, width: 5, dashed: true }], ['volley', { n: 14 }], ['quake', { n: 1, color: '#ffb52e' }]], // a spotlight ring that frames him, never a burst over his face
      block: [['sigil', { sides: 4, turn: 180 }], ['confetti', { n: 14 }]],
      shield: [['bubble', {}], ['deflect', { n: 5, glyph: 'card', from: 'side' }]],
      wind: [['heart', {}], ['glint', { n: 8, color: '#ffe7b0', y: 26, spread: 0.55 }], ['gust', { n: 2, color: '#ffb52e', turn: 140, y: 28, size: 50 }]],
      body: { hit: 'spin', crit: 'twirl', sharpen: 'split', strike: 'showmanFlourish', heavy: 'showmanBow', block: 'rebound', shield: 'glance', wind: 'sway', ko: 'curtainCall' },
  },
  assault: { travel: 'shards', impact: 'cut', glyph: 'card' }, // razor cards fly, one slices the screen in two
  body: {
    // his strike: a showman's flourish, he rises onto his toes and flares bright, never swelling past the stage
    strike: { showmanFlourish: '0% { transform: none; filter: brightness(1) } 28% { transform: translateY(-8px) scale(1.03); filter: brightness(1.6) } 48% { transform: translateY(5px) scale(1.06); filter: brightness(2) } 72% { transform: translateY(0) scale(1.02); filter: brightness(1.2) } 100% { transform: none; filter: brightness(1) }' },
    // his heavy blow: a sweeping lunge of a bow toward the hearts, a lean and a dip instead of a giant zoom
    heavy: { showmanBow: '0% { transform: none } 26% { transform: rotate(-5deg) translate(-6px, -8px) scale(1.02) } 46% { transform: rotate(6deg) translate(8px, 9px) scale(1.06) } 64% { transform: rotate(2deg) translate(3px, 3px) scale(1.03) } 100% { transform: none }' },
  },
}
