// SPOKEN COMMANDS and EMPTY TURNS for Chat's voice mode (pure, tested). A command is handled on the device with no AI
// call: "repeat", "slower", "pause", "end", "recap" said as the WHOLE turn (a sentence that only contains the word,
// "repite conmigo la palabra", is a normal turn). Phrases cover the four app languages and the common learned ones.
// An empty turn (silence, filler, noise, the recognizer's well-known phrases for silence) is never sent, so a noisy
// room can never spend money. A real one-word answer ("sí", "no", "ok") is a turn.
// Design: docs/plans/2026-11-15-voice-conversation.md section 2.

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-゙゚ͯ]/g, '').toLowerCase()
  .replace(/[¿¡?!.,;:。、！？，…"'“”«»()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim()

// Politeness and address words that may surround a command ("can you repeat that please, Ebi").
const FILL = new Set(['please', 'por', 'favor', 'ebi', 'can', 'you', 'could', 'that', 'it', 'again', 'puedes', 'podrias', 'lo', 'eso',
  'mas', 'more', 'a', 'bit', 'little', 'un', 'poco', 'una', 'vez', 'otra', 'say', 'decir', 'dilo', 'just', 'ok', 'okay', 'vale', 'bueno',
  's\'il', 'te', 'plait', 'vous', 'bitte', 'per', 'piacere', 'pode', 'pfv', 'de', 'nuevo', 'novo', 'again,', 'the', 'session', 'la', 'sesion',
  'conversation', 'conversacion', 'now', 'ahora', 'ya', 'kudasai', 'ください', '请', '一下'])

// Polite words around a CJK command (folded like the turn).
const POLITE_CJK = fold('请一下ください')

const COMMANDS = {
  repeat: ['repeat', 'say again', 'come again', 'pardon', 'what', 'repite', 'repitelo', 'repetir', 'otra vez', 'de nuevo', 'como',
    'que dijiste', 'repete', 'repetir', 'repetez', 'repete', 'wiederhole', 'nochmal', 'noch einmal', 'ripeti', 'もう一度', 'もういちど', '再说一遍', '重复', '再说一次'],
  slower: ['slower', 'slow down', 'more slowly', 'mas despacio', 'despacio', 'mas lento', 'habla mas despacio', 'mais devagar', 'devagar',
    'plus lentement', 'langsamer', 'piu lentamente', 'piu piano', 'ゆっくり', 'もっとゆっくり', '慢一点', '慢点', '说慢一点'],
  faster: ['faster', 'speed up', 'mas rapido', 'mais rapido', 'plus vite', 'schneller', 'piu veloce', 'もっと速く', '快一点', '快点'],
  pause: ['pause', 'stop', 'wait', 'hold on', 'pausa', 'para', 'espera', 'detente', 'stopp', 'warte', 'attends', 'arrete', 'aspetta', 'ferma',
    'espere', 'ちょっと待って', '止めて', '暂停', '等一下', '停'],
  end: ['end', 'end session', 'goodbye', 'bye', 'im done', 'that is all', 'thats all', 'thats it', 'terminar', 'termina', 'terminamos', 'fin', 'adios',
    'chao', 'hasta luego', 'eso es todo', 'tchau', 'fim', 'au revoir', 'cest tout', 'tschuss', 'ende', 'ciao', 'basta', 'おわり', '終わり',
    'さようなら', '结束', '再见'],
  recap: ['recap', 'summary', 'sum up', 'how did i do', 'resumen', 'haz un resumen', 'como lo hice', 'resumo', 'resume moi', 'bilan',
    'zusammenfassung', 'riassunto', 'まとめ', '总结'],
}

// The command a whole turn asks for, or ''. Short turns only: the command phrase plus politeness words, nothing else.
export function voiceCommand(text) {
  const f = fold(text)
  if (!f || f.length > 48) return ''
  for (const [cmd, phrases] of Object.entries(COMMANDS)) {
    for (const p of phrases) {
      const fp = fold(p)
      if (f === fp) return cmd
      // CJK has no spaces: the phrase plus at most a polite word around it.
      if (/[぀-ヿ一-鿿]/.test(fp)) { if (f.includes(fp) && [...f.replace(fp, '')].every((ch) => POLITE_CJK.includes(ch) || ch === ' ')) return cmd; continue }
      const at = ` ${f} `.indexOf(` ${fp} `)
      if (at < 0) continue
      const rest = ` ${f} `.replace(` ${fp} `, ' ').trim().split(' ').filter(Boolean)
      if (rest.every((w) => FILL.has(w))) return cmd
    }
  }
  return ''
}

// The recognizer's phrases for silence and noise (Whisper hallucinates these on quiet audio), and pure fillers.
const NOISE = [/^\[.*\]$/, /^\(.*\)$/, /^♪+$/, /thank(s| you) for watching/, /subtitles? (by|made by)/, /subtitulos? (realizados|por)/,
  /amara\.org/, /gracias por ver/, /suscribete/, /^(uh+|um+|hmm+|mm+|ah+|eh+|erm+|em+|este|pues|ehm+|euh+|ano|えー+|あの|嗯+|呃+)$/]

// True when a transcript is not worth a turn: nothing, noise or filler only. One real word is a turn.
export function isEmptyTurn(text) {
  const raw = String(text || '').trim()
  if (!raw) return true
  const f = fold(raw)
  if (!f && !/[\p{L}\p{N}]/u.test(raw)) return true
  if (NOISE.some((re) => re.test(raw.toLowerCase().trim()) || re.test(f))) return true
  if (f.replace(/\s/g, '').length < 2 && !/[぀-ヿ一-鿿가-힯]/.test(raw)) return true // a lone letter is noise, never an answer
  return false
}

// Speech speeds the panel offers (1 = normal), and the next one up or down for "slower" / "faster".
export const SPEEDS = [0.75, 1, 1.25]
export function nextSpeed(cur, dir) {
  const i = SPEEDS.indexOf(cur)
  const at = i < 0 ? 1 : i
  return SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, at + (dir === 'slower' ? -1 : 1)))]
}
