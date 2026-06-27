# Claude Design brief — ProveIt Studio ("The Case File")

Paste this into Claude Design on claude.ai to explore the visual direction. It's
pre-loaded with the real palette, type, and data so the output stays on-brand
instead of drifting to a generic dashboard. Iterate the *look* here; the working
app (data, markdown, scores) is wired separately in code.

---

Design a calm, dark, evidence-forward web app called **ProveIt Studio**. It's a
private tool for a product manager to read the outputs of "ProveIt" — a product-
validation process that pressure-tests an idea before it's built. ProveIt is a
truth-finder, not a cheerleader: it scores ideas on Desirability / Viability /
Feasibility (each out of 10), runs an adversarial "swarm" (bull vs bear vs devil's
advocate), gets a rival model to review the verdict, and surfaces **kill signals**
— the things that could end the idea — without hiding them.

**Concept: The Case File.** Each idea is a *case being built* — evidence gathered
over rounds, arguments for and against, a provisional confidence verdict, and the
threats that could overturn it. The app is: the registry of cases → the open file
→ the verdict.

## Palette (use exactly — this is the brand)
- Page background: `#0d141c` (midnight). Panels/cards: `#111a24` (ink). Elevated: `#1a2832`.
- Primary text: `#f0eee8`. Muted text: `#6a8a8a`.
- **Sole brand accent: copper `#c4956a`** (hover `#a87d55`). Use sparingly — verdicts, key actions.
- Secondary accent: river teal `#2a5a5a`.
- Evidence/verdict semantics ONLY on state, never decoration:
  strong/supported = pine `#5a7247`; weak = amber `#d4a857`; threat/contradicted/kill = muted red `#a04040`.
- Borders: warm white at low alpha, e.g. `rgba(224,217,207,0.12)`.

## Type
- Display: **Playfair Display** — case titles + the verdict only, large and tight. Used with restraint.
- Body/UI: **system-ui** stack.
- **Data layer: Fira Code (mono)** — every score, round number, date, threat tally, doc count is a mono readout. This is the signature type move: the app reads like an analytical instrument.

Avoid the cream-background + terracotta + big-serif-number look entirely. This is dark, precise, instrument-like.

## Signature element: the Confidence Spine
NOT three progress bars. ONE horizontal instrument: D · V · F as three weighted
segments on a single baseline. **Live kill-signals sit ON the spine as small copper
flag-notches**; resolved ones appear as faint struck-through ghosts. Conviction and
threat occupy the same object — you can't read the score without seeing what pulls
against it.

## Three screens

**1. Portfolio — the registry.** A dense, editorial *list* (not a card grid). Each row:
case title (Playfair), one-line descriptor + status, the Confidence Spine, a mono
D/V/F + Σ, live-vs-resolved threat tally, doc count. Sort by combined score.

**2. Reader — the open file.** Left rail = a **round timeline** (the case was built in
numbered rounds — Round 1: Discovery, Research; Round 2: Swarm, Synthesis; Round 3:
Review, Spec — order is real, not decorative). Main = rendered markdown at a
comfortable reading measure, Playfair headings, system-ui body. The verdict spine
pinned at the top.

**3. Synthesis — the verdict.** "The case for [idea]". The spine, large. Two columns:
LIVE threats vs RESOLVED (both shown — honesty is the point). The swarm's bull⟷bear
tension. A quiet "Synthesise with AI" action (computed later).

## Real data to populate
- **Holiday Portfolio** — travel personalisation engine. D8 V7 F8 (Σ23). Status: "Research Round 6 complete". 5 live kill signals (Mindtrip — serious; planning-to-booking leakage; NLP now table stakes; incumbent AI threat — monitored; tarpit flag), 3 resolved. 15 documents.
- **Experience Destination** — coaching & facilitation base in Scotland. D8 V7 F6 (Σ21). Status: "Business Plan". No live threats. 7 documents.

## Tone of voice
Calm, plain, evidence-forward. Sentence case. Verbs people recognise ("read the case",
not "view artifacts"). Kill signals are stated, never softened. Empty states invite
action. Nothing apologises.

## Quality floor
Responsive to mobile, visible keyboard focus, reduced-motion respected. Spend boldness
on the spine; keep everything else quiet.
