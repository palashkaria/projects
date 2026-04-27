# Enterprise AI: fragmented data + agent-human collaboration

> Distilled from a WhatsApp conversation with Manav Shah (2026-04-22). Manav recently moved out of Nexus, is writing angel cheques and interviewing.

## The problem I'm circling

**Enterprise AI doesn't work because nobody has their data in order — and the people trying to deploy it can't tell when it's broken.**

That's the underlying thread. Everything else is me testing wedges into it.

## Two angles I'm exploring

### 1. Fragmented enterprise data → reliable agents (the infra angle)

Enterprise data lives everywhere: Salesforce, Google Drive, slide decks, sheets, relational DBs. Agents need to reason across all of it, and today they can't do it reliably.

Reference points:

- **[Contextual AI](https://contextual.ai)** — positioned itself as the "context layer" for enterprise AI agents; RAG-as-a-platform for regulated industries (Qualcomm, ShipBob). Acquired by Redo in March 2026 — so the independent-company version of this bet didn't survive. This is what I meant by "got windsurfed."
- **[PuppyGraph](https://www.puppygraph.com)** — a *virtual* graph layer over existing warehouses/lakes. No ETL, no data movement. "Seems inefficient but also a wedge" — the unlock is time-to-value, not query performance.

My instinct: the interesting part isn't graph-vs-relational, it's that data being *everywhere* (including unstructured sources Puppy doesn't touch) is the actual wall.

### 2. Agent-human collaboration → observe/improve loop (the workflow angle)

"AI champions" inside enterprises need to sell AI internally and need something to *show*. They need to see what agents are doing and close the loop back to improvement.

Shape: **connect data → AI → eval/observability, usable by non-devs.**

**Manav's pushback (worth taking seriously):**
> "Historically not been a massive unlock to give tech powers to non-tech personas."

Low-code / BI-for-everyone tools have a graveyard.

**My counter, where the real idea lives:** it's not about *replacing* technical work — the "connect data" part probably still needs engineers. The wedge is in the **observe → improve loop** where tech and non-tech people *collaborate* on the same artifact. Non-tech owns the eval/judgment side; tech owns the plumbing.

## What's actually sharp here

The most non-obvious thing: the interesting question is **how tech and non-tech collaborate on the observe → improve loop**, not which persona "owns" the tool. Everything else is the well-trodden RAG / context-layer / observability space.

That collaboration framing is the differentiated angle — and it's also the one where Manav's "tech powers for non-tech" critique *doesn't* apply, because I'm not replacing the engineer, I'm giving them and the business owner a shared surface.

## What's still unresolved

- **Who buys it.** "AI champion" is a buyer persona only in companies that have one. Mid-market vs. F500 matters a lot here.
- **Wedge vs. platform.** Observability is a feature; the eval-loop collaboration surface could be a product. Which end do I start from?
- **Data connectivity.** If I need to solve fragmented data *and* the collaboration loop, that's two hard problems. Contextual AI tried to own both and it didn't hold as a standalone company.

## Next move

Manav offered customer intros to validate. That's the right next step — I have a shape, not a problem statement yet. Talking to 5–10 AI champions will tell me which of the two angles is real.

## Other thread

Manav also asked how [root.vc](https://root.vc/) was made (the site itself). Not core to the thesis but worth noting — Root Ventures is a seed-stage deep-tech firm (SF, founded 2013, ~50 portfolio companies).

---

**Tagged for follow-up:** a16z Speedrun (was looking at it when Manav messaged — fits this kind of bet).
