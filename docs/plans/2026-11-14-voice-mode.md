# Voice mode in Chat: talk with Ebi out loud

**Owner's ask (2026-11-14):** a mode inside Chat where Ebi talks with a voice model. Is it better on the computer or through an API? Is an API expensive, or is a decent model a decent price now? What can a medium computer run? Make an amazing plan, then execute it.

## The answer (researched 2026-11-14, official pricing pages)
Assumptions for the estimates: a 10-minute practice where the learner talks half the time.

| Way | How it works | Cost per hour of practice | Feel |
|---|---|---|---|
| **Cloud, step by step** (recommended default) | Speech to text, then the chat model the user already has, then text to speech | **about $0.35 to $0.70** (OpenAI: mini-transcribe $0.003/min + gpt-5-mini + gpt-4o-mini-tts about $0.015/min; Gemini: flash-lite + flash-lite-tts) | 1 to 3 s before Ebi answers; keeps every Chat feature: cards, accuracy rules, learner context |
| Cloud, live speech-to-speech | One model hears and speaks directly | Gemini Live about $0.70 to $0.85 (has a free tier); OpenAI gpt-realtime-mini $1 to $6; full gpt-realtime $3 to $20; xAI and ElevenLabs agents about $4.80 | Near-instant, can be interrupted naturally; sessions cap at about 10 to 15 min (Gemini) |
| On the computer | whisper.cpp or Moonshine (hearing) + Kokoro (voice) + a 4B model | **$0**; needs about 4 to 8 GB of memory; a 6 to 8 GB graphics card feels close to live | Integrated graphics run an 8B model at 10 to 15 words/s (2 to 4 s per reply); Kokoro's Japanese and Chinese voices are weak (rated C and D) |

Sources (read 2026-11-14):
- developers.openai.com/api/docs/pricing
- developers.openai.com/api/docs/guides/realtime-costs
- aistudio.google.com/docs/pricing
- docs.x.ai/docs/models
- elevenlabs.io/pricing/api
- deepgram.com/pricing
- github.com/ggml-org/whisper.cpp
- github.com/moonshine-ai/moonshine
- huggingface.co/hexgrad/Kokoro-82M (with VOICES.md)
- ollama.com/library/qwen3

**Not verified:** cloud latency figures; whether Gemini Live bills the growing context every turn.

Price changes to note:
- Gemini TTS prices double on 2027-01-01.
- Anthropic has no speech API, so an Anthropic-only user hears Ebi through the free device voice, or adds a speech key.
- The ChatGPT plan sign-in carries no audio.

**Verdict:** a decent API is cheap now. The step-by-step cloud path costs well under $1 an hour, and Ebiki already ranks speech engines by price (`src/speech/engines.js`). Build that first. It reuses the Chat brain unchanged, and it falls back to the free browser and device voices. Live speech-to-speech and on-device are phases 2 and 3.

## Phase 1 (build now): Voice mode in Chat, step by step
- **Entry:** a 🎙️ button beside Chat's Send (a generic `chatComposerItems` slot, so the feature stays a plug-in), plus a "+" menu entry.
- **Screen:** a voice panel over Chat.
  - Ebi big in the middle, with a state ring: listening / thinking / speaking.
  - Live captions: what you said, and what Ebi is saying.
  - Buttons:
    - **Interrupt:** tap while Ebi talks and he stops and listens.
    - **Pause.**
    - **End:** back to the chat, which shows the whole conversation, saved like any chat.
  - A cost line: which engines are in use and about how much per hour, from `COSTS`. "Free" when the browser or device voice is used.
- **Turn taking:** hands free.
  - The microphone level (a new `onLevel` option of `platform.speech.record`) feeds a pure turn detector (`turnDetector.js`, tested).
  - Speech starts the turn; about 1.2 s of quiet ends it; noise shorter than about 300 ms is ignored.
  - Tap to send at once.
  - The browser recognizer path ends turns by itself.
