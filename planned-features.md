# Ebiki — Feature Status & Roadmap

## Implemented Features

### Branding & Identity ✅
- Rebranded from ScreenLens → **Ebiki** (a play on *ebi* — Japanese for shrimp — and *Anki*)
- Mascot **Ebi**, a red shrimp, lives in the bottom-left and is the built-in "Ebi's Help" assistant
- Context-aware mascot: Ebi's pose changes to match the current study question / chat topic / picture word (37 poses), reacts inline on AI chat messages only, and uses a distinct default per tab (Picture→camera, Study→book, Chat→singer)
- **Ocean Light** design system: mascot-red (`#DF2540`) focus color, Baloo 2 + Nunito rounded fonts, soft white cards, Duolingo-style 3D buttons; design tokens in `src/config/tokens.js`
- **Dark mode**: toggleable in settings (Appearance), CSS-variable themed, persisted with a no-flash pre-paint script
- Modern UI: gradient/glass surfaces, soft borders, hover/press feedback, entrance animations, custom scrollbars; geometry-safe button feedback; zoom-correct, clamped mascot drag
- AI Settings: per-feature model dropdowns from the provider's live list, "Check for new models", app-language (en/es/zh/ja) UI translation
- AI request errors (out of credits / rate limit / bad key) now surface a clear toast instead of failing silently
- **Unified Settings modal**: one ⚙ entry with a scoped sidebar — **App settings** (General: appearance, app language, translation · AI models) vs **Mode settings** (Study · Cards & Anki · Knowledge · Overlay · Learning modes). Header keeps a quick mode-switcher. Replaces the old stacking banner panels
- **Custom model entry**: pick any per-feature model from the provider's live list, or type a custom model id (emergency for future models), with a help link
- **Configurable Mascot model**: a dedicated AI role picks Ebi's pose from each response/question (fixes context mismatches like the "ethereal→knife" bug); defaults to the stronger model (Sonnet on Anthropic) for a better fit, user-configurable; keyword matching is the instant fallback
- **First-run onboarding**: Ebi-guided wizard (welcome → app language → light/dark → AI provider + key → first study mode), themed; re-runnable from Settings → General
- **Study companion**: a big Ebi sits beside the question with an "Ask Ebi" button (the floating button hides during study)
- Non-language modes (e.g. Security+) hide language-only study controls (quiz language, grammar feedback, conjugations) and quiz on concepts
- Tapped-word definitions during study are written in the app language (the user's language), not the quiz language, and are **context-aware**: the in-context meaning (analyzed from the whole question) shows in the legend's correct-green, with other senses in word-choice-purple
- Switching tabs closes the settings modal; all user config stays in gitignored local files (per-user)
- **Mascot pose changes exactly once per AI output** (no keyword→AI flicker); Ebi keeps its prior pose until the Mascot model decides, then changes once
- **"Ask AI" with a review step** in Cards & Anki and Study settings: the AI proposes changes shown as a before/after word-diff that you **✓ Accept / ✗ Deny / or refine** — nothing is applied without confirmation
- **Plain "neutral" shrimp** (`shrimp.png`) is the default pose when nothing else fits (whole-word keyword matching avoids spurious matches)
- Knowledge base is **per mode** (`modes/<mode>/knowledge/`), saved on upload, and gitignored so personal materials never reach git
- "Ask Ebi" during study opens a compact bottom-docked chat (no longer full-screen)
- **No-circle Help button**: the bottom-left Ebi is the bare transparent PNG (80px) with a soft red glow hugging its silhouette (drop-shadow, no disc), flipped to face right, with a gentle pop on hover. Empty-state mascots (Picture/Study) render glow-free
- **Dock Ebi's Help anywhere (FancyZones-style)**: drag the chat header or click the dock button to pick a zone — **Dock left**, **Dock right**, or **Under the question** — with previews that match exactly where it lands; drop in open space to free-float. The chat opens scrolled to the latest message
- **Per-mode Chat starter prompts**: subject-specific suggestion chips generated with the mode (backfilled for older modes), plus an always-present "💬 Just chat with Ebi"
- **Help mascot decoupled from study**; the study pose is precomputed per question so Ebi changes exactly once, with the question
- **Hover-shake fix**: float-up hover lifts live on an inner span so the hover hit-box never moves; images are non-draggable so dragging Ebi no longer trips the image-drop overlay

### Core Translation (Phase 1-3) ✅
- Two-stage OCR + AI translation pipeline
- Dual-pass OCR (preprocessed + original image, merged results)
- Tight-fitting word bounding boxes with hover translations
- ESC to cancel ongoing OCR/translation
- Cancel button in progress bar
- Multi-provider AI support (Claude, GPT, Gemini, Grok)
- 18 language support
- Screen capture, paste, upload, drag-drop

### Learning Modes (Phase 4-7) ✅
- AI-generated mode creation ("What do you want to learn?")
- Per-mode settings: card format, tag rules, study rules, deck, knowledge base
- Mode-specific Anki deck selection
- AI-assisted format editing (natural language)
- Conditional UI (language selectors hidden for general modes)
- Default mode template committed to git
- Per-mode named folders in modes/ directory

### Anki Integration ✅
- AnkiConnect proxy via Vite dev server
- AI-powered flashcard generation with customizable templates
- AI-generated tags per mode's tag rules
- Deck browser (view, edit, search, delete cards)
- Auto-sync to AnkiWeb after card creation and study ratings
- Per-mode deck selection

### Study Sessions (Phase 8) ✅
- Interleaved multi-card quizzes (configurable cards at once)
- AI-generated contextual questions (not templates)
- AI answer evaluation with feedback
- Grammar feedback toggle (optional, per quiz language) — notes appear inline with results, written in the quiz language
- Anki spaced repetition rating (Easy/Good/Hard/Again)
- Live New/Learn/Due counts from Anki
- Knowledge base context for smarter questions
- Quiz language selector (study in any language)
- Deleted card protection
- Streaming start: first card shown immediately, rest generated in background
- Smart question ordering: blind recall → guided recall → deep explanation (scales to any questionsPerCard)
- Progressive hint system: wrong answer → letter count hint → first letter hint → Try Again
- Undo last answer (Back button) while card is unsynced
- Smart Wrap Up: drops unstarted cards immediately, only finishes in-progress ones
- I Don't Know button: skip and mark question wrong instantly; card rating still adjustable via dropdown after evaluation
- Meaning Hint button: on-demand AI hint describing the word's meaning/context without revealing the answer word or any conjugated form
- Feedback chat Reply button: renamed from Ask to better reflect both corrections and questions
- Feedback chat trusts student corrections; mark_all_correct action for bulk typo fixes
- Deck browser edits sync back to active study session on close (no refresh needed)
- Browse cards save status feedback (Saving/Saved/error)
- Accent-tolerant answers + spelling toast: when grammar feedback is on, answers missing/wrong accents are accepted and the correctly-accented spelling pops up on the side (10s) so it can be practiced on the card's remaining questions
- Ambiguous-translation disambiguation: the question generator adds a sense/register/first-letter cue when a source word has multiple valid translations (e.g. "Favorable" → auspicioso)

### Knowledge Base ✅
- Per-mode knowledge/ folder
- Drag & drop file upload (.txt/.md)
- File list with enable/disable/delete
- AI uses enabled files as context during study and card generation

### Overlay Mode (Phase 9) ✅
- Electron companion app (optional, same repo)
- One-click launch/stop from toolbar with green/grey status indicator
- Auto-detects running state on page load (immediate check + 3s polling)
- Ctrl+Shift+S screen capture via desktopCapturer
- Loads actual web app (localhost:3000?overlay=true) — no code duplication
- Fullscreen overlay covering entire screen including taskbar
- Floating progress indicator during OCR in overlay mode
- ESC to dismiss (Electron global shortcut, stays running for next capture)
- All web app features available (hover, pin, explain, Anki)
- Process detection via tasklist, forceful kill via taskkill

### AI Help Assistant ✅
- Draggable floating ? button (repositionable anywhere on screen)
- AI chat powered by Claude Sonnet for high-quality brief answers
- Comprehensive app knowledge embedded as system context
- Smart positioning: chat opens toward available screen space
- Auto-scroll to start of AI replies
- Input stays focused during and after AI responses
- Hidden in overlay mode

### AI Model Configuration ✅
- AI Settings panel with a separately configurable model per app area (Picture, Deck, Study, Discover, Chat, Help, General)
- Each role is a dropdown of the provider's live model list — no manual model-id typing
- "Provider default" option shows the model actually in use when no override is set
- "Check for new models" button fetches the current model list from the provider's API (Anthropic, OpenAI, Gemini, xAI) so new releases appear without manual entry; auto-fetches on panel open and persists the list
- Retired-model self-healing retained (falls back to a current model on 404)

### App Language / Localization ✅
- App Language selector translates all UI chrome (tabs, buttons, labels, headers) across every tab — flashcard content is never translated
- Languages: English, Español, 中文 (简体), 日本語; missing keys fall back to English
- Dictionary-based i18n in src/i18n with a t() lookup; setting persisted in config

### Anki Card Formatting ✅
- Bold HTML labels (Pronunciación, Traducción, etc.)
- Proper line breaks between sections
- Rich formatting preserved in Anki desktop and mobile

## Future Improvements

### OCR Quality
- Consider Claude Vision API as alternative/supplement to Tesseract for complex game backgrounds
- Region selection (drag to select area to translate instead of full screen)
- Multi-resolution OCR passes for different text sizes
- Text region detection before OCR to focus on text areas

### Overlay Enhancements
- Click-through mode for transparent areas (per-pixel hit testing)
- Overlay settings accessible from overlay window
- Multiple monitor support
- Hotkey customization

### Study Improvements
- **Discover Mode — adaptive card discovery** ✅: a top-level **Discover** tab that estimates the user's level (CEFR / exam-domains / tiers), opens to a setup screen (Words/Phrases/Both + Focus box), then suggests *new* cards calibrated to the level (web-verified) and lets them Make Card / I Know This / Skip / Not Interested. Profile + ledger stored as cloud-synced Anki media files (local fallback). Full design in [discover-mode-plan.md](discover-mode-plan.md).
- **Deck tab tools** ✅: Add card (manual or AI-generated), Analyze for ambiguous cards, and Scan for duplicates (accent-insensitive + edit-distance detection, AI-confirmed, with a per-deck "do not merge" memory).
- **Default UI zoom** ✅: 1.35× body zoom so the fixed-pixel layout reads well on Windows (root height divides the zoom out so vh-centered layouts stay centered); overlay mode exempt for OCR alignment.
- **Color-coded study feedback** ✅: AI categorizes each result into colored notes (praise/correction/grammar/terminology/detail/tip) for all modes, with a legend button; feedback chat and meaning hints respond in the quiz language.
- Spaced repetition scheduling within the app (without Anki)
- Study session history and statistics
- Progress tracking per mode
- Per-question immediate feedback mode (evaluate each answer as it's submitted rather than batch at card end)

### General
- Export translations as CSV/JSON
- Translation history
- Keyboard navigation between words
- Side panel with full word list
- Multi-language auto-detection improvement
