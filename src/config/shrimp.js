// Ebi — the mascot & helper of the Ebiki app. Ebi is a red shrimp (Ebiki = "ebi",
// Japanese for shrimp, + "Anki"). The floating assistant button shows Ebi, whose pose
// changes with the context of whatever the user is doing (study question, chat topic,
// picture word, etc). pickShrimp(text) scores each pose's keywords against the text and
// returns the best match; falls back to the default "hole shrimp".

export const DEFAULT_SHRIMP = '6820-holeshrimp.png'

export const shrimpUrl = (file) => `/assets/shrimp/${file}`

// Each entry: file + keywords that should trigger it. Keywords are matched as whole
// words OR substrings against the lowercased context text.
export const SHRIMP = [
  { file: '7994-workshrimp.png', keywords: ['work', 'working', 'job', 'office', 'business', 'career', 'labor', 'labour', 'employ', 'task', 'hammer', 'build', 'construction', 'tool', 'project', 'productive'] },
  { file: '8642-shrimpfriedrice.png', keywords: ['rice', 'food', 'cook', 'cooking', 'fried', 'meal', 'dinner', 'lunch', 'eat', 'eating', 'cuisine', 'recipe', 'kitchen', 'wok', 'asian food', 'restaurant', 'hungry', 'comida', 'arroz', 'comer'] },
  { file: '48438-cheeseshrimp.png', keywords: ['cheese', 'dairy', 'queso', 'fromage', 'cheesy', 'say cheese', 'smile', 'grin', ':)', '😊', '🧀'] },
  { file: '41517-juiceshrimp.png', keywords: ['juice', 'drink', 'beverage', 'smoothie', 'thirsty', 'fruit', 'jugo', 'zumo', 'refreshing'] },
  { file: '73261-teashrimp.png', keywords: ['tea', 'coffee', 'cup', 'british', 'relax', 'café', 'cafe', 'chamomile', 'brew', 'kettle', 'té'] },
  { file: '1032-shrimp-love-ice-cream.png', keywords: ['ice cream', 'icecream', 'dessert', 'sweet', 'sundae', 'gelato', 'cone', 'love', 'heart', 'romance', 'helado', '❤', '🍦'] },
  { file: '12539-rockstarshrimp.png', keywords: ['rock', 'guitar', 'band', 'rockstar', 'rock star', 'concert', 'electric guitar', 'metal', 'punk', 'gig'] },
  { file: '35082-saxophoneshrimp.png', keywords: ['saxophone', 'sax', 'jazz', 'blues', 'saxofón'] },
  { file: '38751-trumpetshrimp.png', keywords: ['trumpet', 'brass', 'fanfare', 'horn', 'trompeta'] },
  { file: '52338-gamershrimp.png', keywords: ['game', 'gaming', 'gamer', 'controller', 'console', 'video game', 'videogame', 'xbox', 'playstation', 'nintendo', 'esports', 'rpg', 'fps', 'level up', 'juego', 'videojuego'] },
  { file: '63857-scienceshrimp.png', keywords: ['science', 'chemistry', 'chemical', 'experiment', 'lab', 'laboratory', 'scientist', 'physics', 'biology', 'molecule', 'atom', 'research', 'beaker', 'reaction', 'ciencia', 'química'] },
  { file: '63857-doctorshrimp.png', keywords: ['doctor', 'medicine', 'medical', 'health', 'hospital', 'nurse', 'patient', 'cure', 'treatment', 'clinic', 'médico', 'medicina', 'salud'] },
  { file: '65328-sickshrimp.png', keywords: ['sick', 'ill', 'illness', 'fever', 'flu', 'cold', 'unwell', 'nausea', 'disease', 'symptom', 'enfermo', 'gripe'] },
  { file: '81537-artistshrimp.png', keywords: ['art', 'artist', 'paint', 'painting', 'draw', 'drawing', 'palette', 'creative', 'design', 'color', 'colour', 'canvas', 'sketch', 'arte', 'pintura', 'dibujar'] },
  { file: '85211-killershrimp.png', keywords: ['sword', 'knife', 'blade', 'weapon', 'kill', 'killer', 'stab', 'dagger', 'machete', 'combat', 'fight', 'fighter', 'battle', 'war', 'attack', 'guard', 'bodyguard', 'protect', 'security', 'soldier', 'warrior', 'army', 'military', 'police', 'defend', 'espada', 'cuchillo', 'arma', 'guerra', 'two-handed', 'two handed'] },
  { file: '9646-shrimp-killer.png', keywords: ['murder', 'slay', 'slasher', 'assassin', 'hunt', 'predator', 'deadly', 'lethal', 'asesino'] },
  { file: '61407-nailbatshrimp.png', keywords: ['bat', 'club', 'mace', 'bludgeon', 'melee', 'spiked', 'smash', 'beat', 'apocalypse', 'zombie', 'brawl'] },
  { file: '92476-shrimpchainsaw.png', keywords: ['chainsaw', 'saw', 'cut', 'wood', 'lumber', 'horror', 'gore', 'massacre', 'sierra'] },
  { file: '59871-devilshrimp.png', keywords: ['devil', 'demon', 'evil', 'hell', 'satan', 'sin', 'fire', 'angry', 'rage', 'wicked', 'diablo', 'demonio'] },
  { file: '64821-angelshrimp.png', keywords: ['angel', 'heaven', 'halo', 'wings', 'holy', 'pure', 'divine', 'blessed', 'saint', 'ángel', 'cielo'] },
  { file: '87509-deadshrimp.png', keywords: ['dead', 'death', 'die', 'died', 'rip', 'grave', 'skull', 'skeleton', 'corpse', 'muerte', 'muerto'] },
  { file: '94219-ghostshrimp.png', keywords: ['ghost', 'spooky', 'halloween', 'scary', 'spirit', 'haunt', 'haunted', 'boo', 'phantom', 'fantasma', 'spirit'] },
  { file: '61349-kingshrimp.png', keywords: ['king', 'crown', 'royal', 'royalty', 'ruler', 'monarch', 'throne', 'kingdom', 'emperor', 'rey', 'corona'] },
  { file: '61349-princessshrimp.png', keywords: ['princess', 'queen', 'tiara', 'fairy tale', 'fairytale', 'castle', 'princesa', 'reina'] },
  { file: '4090-shrimp-cowbow.png', keywords: ['cowboy', 'cowgirl', 'west', 'western', 'ranch', 'rodeo', 'sheriff', 'saloon', 'lasso', 'wild west', 'vaquero'] },
  { file: '4237-shrimp-anime.png', keywords: ['anime', 'manga', 'otaku', 'cartoon', 'animation', 'waifu', 'cosplay'] },
  { file: '72037-kawaiishrimp.png', keywords: ['kawaii', 'cute', 'adorable', 'lovely', 'sweetie', 'precious', 'tierno', 'lindo'] },
  { file: '94915-frenchshrimp.png', keywords: ['french', 'france', 'paris', 'baguette', 'french', 'francés', 'francia', 'croissant', 'beret', 'eiffel'] },
  { file: '3052-shrimpofillussions.png', keywords: ['illusion', 'magic', 'magician', 'wizard', 'trick', 'fantasy', 'dream', 'mystery', 'spell', 'magia', 'mago', 'ilusión', 'star', 'cosmic'] },
  { file: '3542-bathshrimp.png', keywords: ['bath', 'bathroom', 'shower', 'wash', 'clean', 'hygiene', 'soap', 'bubble', 'baño', 'ducha'] },
  { file: '3542-chillshrimp.png', keywords: ['chill', 'relax', 'sofa', 'couch', 'calm', 'lazy', 'rest', 'movie', 'popcorn', 'netflix', 'weekend', 'tranquilo', 'descansar'] },
  { file: '93623-sleepshrimp.png', keywords: ['sleep', 'sleepy', 'tired', 'bed', 'nap', 'night', 'dream', 'rest', 'zzz', 'bedtime', 'dormir', 'sueño', 'cansado'] },
  { file: '96324-partyshrimp.png', keywords: ['party', 'celebrate', 'celebration', 'birthday', 'confetti', 'dance', 'festive', 'fun', 'congrats', 'congratulations', 'fiesta', 'celebrar', '🎉'] },
]

// Simple deterministic string hash → used to pick stably among tied matches.
function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0 }
  return Math.abs(h)
}

// Pick the shrimp whose keywords best match `text`. Returns a filename.
// Ties are broken deterministically by a hash of the text so it doesn't flicker,
// but still varies between different contexts (e.g. different sword questions).
export function pickShrimp(text) {
  if (!text) return DEFAULT_SHRIMP
  const t = ` ${String(text).toLowerCase()} `
  let best = []
  let bestScore = 0
  for (const s of SHRIMP) {
    let score = 0
    for (const kw of s.keywords) {
      if (kw.length <= 2) { if (t.includes(kw)) score += 1; continue }
      // whole-word match scores higher than a loose substring
      const re = new RegExp(`(^|[^a-z])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i')
      if (re.test(t)) score += 2
      else if (t.includes(kw)) score += 1
    }
    if (score > bestScore) { bestScore = score; best = [s] }
    else if (score === bestScore && score > 0) best.push(s)
  }
  if (bestScore === 0 || best.length === 0) return DEFAULT_SHRIMP
  return best[hashStr(t) % best.length].file
}
