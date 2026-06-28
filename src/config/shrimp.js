// Ebi — the mascot & helper of the Ebiki app. Ebi is a red shrimp (Ebiki = "ebi",
// Japanese for shrimp, + "Anki"). The floating assistant button shows Ebi, whose pose
// changes with the context of whatever the user is doing (study question, chat topic,
// picture word, etc). Two ways a pose is chosen:
//   1. AI-chosen: an AI reply may include <pose>name</pose> (semantic, best accuracy).
//      Names come from POSE_NAMES; resolve with poseFile(name).
//   2. pickShrimp(text): instant keyword fallback for non-AI moments (study questions,
//      picture words) or when the AI returns no pose.

// The neutral/"nothing" pose — a plain shrimp. Used whenever no other pose clearly fits
// (better a plain Ebi than a pose that doesn't correlate). This is also the AI's "default".
export const DEFAULT_SHRIMP = 'shrimp.png'

// Resting image for the floating Help button before any context (the peeking hole shrimp).
export const IDLE_SHRIMP = '6820-holeshrimp.png'

export const shrimpUrl = (file) => `/assets/shrimp/${file}`

// ⭐ ADDING A NEW EMOTE (when the user drops new shrimp PNGs):
//   1. Put the PNG in public/assets/shrimp/ (keep its filename).
//   2. Add ONE entry below: { name, file, keywords }.
//        name = short unique AI-facing label (lowercase) → auto-added to POSE_NAMES so the
//               AI can immediately pick <pose>name</pose>. No prompt edits needed.
//        keywords = trigger words for the instant keyword fallback (add synonyms + some Spanish).
//   3. Done — POSE_NAMES, poseFile(), and the AI prompt all derive from this array.
//   Keep names/keywords non-overlapping so each pose has a clear purpose. (See CLAUDE.md too.)
//
// Each entry: name (the AI-facing label) + file + keywords for the fallback matcher.
export const SHRIMP = [
  { name: 'hiding', file: '6820-holeshrimp.png', keywords: ['hide', 'hidden', 'hiding', 'peek', 'sneaky', 'shy', 'burrow', 'secret', 'lurk', 'peeking'] },
  { name: 'work', file: '7994-workshrimp.png', keywords: ['work', 'working', 'job', 'office', 'business', 'career', 'labor', 'labour', 'employ', 'task', 'hammer', 'build', 'construction', 'project', 'productive'] },
  { name: 'food', file: '8642-shrimpfriedrice.png', keywords: ['rice', 'food', 'cook', 'cooking', 'fried', 'meal', 'dinner', 'lunch', 'eat', 'eating', 'cuisine', 'recipe', 'kitchen', 'wok', 'restaurant', 'hungry', 'comida', 'arroz', 'comer'] },
  { name: 'cheese', file: '48438-cheeseshrimp.png', keywords: ['cheese', 'dairy', 'queso', 'fromage', 'cheesy', 'smile', 'grin', '🧀'] },
  { name: 'juice', file: '41517-juiceshrimp.png', keywords: ['juice', 'drink', 'beverage', 'smoothie', 'thirsty', 'fruit', 'jugo', 'zumo', 'refreshing'] },
  { name: 'tea', file: '73261-teashrimp.png', keywords: ['tea', 'coffee', 'cup', 'british', 'relax', 'café', 'cafe', 'chamomile', 'brew', 'kettle', 'té'] },
  { name: 'icecream', file: '1032-shrimp-love-ice-cream.png', keywords: ['ice cream', 'icecream', 'dessert', 'sweet', 'sundae', 'gelato', 'cone', 'love', 'heart', 'romance', 'helado', '❤', '🍦'] },
  { name: 'rockstar', file: '12539-rockstarshrimp.png', keywords: ['rock', 'guitar', 'band', 'rockstar', 'rock star', 'concert', 'electric guitar', 'metal', 'punk', 'gig'] },
  { name: 'saxophone', file: '35082-saxophoneshrimp.png', keywords: ['saxophone', 'sax', 'jazz', 'blues', 'saxofón'] },
  { name: 'trumpet', file: '38751-trumpetshrimp.png', keywords: ['trumpet', 'brass', 'fanfare', 'horn', 'trompeta'] },
  { name: 'gamer', file: '52338-gamershrimp.png', keywords: ['game', 'gaming', 'gamer', 'controller', 'console', 'video game', 'videogame', 'xbox', 'playstation', 'nintendo', 'esports', 'rpg', 'fps', 'level up', 'juego', 'videojuego'] },
  { name: 'science', file: '63857-scienceshrimp.png', keywords: ['science', 'chemistry', 'chemical', 'experiment', 'lab', 'laboratory', 'scientist', 'physics', 'biology', 'molecule', 'atom', 'research', 'beaker', 'reaction', 'ciencia', 'química'] },
  { name: 'doctor', file: '63857-doctorshrimp.png', keywords: ['doctor', 'medicine', 'medical', 'health', 'hospital', 'nurse', 'patient', 'cure', 'treatment', 'clinic', 'médico', 'medicina', 'salud'] },
  { name: 'sick', file: '65328-sickshrimp.png', keywords: ['sick', 'ill', 'illness', 'fever', 'flu', 'cold', 'unwell', 'nausea', 'disease', 'symptom', 'enfermo', 'gripe'] },
  { name: 'artist', file: '81537-artistshrimp.png', keywords: ['art', 'artist', 'paint', 'painting', 'draw', 'drawing', 'palette', 'creative', 'design', 'color', 'colour', 'canvas', 'sketch', 'arte', 'pintura', 'dibujar'] },
  { name: 'weapon', file: '85211-killershrimp.png', keywords: ['sword', 'blade', 'weapon', 'fight', 'fighter', 'combat', 'battle', 'war', 'attack', 'guard', 'bodyguard', 'protect', 'security', 'soldier', 'warrior', 'army', 'military', 'police', 'defend', 'espada', 'arma', 'guerra', 'two-handed', 'two handed'] },
  // Shrimp holding a KNIFE — use for cutting/chopping food AND stabbing/knife topics.
  { name: 'knife', file: '9646-shrimp-killer.png', keywords: ['knife', 'cut', 'cutting', 'slice', 'sliced', 'slicing', 'chop', 'chopping', 'mince', 'stab', 'stabbing', 'dagger', 'blade', 'carve', 'kill', 'killer', 'murder', 'slay', 'assassin', 'deadly', 'lethal', 'cuchillo', 'cuchilla', 'rebanar', 'apuñalar'] },
  { name: 'bat', file: '61407-nailbatshrimp.png', keywords: ['bat', 'club', 'mace', 'bludgeon', 'melee', 'spiked', 'smash', 'beat', 'apocalypse', 'zombie', 'brawl'] },
  { name: 'chainsaw', file: '92476-shrimpchainsaw.png', keywords: ['chainsaw', 'saw', 'cut', 'chop', 'chopping', 'tree', 'trees', 'wood', 'woodcutter', 'lumber', 'lumberjack', 'timber', 'forest', 'axe', 'horror', 'gore', 'massacre', 'sierra', 'cortar', 'árbol', 'leñador'] },
  { name: 'devil', file: '59871-devilshrimp.png', keywords: ['devil', 'demon', 'evil', 'hell', 'satan', 'sin', 'fire', 'angry', 'rage', 'wicked', 'diablo', 'demonio'] },
  { name: 'angel', file: '64821-angelshrimp.png', keywords: ['angel', 'heaven', 'halo', 'wings', 'holy', 'pure', 'divine', 'blessed', 'saint', 'ángel', 'cielo'] },
  { name: 'dead', file: '87509-deadshrimp.png', keywords: ['dead', 'death', 'die', 'died', 'rip', 'grave', 'skull', 'skeleton', 'corpse', 'muerte', 'muerto'] },
  { name: 'ghost', file: '94219-ghostshrimp.png', keywords: ['ghost', 'spooky', 'halloween', 'scary', 'spirit', 'haunt', 'haunted', 'boo', 'phantom', 'fantasma'] },
  { name: 'king', file: '61349-kingshrimp.png', keywords: ['king', 'crown', 'royal', 'royalty', 'ruler', 'monarch', 'throne', 'kingdom', 'emperor', 'rey', 'corona'] },
  { name: 'princess', file: '61349-princessshrimp.png', keywords: ['princess', 'queen', 'tiara', 'fairy tale', 'fairytale', 'castle', 'princesa', 'reina'] },
  { name: 'cowboy', file: '4090-shrimp-cowbow.png', keywords: ['cowboy', 'cowgirl', 'west', 'western', 'ranch', 'rodeo', 'sheriff', 'saloon', 'lasso', 'wild west', 'vaquero'] },
  { name: 'anime', file: '4237-shrimp-anime.png', keywords: ['anime', 'manga', 'otaku', 'cartoon', 'animation', 'waifu', 'cosplay'] },
  { name: 'cute', file: '72037-kawaiishrimp.png', keywords: ['kawaii', 'cute', 'adorable', 'lovely', 'sweetie', 'precious', 'tierno', 'lindo'] },
  { name: 'french', file: '94915-frenchshrimp.png', keywords: ['french', 'france', 'paris', 'baguette', 'francés', 'francia', 'croissant', 'beret', 'eiffel'] },
  { name: 'magic', file: '3052-shrimpofillussions.png', keywords: ['illusion', 'magic', 'magician', 'wizard', 'trick', 'fantasy', 'dream', 'mystery', 'spell', 'magia', 'mago', 'ilusión', 'star', 'cosmic'] },
  { name: 'bath', file: '3542-bathshrimp.png', keywords: ['bath', 'bathroom', 'shower', 'wash', 'clean', 'hygiene', 'soap', 'bubble', 'baño', 'ducha'] },
  { name: 'chill', file: '3542-chillshrimp.png', keywords: ['chill', 'relax', 'sofa', 'couch', 'calm', 'lazy', 'rest', 'movie', 'popcorn', 'netflix', 'weekend', 'tranquilo', 'descansar'] },
  { name: 'sleep', file: '93623-sleepshrimp.png', keywords: ['sleep', 'sleepy', 'tired', 'bed', 'nap', 'night', 'dream', 'zzz', 'bedtime', 'dormir', 'sueño', 'cansado'] },
  { name: 'party', file: '96324-partyshrimp.png', keywords: ['party', 'celebrate', 'celebration', 'birthday', 'confetti', 'dance', 'festive', 'fun', 'congrats', 'congratulations', 'fiesta', 'celebrar', '🎉'] },
  { name: 'camera', file: 'camerashrimp.png', keywords: ['camera', 'photo', 'photograph', 'photography', 'picture', 'snapshot', 'selfie', 'capture', 'screenshot', 'lens', 'shutter', 'foto', 'cámara', 'fotografía'] },
  { name: 'singer', file: 'singershrimp.png', keywords: ['sing', 'singer', 'singing', 'song', 'microphone', 'mic', 'karaoke', 'vocal', 'voice', 'podcast', 'announce', 'rap', 'choir', 'cantar', 'canción', 'micrófono', 'cantante'] },
  { name: 'book', file: 'bookshrimp.png', keywords: ['book', 'read', 'reading', 'story', 'stories', 'tale', 'tales', 'novel', 'literature', 'library', 'chapter', 'textbook', 'fairy tale', 'fiction', 'leer', 'libro', 'cuento', 'lectura', 'historia'] },
]

