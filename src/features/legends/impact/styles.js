// RAID IMPACT STYLES (pure data, tested by impact.test.js): how each raid boss's plain fight moments look, so a hit, a
// critical, the boss's strike and its knockout read as THAT boss (the owner: "make sure all of these hit hard and are
// unique per raid boss"). The moments themselves come from strikeFx.js; the parts are drawn by impact/parts.jsx.
//   color / accent   the boss's two fixed impact colors (bright, both themes; never theme tokens over the art)
//   glyph            its particle (impact/glyphs.jsx), flung by its hits and its knockout
//   hit / crit       parts played when the player strikes it (crit adds the label and the shared crit burst)
//   strike           its own attack on the player: a miss, a missed attack (bigger), and under a block or a Shield
//   ko               its knockout parts
//   body             { hit, strike, ko }: how the boss itself moves (BossArena keyframes lgBody<Moment>_<name>)
// A part is [name, params]; parts.jsx knows every name (PARTS) and impact.test.js checks every boss uses only known
// parts, a known glyph and body moves, and that no two bosses share a glyph, a strike or a knockout.
export const BODY = {
  hit: ['flinch', 'clank', 'wobble', 'flicker', 'reel', 'spin'],
  strike: ['lunge', 'slam', 'swipe', 'rear', 'scream', 'cast', 'surge', 'dart'],
  ko: ['shatter', 'dissolve', 'ascend', 'collapse', 'petrify', 'fall', 'bow', 'sink', 'crumble', 'burn', 'melt', 'eclipse', 'drop', 'implode', 'pop', 'flickerOut'],
}

