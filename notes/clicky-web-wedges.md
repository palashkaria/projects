# Clicky-on-the-web — wedge analysis

_Working notes. Last updated 2026-04-27._

The premise: take what Clicky does on macOS (an AI buddy that lives next to your cursor, sees the screen, talks to you, points at things) and make it a `<script>` tag any site owner can drop in. Below: what we get for free from clicky, what's genuinely better on the web, and a ranked walk through six adjacent markets we could attack.

---

## TL;DR

- **The unfair advantage** is not voice or vision — it's that on the web we can read the **DOM directly**. Every adjacent player (DAPs, docs copilots, support agents) is either pixel-guessing or doing pure RAG chat. None ships a widget that genuinely *demonstrates on the page* via voice + DOM-aware highlighting.
- **The clearest white space is wedge #2 + #4 below**: "AI-native in-app guides" (post-Command-AI vacuum) and "embeddable AI teacher for tutorials/courses" (no Khanmigo-as-a-script-tag exists). Both are open, both have sympathetic buyers, both are distributable bottoms-up.
- **Avoid** support replacement (#6, Decagon/Sierra are eating this with $4.5B-val cheques) and accessibility overlays (#5, FTC fined accessiBe $1M in Jan 2025 — category is legally hazardous).
- **Onboarding DAPs (#1)** are fundable but a bad asymmetric fight against Pendo/Whatfix's enterprise sales motion. Better as a flank than a frontal.
- **Biggest unknown to validate before building**: is voice actually the right modality for a web widget, or does text-with-pointer feel less intrusive? Mac-Clicky is pinned to your screen alone; a website widget is a guest in someone else's house.

---

## What we inherit from clicky

Clicky's worker is essentially **transport-only** (~3 routes proxying Claude / AssemblyAI / ElevenLabs). All the "intelligence" lives in one big system prompt and Claude's response format. That's good news — most of it transfers.

Reusable as-is on web:
- **Worker** — same three routes, same API forwarding.
- **System prompt + voice conversation logic** — Claude behaves the same.
- **Voice pipeline** — AssemblyAI websocket STT, Claude SSE, ElevenLabs TTS. All web-compatible already; only audio capture changes (`AVAudioEngine` → `MediaRecorder`).
- **The `[POINT:x,y:label]` trick** — Claude embeds pointing instructions in its text response after the spoken part. On web, `x,y` becomes a CSS selector or coordinate within the page. Cleaner than tool-use because it streams alongside speech.
- **Conversation history** (last 10 turns, local) — trivial to port.

Mac-only, must rebuild:
- Screen capture (`ScreenCaptureKit`), overlay rendering (`NSPanel`), global hotkey (`CGEvent` taps), TCC permissions.

What's **genuinely better on the web** (the wedge):
- **Structured semantic DOM** — buttons have `role`, labels, `aria-*`, alt text. We can target the "Submit" button by meaning, not by pixel proximity. No JPEG compression artefacts; no font rendering uncertainty.
- **Inject directly** — the buddy can highlight, scroll-to, or even fill an input. The pointer becomes a *capability* not just an animation.
- **No permission dance** — mic permission is a single browser prompt. No "Screen Recording" TCC popup.
- **No screen capture needed** for most tasks — the model can read serialised DOM/text state, which is cheaper and lower-latency than vision.

What clicky **doesn't yet do** (opportunity for us): take action on the user's behalf. It only points and speaks. A web version with even minimal "click that for me" support is meaningfully more powerful.

---

## Six wedges, ranked by attackability

### #1 ★★★★★ — Embeddable AI teacher for tutorials & learning sites

**Who's there now:** Scrimba (interactive screencasts), Codecademy (text + auto-grader), Boot.dev, Brilliant, Khan Academy's Khanmigo. **All walled gardens.** Khanmigo lives inside Khan Academy. Scrimba's AI lives inside Scrimba. There is no "Stripe for tutorials" — no script tag a course creator can drop on their own site to get a Khanmigo-style buddy.

**AI-native demonstrative widget:** Open. Truly nobody.

**Buyer:** Course creators, bootcamps, tutorial-style docs sites, indie educators on Teachable/Thinkific. Technical enough to install a script tag. Motivated to differentiate against the walled gardens.

**Why it works for us:**
- The buddy modality is *native* to learning — a chatty AI teacher doesn't feel like Clippy when you've literally come to the site to learn.
- DOM access lets the buddy verify the user actually completed the step (e.g. "OK now you've added the import — try running it"), not just narrate.
- Distribution is creator-economy / dev-PLG, not enterprise sales. Manageable for a small team.

**Risks:**
- Course creators are price-sensitive; ARR per customer is small.
- "Voice" in a tutorial may feel less universal than "text + pointer" — worth A/B-ing.

**What to validate first:** Get one real bootcamp or one indie course creator to use it on a live tutorial. Measure completion rate vs. their existing content.

---

### #2 ★★★★★ — AI-native in-app guides (post-Command-AI vacuum)

**Who's there now:** Pendo, Appcues, Userpilot, Whatfix, Chameleon — all bolt-on AI on top of authored step sequences. Command AI (the closest thing to "AI co-browse") got acquired by Amplitude in Oct 2024 and folded into Amplitude Guides. Glassbox does enterprise co-browse but tied to session replay.

**AI-native demonstrative widget:** Essentially unoccupied as a packaged product. Several incumbents have *demoed* it; nobody ships it.

**Buyer:** Indie SaaS, PLG companies under Pendo's $20K floor. Product/CS/enablement leads.

**Why it works for us:**
- The pitch is sharp: "skip the authoring step entirely — the AI watches the DOM and improvises a walkthrough on demand." That's a step-function, not a feature.
- Indies don't have authoring teams; for them "AI watches and improvises" is the only viable option.
- Pendo's floor is high enough that there's room below.

**Risks:**
- Pendo, Whatfix, and Amplitude (post-Command-AI) will eventually ship this. Their authoring-tool DNA makes them slow but not absent.
- Cheap-tier customers churn. PLG-bottom needs aggressive land-and-expand into the mid-market.

**What to validate first:** Can the AI actually improvise a useful walkthrough on a SaaS product it's never seen, with only DOM access and a one-paragraph "what does this app do" hint?

---

### #3 ★★★★ — Docs copilot that demonstrates on the live product (not on docs)

**Who's there now:** Mintlify ($300/mo+ tiers, customers include Anthropic, Cursor, Vercel, Perplexity), Inkeep ($13M seed Sept 2025, multi-agent orchestration), Kapa.ai (200+ customers incl. OpenAI, Monday), Mendable. **All strictly RAG chat.** None of them does "show me how to do this on the actual product."

**AI-native demonstrative widget:** Crowded for chat, open for demonstration.

**The twist:** Most of these widgets live on the customer's *docs* site. The interesting move is to embed on the customer's *product* — "ask the docs while inside the app, and the AI demonstrates on the page you're already on." Mintlify customers are a tantalising adjacency — they already trust an AI doc widget; selling them an in-product version is one degree of separation.

**Buyer:** DevRel / docs / support leads at developer-tooling companies.

**Risks:**
- Inkeep's multi-agent orchestration could ship demonstration as a feature.
- Customer engineering may push back on a third-party widget mutating live product DOM.

**What to validate first:** Whether a Mintlify customer would let us embed on their product (not just their docs). One yes here is worth a thousand cold pitches.

---

### #4 ★★★ — Onboarding DAP replacement (the frontal assault)

**Who's there now:** Pendo (6-7 figure ACVs), Whatfix (700+ enterprise customers, 80+ F500), Appcues, Userpilot, Chameleon, WalkMe (acquired by SAP 2024). All shipping bolt-on AI for copy generation and flow analytics. None shipping demonstrative voice.

**AI-native demonstrative widget:** Same gap as #2, but at enterprise scale.

**Why it's a worse fight than #2:** Same product, but the buyer is enterprise procurement. Pendo and Whatfix have field sales; we don't. Better to win bottoms-up via #2 and let the enterprise pull come *to us* over time.

**Verdict:** Treat as a long-tail land. Don't go direct.

---

### #5 ★★ — Accessibility companions

**Why it looks attractive:** Voice-driven page navigation, "talk to your screen reader", real unmet need. Academic projects exist (e.g. AI Screen Reader, 2025 — browser extension turning pages into dialogue).

**Why it's a trap:**
- The legacy overlay category (UserWay, accessiBe, EqualWeb) is **distrusted by the disability-advocate community** — they actively campaign against overlays.
- **The FTC fined accessiBe $1M in Jan 2025** for false WCAG-compliance claims. Category is now legally watched. Selling on "compliance" is risky.
- A new entrant would need disability-community endorsement before launch. Slow, political, and easy to get wrong.

**Verdict:** Avoid as a primary wedge. Could revisit once a primary product has earned trust and disability-community partners.

---

### #6 ☆ — Customer support replacement widgets

**Who's there now:** Intercom Fin ($0.99/resolution), **Decagon ($131M Series C June 2025; $250M round Jan 2026 at $4.5B val**; customers Hertz, Duolingo, Eventbrite), **Sierra (Bret Taylor; hit $100M ARR in 7 quarters Nov 2025**; outcome-based pricing), Ada, Maven AGI ($50M raise 2025).

**AI-native demonstrative widget:** All chat-first. Nobody is doing on-page demonstration.

**Why it's still a bad fight:** Capital intensity is brutal — Decagon at $4.5B and Sierra at $100M ARR are buying every enterprise CX seat going. Even if we have a better product modality (demonstration vs. chat), we don't have the salesforce to convert it.

**Possible flank:** "Support that *does* the thing for the user" rather than "support that *answers about* the thing" is a differentiated story. But the buyers (Head of CX) trust incumbents; an indie won't get the meeting.

**Verdict:** Avoid as a primary wedge. The technology could license into someone else's CX agent later (Sierra OEM?) but that's a different business.

---

### Cross-cutting threat: browser-side AI agents

**Who:** Anthropic Computer Use (vision-based), OpenAI Operator (their own browser, multi-step tasks), Browser Use (open-source), BrowserOS, Adept (status uncertain).

**Why they matter:** These are *user-side* agents — the user runs them, not the site owner. They're a **flanking** threat to support widgets ("user just runs an agent instead of asking your bot") but **not** to a teacher/walkthrough widget that the site owner installs and the user benefits from passively. They could even become the substrate — our widget could call Computer Use under the hood when DOM-only isn't enough (e.g. iframes, canvas, third-party embeds).

**Implication:** Don't worry about them as direct competitors. Watch for Operator-style agents being embedded as widgets — that would change things.

---

## Three concrete shapes we could ship

These are not commitments — they're "if we built this exact thing, what would it look like?"

### Shape A — "Khanmigo as a script tag" (wedge #1)
- Drop-in `<script>` for course / tutorial / docs sites.
- Site author writes a short "what this lesson teaches" prompt + optional checkpoints.
- Buddy walks the learner through the page, asks them to do things, verifies via DOM, gives feedback.
- Pricing: free under N learners/month, then $X/learner or $Y flat for course creators.
- Target first customer: 3-5 indie technical course creators (e.g. someone selling a Postgres course on Gumroad, a Remotion tutorial site, a shadcn-style docs site teaching React patterns).

### Shape B — "Improvised Pendo for indie SaaS" (wedge #2)
- Drop-in `<script>` for SaaS products under ~50 employees.
- No authoring step. Owner writes a one-paragraph "this is what Acme does" hint.
- User clicks the buddy, says "help me set up a webhook," buddy reads the DOM, talks them through it, points at the right fields.
- Pricing: free under N MAU, then $X/seat or % of revenue ramps.
- Target first customer: 3 PLG SaaS startups in our network. Anyone shipping a product whose first-time UX is "wat do I click."

### Shape C — "On-product docs assistant" (wedge #3)
- Sister product to Mintlify-style docs chat: "what if your docs widget could demonstrate inside your actual app?"
- Could literally start as a Mintlify integration partner ("Mintlify in-product mode").
- Target first customer: one current Mintlify customer with a strong DevRel motion (e.g. someone like Resend, Trigger.dev, Inngest).

The cleanest first cut is probably **Shape A** — sympathetic buyer, no enterprise procurement, voice-and-teaching feels native, and the buddy can be slightly rough without enterprise-grade reliability requirements.

---

## Open questions to validate before building

1. **Voice on someone else's website — does it work?** Mac-Clicky is pinned to your private screen. A website widget is a guest in a stranger's house. Worth prototyping voice-vs-text-with-pointer with real users before betting on voice.
2. **Site-owner consent model.** Does the buddy get DOM-write permission by default, or only DOM-read? Most site owners will be wary of a third-party script that mutates the page.
3. **Latency budget.** Voice + STT + LLM + TTS is ~1.5–2.5s end-to-end on clicky's stack. On the web, can we get the perceived latency under 1s by streaming TTS audio (clicky doesn't — it buffers fully)?
4. **What pricing model maps to value?** Per-seat, per-resolution, per-tour-completed, per-MAU? Sierra's outcome-based pricing is the most differentiated CX play; could we apply something analogous to "lessons completed" or "onboarding tasks finished"?
5. **Who installs it on the customer side?** PM? Engineer? DevRel? CS lead? The answer changes everything about the GTM motion.
6. **Privacy / data handling.** Page DOM may contain PII. Even with a DOM filter, customers will ask. Need a clear story before first call.

---

## Sources

Research backing this doc (last verified 2026-04-27):

- Clicky internal: `/Users/splash/git/projects/external/clicky/` — README, worker/, leanring-buddy/
- Amplitude acquires Command AI (Oct 2024): https://amplitude.com/press/amplitude-acquires-command-ai
- TechCrunch on Amplitude × Command AI: https://techcrunch.com/2024/10/15/amplitude-buys-command-ai-to-bolster-its-app-engagement-offerings/
- Whatfix AI Agents launch (Sept 2025): https://www.prnewswire.com/news-releases/whatfix-launches-ai-agents-to-accelerate-business-outcomes-for-enterprises-302550035.html
- Mintlify: https://www.mintlify.com/ — Assistant docs https://www.mintlify.com/docs/ai/assistant
- Inkeep $13M seed: https://blog.amy.vc/inkeep-13m-seed-funding-round/
- Kapa.ai: https://tracxn.com/d/companies/kapa.ai
- Decagon $250M / $4.5B val: https://finance.yahoo.com/news/decagon-raises-250-million-valuation-161223745.html
- Sierra hits $100M ARR: https://techcrunch.com/2025/11/21/bret-taylors-sierra-reaches-100m-arr-in-under-two-years/
- Sierra pricing model: https://cheekypint.substack.com/p/bret-taylor-of-sierra-on-ai-agents
- Intercom Fin pricing: https://fin.ai/pricing
- Maven AGI $50M raise: https://www.prnewswire.com/news-releases/maven-agi-raises-50m-to-meet-surging-demand-for-enterprise-grade-ai-302484913.html
- accessiBe $1M FTC settlement (Jan 2025): https://techcrunch.com/2025/01/03/ftc-orders-ai-accessibility-startup-accessibe-to-pay-1m-for-misleading-advertising/
- Anthropic Computer Use: https://www.anthropic.com/news/3-5-models-and-computer-use
- Browser Use vs Computer Use vs Operator (Helicone): https://www.helicone.ai/blog/browser-use-vs-computer-use-vs-operator
- Khanmigo: https://www.khanmigo.ai/
- Scrimba: https://scrimba.com/

Some claims (e.g. exact funding rounds, current ARR) are point-in-time. Re-verify before quoting externally.
