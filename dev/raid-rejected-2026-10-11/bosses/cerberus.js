// CERBERUS: this raid boss's own fight moments, in one place (impact/bosses/README.md says how the files fit).
//   style    its impact style (the shape is documented at the top of impact/styles.js)
//   assault  its attack on the player when it takes a heart (impact/assault.js: travel + impact, unique per boss)
//   body     body moves of its OWN, per moment ({ strike: { name: 'keyframes' } }), named <motif><Move> so they never clash;
//            style.body may name these or the shared ones in impact/body.js
// Its own drawn parts (when the shared ones in impact/parts.jsx are not enough) live in ./cerberus.parts.jsx.
export default {
  style: {
      color: '#3fffd5', accent: '#06302a', glyph: 'chain',
      hit: [['burst', { n: 5, spin: 200, size: 0.8 }], ['sparks', { n: 8, color: '#ff8a3a' }]],
      crit: [['ring', { top: 60, scale: 1.6, width: 5, dashed: true }], ['burst', { n: 9, spin: 260 }], ['sparks', { n: 12, color: '#ff8a3a' }]], // a broken chain ring snaps out round all three heads from his chest (a star over the faces hid the Warden)
      strike: [['lash', {}], ['bite', { n: 3, dir: 'v', small: true }]],
      ko: [['speedlines', { color: '#ff8a3a', n: 34, rot: 12 }], ['flash', { big: true }], ['chainsnap', { at: 200 }], ['sparks', { at: 780, n: 14, color: '#3fffd5' }],
        ['gutter', { at: 900, color: '#3fffd5' }], ['ring', { at: 1300, scale: 2.5, color: '#3fffd5' }], ['burst', { at: 1300, glyph: 'chain', n: 14, spin: 600, reach: 1.4 }], ['dust', { at: 1350, n: 12 }]],
      koMs: 2200, koPeak: 1300,
      flash: { y: 70, size: 40 }, // the shared hit flash lands on the Warden's collar, never over the faces
      sharpen: [['blade', { angle: -15, n: 3, color: '#ff8a3a', fan: 20 }], ['sparks', { n: 8, color: '#3fffd5' }]],
      heavy: [['rise', { n: 14, glyph: 'flame', size: 0.6, color: '#ff8a3a' }], ['claws', { n: 3, angle: 20, color: '#3fffd5' }], ['quake', { n: 2, color: '#ff8a3a' }]],
      block: [['sigil', { sides: 3, turn: 60 }], ['burst', { n: 6, glyph: 'chain', size: 0.6, spin: 300 }]],
      shield: [['bubble', {}], ['deflect', { n: 3, glyph: 'chain', from: 'side' }], ['sparks', { n: 6, color: '#ff8a3a' }]],
      wind: [['heart', {}], ['rise', { n: 6, glyph: 'flame', size: 0.5, color: '#3fffd5', from: 34, to: 24 }], ['gust', { n: 3, color: '#3fffd5', turn: -75, y: 28, size: 50 }]],
      body: { hit: 'reel', crit: 'cerberusKnockback', sharpen: 'gash', strike: 'cerberusLunge', heavy: 'cerberusPounce', block: 'cerberusCrouch', shield: 'ricochet', wind: 'falter', ko: 'unchained' },
  },
  assault: { travel: 'chain', impact: 'bite' }, // the chain lashes out, three jaws bite down
  // the big motion of his own moments on the whole drawing's box (never clipped), from the bottom centre so it stays
  // on its feet: a critical knocks the whole hound back and down then recoils past rest, his strike and heavy blow are a
  // lunge up and forward (the heads snap in sequence on top, fx/cerberus.jsx), a block a braced crouch
  body: {
    crit: { cerberusKnockback: '0% { transform: none; transform-origin: 50% 100%; filter: brightness(1) } 10% { transform: translateY(3%) scale(.86); transform-origin: 50% 100%; filter: brightness(2.2) } 30% { transform: translateY(-3%) scale(1.07); transform-origin: 50% 100%; filter: brightness(1.2) } 52% { transform: scale(.98); transform-origin: 50% 100% } 74% { transform: scale(1.015); transform-origin: 50% 100% } 100% { transform: none; transform-origin: 50% 100%; filter: brightness(1) }' },
    strike: { cerberusLunge: '0% { transform: none; transform-origin: 50% 100% } 22% { transform: translateY(2%) scale(.95); transform-origin: 50% 100% } 44% { transform: translateY(-6%) scale(1.1); transform-origin: 50% 100% } 64% { transform: translateY(-2%) scale(1.04); transform-origin: 50% 100% } 100% { transform: none; transform-origin: 50% 100% }' },
    heavy: { cerberusPounce: '0% { transform: none; transform-origin: 50% 100% } 20% { transform: translateY(3%) scale(.92, .96); transform-origin: 50% 100% } 40% { transform: translateY(-8%) scale(1.14); transform-origin: 50% 100% } 56% { transform: translateY(-4%) scale(1.08); transform-origin: 50% 100% } 76% { transform: translateY(-1%) scale(1.02); transform-origin: 50% 100% } 100% { transform: none; transform-origin: 50% 100% }' },
    block: { cerberusCrouch: '0% { transform: none; transform-origin: 50% 100% } 18% { transform: scale(1.07, .88); transform-origin: 50% 100% } 46% { transform: scale(1.05, .9); transform-origin: 50% 100% } 70% { transform: scale(1.02, .97); transform-origin: 50% 100% } 100% { transform: none; transform-origin: 50% 100% }' }
  },
}