export const RAID_IMPACT = {
  chronos: {
    color: '#f2c14e', accent: '#7a4a12', glyph: 'gear',
    hit: [['burst', { n: 6, spin: 240 }], ['sparks', { n: 6 }], ['ring', {}]],
    crit: [['burst', { n: 10, spin: 360, size: 1.3 }], ['hands', { ms: 700 }]],
    strike: [['hands', { ms: 620 }], ['burst', { n: 14, glyph: 'grain', size: 0.4, reach: 1.1 }], ['vignette', {}]],
    ko: [['hands', { ms: 1100 }], ['shards', { n: 16, color: '#dff6ff' }], ['drops', { n: 14, glyph: 'grain', size: 0.45 }], ['burst', { n: 10, spin: 540, size: 1.2 }]],
    body: { hit: 'clank', strike: 'rear', ko: 'shatter' },
  },
  banshee: {
    color: '#7ff0ff', accent: '#0b3a46', glyph: 'note',
    hit: [['burst', { n: 6, spin: 60 }], ['ring', { dashed: true }]],
    crit: [['burst', { n: 10, spin: 90, size: 1.3 }], ['scream', { n: 2 }]],
    strike: [['scream', { n: 4 }], ['vignette', { color: '#46d6ff' }]],
    ko: [['rise', { n: 10, glyph: 'note' }], ['scream', { n: 3, inward: true }], ['ring', { dashed: true, scale: 2.4, width: 4 }]],
    body: { hit: 'flicker', strike: 'scream', ko: 'dissolve' },
  },
  seraph: {
    color: '#ffe79a', accent: '#b8862b', glyph: 'feather',
    hit: [['burst', { n: 6, spin: 120 }], ['sparks', { n: 8, color: '#fffbe6' }]],
    crit: [['burst', { n: 10, spin: 180, size: 1.3 }], ['pillar', { width: 0.3, color: '#ffb300' }]],
    strike: [['beam', { dir: 'down', width: 0.5, color: '#ffb300' }], ['drops', { n: 8, glyph: 'feather', size: 0.6 }], ['ring', { color: '#ffb300', scale: 2, width: 4 }]],
    ko: [['pillar', { width: 0.7, color: '#ffb300' }], ['burst', { n: 16, spin: 220, size: 1.1, reach: 1.3 }], ['rays', { n: 18 }]],
    body: { hit: 'flinch', strike: 'cast', ko: 'ascend' },
  },
  titan: {
    color: '#ff7a1c', accent: '#3a1a08', glyph: 'fist',
    hit: [['burst', { n: 5, glyph: 'nut', size: 0.7, spin: 300 }], ['sparks', { n: 10, color: '#ffd27a' }]],
    crit: [['sparks', { n: 18, color: '#ffe0a0', reach: 1.2 }], ['ring', { scale: 2.2, width: 5 }], ['crack', { n: 4 }]],
    strike: [['slam', { glyph: 'fist' }], ['crack', { n: 5 }], ['dust', { n: 10 }]],
    ko: [['burst', { n: 12, glyph: 'nut', size: 0.9, spin: 400, reach: 1.3 }], ['crack', { n: 7 }], ['dust', { n: 16 }], ['ring', { scale: 2.6, width: 6 }]],
    body: { hit: 'clank', strike: 'slam', ko: 'collapse' },
  },
  vampire: {
    color: '#ff2442', accent: '#2a0008', glyph: 'bat',
    hit: [['burst', { n: 5, size: 0.8, spin: 30 }], ['drops', { n: 6, glyph: 'drop', size: 0.4, color: '#c8001e' }]],
    crit: [['burst', { n: 10, size: 1, spin: 40 }], ['fangs', { n: 2, small: true }]],
    strike: [['fangs', { n: 2 }], ['drops', { n: 10, glyph: 'drop', size: 0.5, color: '#c8001e' }], ['vignette', {}]],
    ko: [['rise', { n: 18, glyph: 'bat', size: 0.9 }], ['drops', { n: 8, glyph: 'drop', size: 0.5, color: '#c8001e' }], ['ring', { scale: 2.4 }]],
    body: { hit: 'flinch', strike: 'dart', ko: 'dissolve' },
  },
  gorgon: {
    color: '#3fe08a', accent: '#0d3a1f', glyph: 'scale',
    hit: [['burst', { n: 6, spin: 90 }], ['ring', { color: '#9fffc8' }]],
    crit: [['burst', { n: 10, spin: 120, size: 1.2 }], ['beam', { dir: 'cone', width: 0.5, small: true }]],
    strike: [['beam', { dir: 'cone', width: 0.9 }], ['crack', { n: 5, color: '#c9d1cc' }]],
    ko: [['crack', { n: 9, color: '#c9d1cc' }], ['drops', { n: 14, glyph: 'rubble', size: 0.55, color: '#8b938e' }], ['dust', { n: 14, color: '#a7b0aa' }]],
    body: { hit: 'flinch', strike: 'rear', ko: 'petrify' },
  },
  chimera: {
    color: '#ff6a2a', accent: '#3b0f00', glyph: 'claw',
    hit: [['burst', { n: 5, spin: 40 }], ['sparks', { n: 8 }]],
    crit: [['claws', { n: 3, angle: -30, small: true }], ['burst', { n: 9, size: 1.2 }]],
    strike: [['bite', { n: 3, dir: 'v' }], ['vignette', {}]],
    ko: [['scream', { n: 3, color: '#ffb36a' }], ['burst', { n: 12, spin: 90, size: 1.2, reach: 1.3 }], ['dust', { n: 12 }]],
    body: { hit: 'reel', strike: 'lunge', ko: 'fall' },
  },
  ratking: {
    color: '#ffc93a', accent: '#7a4f00', glyph: 'coin',
    hit: [['burst', { n: 6, spin: 720, size: 0.8 }], ['sparks', { n: 6, color: '#fff2b0' }]],
    crit: [['burst', { n: 14, spin: 900, size: 0.9, reach: 1.2 }], ['ring', { scale: 2 }]],
    strike: [['whip', { color: '#c98f86' }], ['burst', { n: 8, spin: 720, size: 0.6 }], ['vignette', {}]],
    ko: [['fountain', { n: 22, glyph: 'coin', size: 0.7 }], ['sparks', { n: 14, color: '#fff2b0', reach: 1.3 }], ['ring', { scale: 2.6, width: 5 }]],
    body: { hit: 'spin', strike: 'swipe', ko: 'fall' },
  },
  showman: {
    color: '#ff4fb0', accent: '#ffffff', glyph: 'card',
    hit: [['burst', { n: 5, spin: 540, size: 0.8 }], ['confetti', { n: 10 }]],
    crit: [['burst', { n: 9, spin: 720 }], ['confetti', { n: 22 }]],
    strike: [['cards', { n: 7 }], ['vignette', { color: '#ff4fb0' }]],
    ko: [['confetti', { n: 40, reach: 1.4 }], ['burst', { n: 12, spin: 900, reach: 1.3 }], ['curtain', {}]],
    body: { hit: 'spin', strike: 'cast', ko: 'bow' },
  },
  reaper: {
    color: '#6fe3ff', accent: '#06222c', glyph: 'wisp',
    hit: [['burst', { n: 5, spin: 20 }], ['ring', { color: '#bff4ff' }]],
    crit: [['arc', { small: true }], ['burst', { n: 9, spin: 40 }]],
    strike: [['arc', {}], ['vignette', { color: '#3fb8d6' }]],
    ko: [['rise', { n: 14, glyph: 'wisp', size: 0.9 }], ['arc', { reverse: true }], ['ring', { color: '#bff4ff', dashed: true, scale: 2.2, width: 4 }]],
    body: { hit: 'reel', strike: 'swipe', ko: 'collapse' },
  },
  leviathan: {
    color: '#38b6ff', accent: '#e8f8ff', glyph: 'drop',
    hit: [['burst', { n: 7, size: 0.7 }], ['splat', { n: 5, color: '#9fdcff' }]],
    crit: [['wave', { small: true }], ['burst', { n: 10, size: 0.9 }]],
    strike: [['wave', {}], ['drops', { n: 12, glyph: 'drop', size: 0.45 }]],
    ko: [['whirl', { n: 4 }], ['burst', { n: 16, size: 0.8, reach: 1.3 }], ['splat', { n: 10, color: '#9fdcff' }]],
    body: { hit: 'wobble', strike: 'surge', ko: 'sink' },
  },
  lich: {
    color: '#5dff9e', accent: '#062a14', glyph: 'skull',
    hit: [['burst', { n: 4, spin: 180, size: 0.8 }], ['sparks', { n: 8, color: '#b8ffd4' }]],
    crit: [['burst', { n: 8, spin: 240 }], ['ring', { scale: 2.2, dashed: true }]],
    strike: [['projectile', { glyph: 'skull' }], ['ring', { scale: 2.4, width: 6 }], ['vignette', { color: '#2bd46f' }]],
    ko: [['burst', { n: 10, glyph: 'bone', spin: 500, reach: 1.3 }], ['rise', { n: 10, glyph: 'wisp', color: '#5dff9e' }], ['shards', { n: 10, color: '#5dff9e' }]],
    body: { hit: 'flicker', strike: 'cast', ko: 'crumble' },
  },
  cerberus: {
    color: '#3fffd5', accent: '#06302a', glyph: 'chain',
    hit: [['burst', { n: 5, spin: 200, size: 0.8 }], ['sparks', { n: 8, color: '#ff8a3a' }]],
    crit: [['lash', { small: true }], ['burst', { n: 9, spin: 260 }]],
    strike: [['lash', {}], ['bite', { n: 3, dir: 'v', small: true }]],
    ko: [['burst', { n: 14, glyph: 'chain', spin: 600, reach: 1.4 }], ['rise', { n: 10, glyph: 'flame', color: '#3fffd5' }], ['ring', { scale: 2.5 }]],
    body: { hit: 'reel', strike: 'rear', ko: 'fall' },
  },
  tempest: {
    color: '#9fd8ff', accent: '#ffffff', glyph: 'bolt',
    hit: [['burst', { n: 5, spin: 30 }], ['sparks', { n: 10, color: '#e6f6ff' }]],
    crit: [['bolt', { n: 1 }], ['burst', { n: 9 }]],
    strike: [['bolt', { n: 3 }], ['vignette', { color: '#7cc8ff' }]],
    ko: [['bolt', { n: 5 }], ['sparks', { n: 16, color: '#e6f6ff', reach: 1.4 }], ['ring', { scale: 2.8, width: 6 }]],
    body: { hit: 'flinch', strike: 'cast', ko: 'flickerOut' },
  },
  dreamer: {
    color: '#ff5cf0', accent: '#ffffff', glyph: 'bubble',
    hit: [['burst', { n: 6, size: 0.8 }], ['ring', { color: '#ffb3f7' }]],
    crit: [['tendrils', { n: 2 }], ['burst', { n: 10 }]],
    strike: [['tendrils', { n: 4 }], ['vignette', { color: '#c23cff' }]],
    ko: [['burst', { n: 20, reach: 1.4, size: 0.9 }], ['rise', { n: 12, glyph: 'bubble', size: 0.7 }], ['ring', { scale: 2.4, dashed: true }]],
    body: { hit: 'wobble', strike: 'surge', ko: 'pop' },
  },
  berserker: {
    color: '#ff4a1a', accent: '#2a0a00', glyph: 'axe',
    hit: [['sparks', { n: 10, color: '#ffb36a' }], ['burst', { n: 4, size: 0.8, spin: 300 }]],
    crit: [['cleave', { small: true }], ['sparks', { n: 16, color: '#ffb36a' }]],
    strike: [['cleave', {}], ['rise', { n: 8, glyph: 'ember', size: 0.35 }], ['vignette', {}]],
    ko: [['slam', { glyph: 'axe' }], ['rise', { n: 16, glyph: 'ember', size: 0.4 }], ['dust', { n: 14 }]],
    body: { hit: 'reel', strike: 'slam', ko: 'fall' },
  },
  inferno: {
    color: '#ff7a14', accent: '#ffe08a', glyph: 'flame',
    hit: [['burst', { n: 6, size: 0.8 }], ['rise', { n: 6, glyph: 'ember', size: 0.35 }]],
    crit: [['breath', { small: true }], ['burst', { n: 10 }]],
    strike: [['breath', {}], ['rise', { n: 10, glyph: 'ember', size: 0.4 }]],
    ko: [['pillar', { width: 0.6, color: '#ff7a14' }], ['rise', { n: 20, glyph: 'flame', size: 0.7 }], ['burst', { n: 14, glyph: 'ember', size: 0.6, reach: 1.4 }]],
    body: { hit: 'flinch', strike: 'lunge', ko: 'burn' },
  },
  swarmqueen: {
    color: '#ffb21a', accent: '#5a2d00', glyph: 'hex',
    hit: [['burst', { n: 6, size: 0.7 }], ['volley', { n: 5, small: true }]],
    crit: [['volley', { n: 10, small: true }], ['burst', { n: 10 }]],
    strike: [['volley', { n: 16 }], ['vignette', { color: '#ffb21a' }]],
    ko: [['burst', { n: 18, reach: 1.4, spin: 200 }], ['volley', { n: 12, scatter: true }], ['dust', { n: 10, color: '#ffd27a' }]],
    body: { hit: 'flinch', strike: 'dart', ko: 'crumble' },
  },
  moonmaw: {
    color: '#c9b8ff', accent: '#20184a', glyph: 'crescent',
    hit: [['burst', { n: 5, spin: 160 }], ['sparks', { n: 8, color: '#f2edff' }]],
    crit: [['talons', { small: true }], ['burst', { n: 9, spin: 200 }]],
    strike: [['talons', {}], ['burst', { n: 8, glyph: 'feather', size: 0.6, color: '#9a8ad6' }]],
    ko: [['rays', { n: 12, color: '#f2edff' }], ['eclipse', {}], ['burst', { n: 14, spin: 300, reach: 1.3 }]],
    body: { hit: 'reel', strike: 'swipe', ko: 'eclipse' },
  },
  hydra: {
    color: '#5fd0ff', accent: '#062436', glyph: 'fang',
    hit: [['burst', { n: 5, spin: 120, size: 0.8 }], ['splat', { n: 4, color: '#bde9ff' }]],
    crit: [['bite', { n: 1, dir: 'h', small: true }], ['burst', { n: 9 }]],
    strike: [['bite', { n: 2, dir: 'h' }], ['splat', { n: 8, color: '#bde9ff' }]],
    ko: [['splat', { n: 16, color: '#bde9ff', reach: 1.3 }], ['burst', { n: 12, spin: 200, reach: 1.3 }], ['whirl', { n: 2 }]],
    body: { hit: 'reel', strike: 'rear', ko: 'sink' },
  },
  kaleido: {
    color: '#ff8a1a', accent: '#ffffff', glyph: 'shard',
    hit: [['shards', { n: 6, rainbow: true }], ['ring', { color: '#ffffff' }]],
    crit: [['shards', { n: 14, rainbow: true }], ['rays', { n: 12, rainbow: true }]],
    strike: [['shards', { n: 12, rainbow: true, inward: true }], ['beam', { dir: 'across', width: 0.32, rainbow: true }]],
    ko: [['shards', { n: 26, rainbow: true, reach: 1.5 }], ['rays', { n: 18, rainbow: true }], ['ring', { scale: 2.8 }]],
    body: { hit: 'flinch', strike: 'cast', ko: 'shatter' },
  },
  puppeteer: {
    color: '#ff3b52', accent: '#1a0006', glyph: 'needle',
    hit: [['burst', { n: 6, spin: 540, size: 0.8 }], ['sparks', { n: 6 }]],
    crit: [['strings', { n: 3 }], ['burst', { n: 10, spin: 720 }]],
    strike: [['strings', { n: 5, yank: true }], ['projectile', { glyph: 'needle' }]],
    ko: [['strings', { n: 6, cut: true }], ['burst', { n: 12, spin: 720, reach: 1.3 }], ['dust', { n: 8 }]],
    body: { hit: 'spin', strike: 'dart', ko: 'drop' },
  },
  sugarqueen: {
    color: '#ff5fa2', accent: '#ffffff', glyph: 'candy',
    hit: [['burst', { n: 6, spin: 360, size: 0.8 }], ['confetti', { n: 8, sprinkles: true }]],
    crit: [['splat', { n: 6, color: '#ff9cc7' }], ['burst', { n: 10, spin: 540 }]],
    strike: [['splat', { n: 10, color: '#ff2f87', big: true }], ['drops', { n: 8, glyph: 'candy', size: 0.5 }]],
    ko: [['drip', { n: 9, color: '#ff9cc7' }], ['confetti', { n: 30, sprinkles: true }], ['burst', { n: 12, spin: 720, reach: 1.3 }]],
    body: { hit: 'wobble', strike: 'surge', ko: 'melt' },
  },
  kitsune: {
    color: '#ff5a7a', accent: '#ffd6e0', glyph: 'petal',
    hit: [['burst', { n: 7, spin: 200, size: 0.7 }], ['sparks', { n: 6, color: '#ffd6e0' }]],
    crit: [['orbit', { n: 3, color: '#7fe8ff' }], ['burst', { n: 12, spin: 300, size: 0.8 }]],
    strike: [['orbit', { n: 5, color: '#7fe8ff' }], ['vignette', { color: '#ff5a7a' }]],
    ko: [['drops', { n: 24, glyph: 'petal', size: 0.6 }], ['burst', { n: 16, spin: 400, reach: 1.4, size: 0.7 }], ['orbit', { n: 4, out: true, color: '#7fe8ff' }]],
    body: { hit: 'flinch', strike: 'cast', ko: 'dissolve' },
  },
  ophanim: {
    color: '#ffcf4a', accent: '#5a3a00', glyph: 'eye',
    hit: [['burst', { n: 5, size: 0.8 }], ['halo', { n: 1, small: true }]],
    crit: [['halo', { n: 2 }], ['burst', { n: 9 }]],
    strike: [['halo', { n: 3, slice: true }], ['beam', { dir: 'down', width: 0.3, color: '#ff9d00' }]],
    ko: [['pull', { n: 18 }], ['halo', { n: 3, collapse: true }], ['shards', { n: 14, color: '#ffcf4a', inward: true }]],
    body: { hit: 'clank', strike: 'cast', ko: 'implode' },
  },
  void: {
    color: '#b067ff', accent: '#ffffff', glyph: 'star4',
    hit: [['burst', { n: 6, spin: 180, size: 0.8 }], ['ring', { color: '#e3c9ff', dashed: true }]],
    crit: [['pull', { n: 10, small: true }], ['burst', { n: 10, spin: 240 }]],
    strike: [['pull', { n: 16 }], ['tendrils', { n: 3, color: '#6a2bd6' }], ['vignette', { color: '#5a1fb8' }]],
    ko: [['pull', { n: 26 }], ['ring', { scale: 0.2, inward: true, width: 8 }], ['burst', { n: 16, reach: 1.5, spin: 360 }]],
    body: { hit: 'flicker', strike: 'surge', ko: 'implode' },
  },
}
// A boss with no style (a newer build's boss): the default look.
export const DEFAULT_IMPACT = {
  color: '#ffd23a', accent: '#1a1020', glyph: 'star4',
  hit: [['burst', { n: 6 }], ['ring', {}]], crit: [['burst', { n: 10 }]], strike: [['claws', { n: 3 }], ['vignette', {}]],
  ko: [['burst', { n: 14, reach: 1.3 }], ['rays', { n: 12 }]], body: { hit: 'flinch', strike: 'lunge', ko: 'fall' },
}
export const impactFor = (motif) => RAID_IMPACT[motif] || DEFAULT_IMPACT