// Shared list for AI prompts + the parser, plus name→file lookup.
export const POSE_NAMES = ['default', ...SHRIMP.map((s) => s.name)]
const NAME_TO_FILE = SHRIMP.reduce((m, s) => { m[s.name] = s.file; return m }, { default: DEFAULT_SHRIMP })
export function poseFile(name) {
  if (!name) return null
  const f = NAME_TO_FILE[String(name).trim().toLowerCase()]
  return f || null
}

// Simple deterministic string hash → used to pick stably among tied matches.
function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0 }
  return Math.abs(h)
}

// Pick the shrimp whose keywords best match `text`. Returns a filename, or DEFAULT_SHRIMP
// (the plain "nothing" shrimp) when nothing clearly fits. Matches WHOLE WORDS/phrases only —
// never substrings — so e.g. "art" never matches inside "particular". Ties broken by a stable
// hash of the text so the pose doesn't flicker.
export function pickShrimp(text) {
  if (!text) return DEFAULT_SHRIMP
  const t = ` ${String(text).toLowerCase()} `
  let best = []
  let bestScore = 0
  for (const s of SHRIMP) {
    let score = 0
    for (const kw of s.keywords) {
      if (kw.length <= 2) { if (t.includes(kw)) score += 1; continue } // short tokens / emoji
      // whole-word (or whole-phrase) match only — no substring matching
      const re = new RegExp(`(^|[^a-z])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i')
      if (re.test(t)) score += 1
    }
    if (score > bestScore) { bestScore = score; best = [s] }
    else if (score === bestScore && score > 0) best.push(s)
  }
  if (bestScore === 0 || best.length === 0) return DEFAULT_SHRIMP
  return best[hashStr(t) % best.length].file
}
