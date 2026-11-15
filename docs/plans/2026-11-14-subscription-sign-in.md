# Use an AI subscription instead of an API key (2026-11-14)

## Verdict: what each provider allows (checked 2026-11-14, official pages first)

| Provider | Can Ebiki use the user's subscription? | Source |
|---|---|---|
| **OpenAI (ChatGPT Plus / Pro)** | **YES**, through OpenAI's official "Sign in with ChatGPT" plan usage. Open to open-source projects and personal projects that run locally, with no approval step. | developers.openai.com/cookbook/articles/sign-in-with-chatgpt; /siwc/quickstart ("ChatGPT plan usage is available to all open-source partners and selected private clients"); /siwc/token-sharing-open-source/* |
| **Anthropic (Claude Pro / Max)** | **NO.** "Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, Max, or Ultra plan credentials on behalf of their users." Tools that did it were blocked (Jan 2026) and some accounts were banned. | code.claude.com/docs/en/legal-and-compliance; code.claude.com/docs/en/agent-sdk/overview |
| **Google (Google AI Pro / Ultra)** | **NO.** Reusing Gemini CLI's Google login from other software "may be grounds for suspension or termination of your account", and paying subscribers were suspended for it. Gemini API OAuth exists, but it bills a Cloud project, never the subscription. AI Pro/Ultra include monthly Google Cloud credits, which can pay for an ordinary API key. | geminicli.com/docs/resources/tos-privacy (Apr 10, 2026); aistudio.google.com/docs/google-ai-plans; blog.google (Jan 27, 2026) |
| **xAI (SuperGrok / X Premium)** | **NOT YET.** Only a few named tools (OpenCode, Kilo Code, Warp) can sign in, through xAI's own shared login client. xAI publishes no way for other apps to register, so copying it would mean pretending to be xAI's own tool. | x.ai/news/grok-opencode (May 21, 2026); docs.x.ai |

**Rejected on purpose:**
- Reusing any CLI's login tokens (Claude Code, Codex, Gemini CLI, Grok). It breaks the terms and can get the user's account banned.
- Running the user's installed `claude -p` / `grok -p` as a child process:
  - Anthropic's Agent SDK page forbids apps offering "claude.ai login or rate limits for their products" unless approved.
  - xAI does not confirm subscription billing for it.
  - Both are coding agents with tool access. Card text and web results fed into them could make them run commands on the user's computer.

## What gets built: "ChatGPT plan" as a fifth way to run the AI

The user picks **ChatGPT plan** beside the four API-key providers, presses **Continue with ChatGPT**, signs in to OpenAI in their browser, and every AI feature runs on their plan.

### Pieces
1. **Server: `src/server/chatgptAuth.js` (+ test)**
   - PKCE S256, `state` and `nonce`.
   - A loopback listener on `127.0.0.1:1455/auth/callback`. A later sign-in may use another port.
   - Dynamic registration (`client_id=dynamic_agent_client` the first time, then the issued `oaiapp_...` id).
   - Token exchange and refresh, rotated and serialized.
   - Checks that the `chatgpt.tokens.use.direct` scope was granted.
   - Verifies the ID token against OpenAI's JWKS (signature, `iss`, `aud`, `exp`, `nonce`).
   - Revokes the token on sign-out.
   - Pure parts are exported and tested: URLs, request bodies, SSE parsing, error mapping, token record shape, JWT checks.
2. **Routes** (vite.config.js, under the `/api` guard, not in `DATA_ROUTES`):
   - `GET /api/chatgpt/start`: a 302 to OpenAI. Opened as a link, so Electron hands it to the real browser.
   - `GET /api/chatgpt/status`
   - `POST /api/chatgpt/signout`
   - `GET /api/chatgpt/models`
   - `POST /api/chatgpt/respond`
   - **Tokens never reach the page.** The server adds them to each request.
3. **Storage:** `chatgpt-auth.json` in the APP folder (this computer only, gitignored, watch-ignored, written atomically).
   - Never in the shared data folder: a sign-in belongs to one computer.
   - Never in `.env` or `keys.json`.
4. **Provider:** `PROVIDERS.chatgpt` (providers.js), `signIn: true`.
   - `call` posts to `/api/chatgpt/respond`.
   - `listModels` reads `/api/chatgpt/models`.
   - Presets are `auto`: the server uses the first model the account lists, and a model can still be picked per job.
   - The Model Advisor and daily upgrade check skip it.
   - The request follows OpenAI's preview limits:
     - `instructions` for the system prompt;
     - `input_image` parts;
     - `store:false`, `stream:true`;
     - none of the refused fields (`temperature`, `max_output_tokens`, ...).
