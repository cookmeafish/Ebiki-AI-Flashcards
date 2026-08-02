// Model Advisor — pure prompt builders for the dynamic per-preset model selection.
//
// When the user picks an intelligence preset (optimized / normal / max), the app checks the
// provider's LIVE model list; if new models appeared (or the preset was never decided), it (1)
// researches each new model (web search + strongest model) into a "model card", then (2) asks the
// strongest model to assign the best model to each app ROLE for THAT preset. Decisions are cached
// per (provider, preset) with the model-list snapshot they were made against, so re-selecting a
// preset with no new models applies the cached plan instantly with no AI call.
//
// These builders are pure (all data passed in). Orchestration + aiCall live in App.jsx.

// The app's AI roles, described by STAKES x FREQUENCY so the advisor can reason about them. Keep in
// sync with AI_ROLE_META / ROLE_TIER in App.jsx (and the CLAUDE.md tiering table).
export const ROLE_STAKES = [
  { role: 'deck', text: 'Generates + proofreads Anki flashcards. HIGHEST STAKES: the learner MEMORIZES these, so a subtly wrong card teaches something false. Never use a weak model here.' },
  { role: 'study', text: 'Writes quiz questions and grades free-text answers. Medium-high stakes; has deterministic answer-leak/first-letter guards, so a mid model is usually fine.' },
  { role: 'picture', text: 'Reads text from busy/stylized screenshots (vision) and translates in context. Needs solid VISION; medium stakes.' },
  { role: 'chat', text: 'The chat-tab tutor. Users feel quality on deep "why" explanations. Medium stakes.' },
  { role: 'general', text: 'Fallback + AI mode/config generation (createMode). Sets up a whole subject but runs rarely. Medium stakes.' },
  { role: 'discover', text: 'Profiles the learner + suggests new items. Low stakes: every suggestion is reviewed by the user and fact-checked by a verify pass.' },
  { role: 'help', text: "Ebi's Help assistant. Short Q&A. Low stakes." },
  { role: 'pose', text: 'A tiny classifier that picks the mascot pose. Fires on EVERY message. Trivial; always use the cheapest capable model.' },
]

const PRESET_GOAL = {
  optimized: 'MOST TOKEN-EFFICIENT while sacrificing the least intelligence. Use the cheapest model that is genuinely good enough for each role; only spend on a strong model where the stakes truly demand it (card generation). Every-message roles (pose) MUST be the cheapest capable model.',
  normal: 'BALANCED. A solid all-round model for every role. Favor a mid-tier model that is reliable everywhere without the cost/latency of the very top model. Pose may still be cheaper.',
  max: 'MOST CAPABLE. The strongest model available for every role where it helps, cost is not a concern. Pose may still use a cheaper model since it only picks an emote.',
}

// Research one model into a compact card, grounded in web-search results (models rarely know about
// models newer than their own cutoff, so the search results are load-bearing — prefer them over prior
// belief, and say so honestly when the evidence is thin).
export function buildModelResearchPrompt({ modelId, provider, priorModelId, searchResults = [] }) {
  const results = searchResults.length
    ? searchResults.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`).join('\n\n')
    : '(no search results)'
  return `You are researching an AI model so an app can decide where to use it. Be accurate; prefer the web results over prior belief, and lower your confidence when evidence is thin. Do NOT use em dashes or en dashes.

Model id: "${modelId}" (provider: ${provider})
${priorModelId ? `Previous model in its family: "${priorModelId}" (compare token usage against THIS).` : ''}

Web search results:
${results}

Return ONLY a JSON object (no markdown, no commentary):
{
  "tokenVsPrev": "more" | "less" | "same" | "unknown",   // token usage vs the previous model in its family, for the same work
  "strength": 1-5,        // reasoning/quality tier (1 weakest, 5 strongest) relative to this provider's current lineup
  "cost": 1-5,            // relative price per token (1 cheapest, 5 priciest)
  "vision": true | false, // can it read images
  "pros": ["short phrase", ...],   // 2-4 items
  "cons": ["short phrase", ...],   // 1-3 items
  "summary": "<one plain-language sentence a non-technical person understands>",
  "confidence": 0.0-1.0
}`
}

// Ask the strongest model to assign one model id to each app ROLE for the chosen preset, given the
// live available models and their researched cards.
export function buildPresetDecisionPrompt({ preset, availableModels = [], modelCards = {} }) {
  const cards = availableModels.map((id) => {
    const c = modelCards[id]
    return c
      ? `- ${id}: strength ${c.strength ?? '?'}/5, cost ${c.cost ?? '?'}/5, vision ${c.vision ? 'yes' : 'no'}. ${c.summary || ''}`
      : `- ${id}: (no info gathered)`
  }).join('\n')
  const roles = ROLE_STAKES.map((r) => `- ${r.role}: ${r.text}`).join('\n')
  return `You choose which AI model an app uses for each of its features, for ONE intelligence preset.

PRESET: "${preset}" - ${PRESET_GOAL[preset] || PRESET_GOAL.normal}

AVAILABLE MODELS (choose ONLY from these exact ids):
${cards}

FEATURES (roles) and their stakes:
${roles}

Assign the single best model id to EACH role for THIS preset's goal. A role that needs vision (picture) must get a vision-capable model. Never assign a model id that is not in the available list above.

IMPORTANT: EVERY model in the list is a valid choice, INCLUDING older ones. Choose by the best intelligence-vs-token-cost tradeoff for this preset's goal and the role's stakes, NOT by recency. Pick an older model when its combination of quality and token cost genuinely serves the role better than a newer one (e.g. nearly-as-smart but much cheaper for a low-stakes, high-frequency role). Do NOT prefer a model just because it is newer, and do NOT prefer an older one just because it is cheaper. The tradeoff is the point.

Return ONLY a JSON object mapping every role to a model id (no markdown, no commentary):
{ "deck": "<id>", "study": "<id>", "picture": "<id>", "chat": "<id>", "general": "<id>", "discover": "<id>", "help": "<id>", "pose": "<id>" }`
}