- **Brain:** the real Chat send, through a generic `ctx.chat` service (`send(text)`, live `messages`, `loading`). Same system prompt, learner context, cards and saving. Chat's send takes an optional text instead of the input box.
- **Voice output:**
  - Ebi's reply is turned into speakable text (`speakable.js`, pure, tested):
    - card JSON, sources, tags, links, code and markdown symbols are stripped;
    - cards are named as "I made a card for X".
  - Spoken sentence by sentence (the first sentence starts while the rest is made), in Ebi's voice.
  - In a language mode the reply is spoken in the language it is written in.
- **No new setup:** it uses the speech engines Settings already has, plus the user's provider key, or the free browser and device voices.
  - So no onboarding step: nothing new to connect.
  - If no engine can hear, the panel says what is needed, with a button to Settings (speech).
- **Rules kept:**
  - Nothing is spoken after the panel closes.
  - One voice at a time.
  - The mic is released on every exit.
  - Chat's busy guards (no send while switching chats).
  - No shrimp emoji or dashes read aloud.
  - Works at every zoom and on phones.
- **Tests:** `speakable.test.js`, `turnDetector.test.js`, the slot in `features.test.js`, i18n in 4 locales.
- **GUI check:** Playwright's bundled Chromium with a fake microphone (`--use-fake-device-for-media-stream`), speech and chat calls stubbed. Desktop and phone, both themes; every state (no engine, listening, thinking, speaking, error).

## Phase 2 (next): Live mode
A "Live" switch in the voice panel when a Gemini or OpenAI key exists:
- **Gemini Live:** the cheapest, with a free tier. Uses an ephemeral token from the local server, so the key never reaches the page.
- **OpenAI gpt-realtime-mini:** the alternative.
- **Server:** a WebSocket relay in `src/server/` (desktop) that holds the key.
- **Price:** shown before starting.
- **Learner context:** the same system prompt and learner context are sent as instructions.
- **Cards:** made after the session from the transcript (Live models can't emit the card widget reliably).

## Phase 3 (later): On the computer
An optional download in Settings, which also needs an onboarding mention:
- **Helper process:** a native whisper.cpp (or Moonshine) + Kokoro TTS + Ollama, with model size picked from the machine's memory.
- **Fallback:** cloud speech for Japanese and Chinese voices until a better local voice exists.

## Done when (phase 1)
Checked on 2026-11-15: fake microphone, OpenAI stubbed, Playwright on port 3001.
- [x] **The core loop:** the 🎙️ button in Chat opens the voice panel. A spoken turn goes through the real Chat and is saved. Ebi's reply is spoken. The conversation shows in the chat afterwards.
  - Proof: transcription, then chat, then speech calls seen; the chat shows both turns.
- [x] **Controls:** Interrupt, pause and end work, and the mic and speech stop on every exit.
- [x] **No engine:** the panel explains, with a button to Settings (tested with an Anthropic-only key and no browser recognizer).
- [x] **Failed replies:** a failed reply (quota) is shown, never spoken; no speech call is made.
- [x] **Automated checks:** unit tests (20), `npx vitest run` (3,956) and `npx vite build` green.
- [x] **Screenshots looked at:** desktop light and phone dark, plus no-engine (dark) and error (light). The phone layout was fixed to fit without scrolling.
- [x] **Independent review:** 14 findings. Fixed:
  - talk heard at once after Interrupt;
  - numbers ("TLS 1.2", "192.168.1.1", "e.g.") never split;
  - next sentence made while one plays;
  - errors not spoken;
  - a busy chat is waited for;
  - the composer photo is not sent with a voice turn;
  - real level-meter flag, with an AudioContext resume and close;
  - learned language for the browser recognizer and device voice;
  - no paid transcription after close;
  - talk cap counted from speech;
  - the ring button is disabled while working;
  - tables and inner underscores read correctly;
  - cost math moved to a tested pure function.

## Still open (phase 1)
- **Save wait:** a reply is spoken only after the chat is saved to disk (adds the save time on a slow share).
- **Web search by voice:** an "offer to search" can't be accepted by voice; tap it in the chat.
- **Focus:** keyboard focus isn't moved to the new main button when the phase changes.
- **Spending without opt-in:** voice mode is not behind the "optional features" switch. It spends speech on the user's key only after a click, with the price shown. Owner's call.