5. **App wiring:**
   - While the server says signed in with plan usage, `apiKeys.chatgpt` holds a non-secret marker, so every "has a key" path works unchanged.
   - The key autosave posts it, and the server drops it (not in `ENV_VAR`), so it never reaches `.env` or the shared `keys.json`.
   - `checkKeyNow` asks the server instead of pinging.
6. **UI (the owner: obvious, plain, in onboarding):**
   - **One shared component, `src/components/ChatGptSignIn.jsx`**, used by the onboarding provider step AND Settings > AI & cost.
     - Signed out: the heading "Use your ChatGPT plan", OpenAI's wording, and the **Continue with ChatGPT** button.
     - Signed in: "Signed in as <email> · Using ChatGPT plan", plus **Manage usage** (chatgpt.com/settings/usage) and **Sign out**.
   - **Provider step note in plain words:** "Pay for ChatGPT Plus or Pro? Pick ChatGPT plan and use it instead of an API key. Claude, Gemini and Grok don't let other apps use their subscriptions, so they need an API key."
   - **First sign-in:** OpenAI's "You're using your ChatGPT plan" notice, shown once.
   - **Errors:**
     - The plan limit: "ChatGPT plan usage limit reached", with Manage usage.
     - Not eligible: the plan does not include app usage.
     - Signed out elsewhere: "Sign in again".
   - **All four locales.**
7. **Guard for the new onboarding rule:** `src/components/onboardingCoverage.test.js`.
   - Every provider (key or sign-in) must be reachable from the onboarding provider step.
   - Every shared setup component used in Settings (`LaunchModeOptions`, `ChatGptSignIn`) must also be used in `OnboardingWizard.jsx`.

### Not in scope
- Speech (OpenAI's plan usage takes no audio): Listen & Speak keep their API-key engines.
- Selling credits.
- The website sign-in flow.

## Eligibility, re-checked against OpenAI's pages (2026-11-14)
- **No approval step:**
  - The sign-in page says the direct flow "needs neither a client secret nor a partner API key". Registration happens in the user's browser through `dynamic_agent_client`.
  - Only paid or remotely hosted apps are sent to the interest form.
  - The quickstart's "open-source partners" is not defined as a program.
- **Who qualifies:**
  - The cookbook names "open-source projects, personal projects that run locally, and selected private apps".
  - Ebiki is free and runs locally, and its repo is public.
  - **But the repo has no LICENSE file**, so strictly it is source-available, not open source. Adding an open-source license makes the fit plain. That is the owner's decision.
- **Distribution:**
  - No user cap. The cookbook's own example is "friends with an eligible ChatGPT Plus or Pro plan can download your app".
  - Review openai.com/policies before distributing.
- **Plans:**
  - Plus and Pro are named.
  - Plus shares one five-hour usage limit across every app; Pro has none.

## Security review (summary)
- **Secrets:**
  - Tokens live only in the server's machine-local file, are never sent to the page, never logged, never in git, and `id_token_hint` is redacted.
  - Sign-out revokes them.
- **Loopback callback:**
  - Bound to 127.0.0.1 only, and accepts one path.
  - The `state` must match.
  - The listener closes after one callback or 5 minutes.
  - The success page is static, with no reflected input.
- **`/api/chatgpt/*`:**
  - Behind `apiRequestAllowed` (loopback Host, same origin, cross-site refused).
  - `start` changes nothing a stranger can use: the user still signs in at OpenAI.
- **Request bodies:**
  - The proxy builds its own body from known fields, so the page can't make it call another URL or endpoint.
  - The body is capped by `BODY_CAPS` (8 MB default).
- **ID token:** RS256 against OpenAI's JWKS. Any other algorithm is refused.

## Checks (Done when)
- [ ] `npx vitest run` green (new tests: chatgptAuth, providers, onboarding coverage); `npx vite build` ok.
- [ ] Driven in Playwright's bundled Chromium on port 3001, with OpenAI stubbed:
  - the onboarding provider step and Settings, signed out and signed in;
  - desktop and phone width, both themes;
  - screenshots looked at.
- [ ] An independent review of the diff.
- [ ] Project notes: an "AI providers" entry, plus the Porting list (desktop-only routes).
- [ ] Version bump (minor: a feature).
- [ ] NOT verifiable here: a real sign-in with a real ChatGPT account. It needs the owner's account; say so.
