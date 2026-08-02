## 6. Cross-Model Review — Post-Deep-Dive (automatic after Deep Dive)

After the swarm synthesis scores are updated, run a cross-model review through an independent OpenAI frontier model — GPT-5.5 by default, a *different lab* than ProveIt's own Claude, which is the entire point of a cross-model check. This catches gaps, bias, logical leaps, and contradictions that a single model might miss. The reviewer is configurable via `PROVEIT_REVIEW_MODEL` / `PROVEIT_REVIEW_EFFORT`; the default tracks the current OpenAI frontier (see `docs/frontier-snapshot.md`).

### Step 1: Check for API key

If `OPENAI_API_KEY` is not set in the environment, skip this phase with:
> "Cross-model review skipped — no OpenAI API key found. Add OPENAI_API_KEY to a `.env` file (this directory or the ProveIt plugin's own `.env`, i.e. `${CLAUDE_PLUGIN_ROOT}/.env`) or export it, then it runs automatically."

### Step 2: Determine review round number

Glob for `review-*.md` in the current directory. Count existing files, add 1 to get N.

### Step 3: Prepare review input

Concatenate the contents of:
- `discovery.md`
- The latest `swarm-N-synthesis.md`

### Step 4: Run the review script

Shell out to the review script, piping the concatenated content:

```bash
cat discovery.md swarm-*-synthesis.md | node "${CLAUDE_PLUGIN_ROOT}/scripts/openai-review.mjs"
```

Capture the output.

### Step 5: Write review file

Write the output to `review-[N].md` with this header prepended:

```markdown
# Cross-Model Review [N]: Post-Swarm
Date: [date]
Model: [cross-model reviewer — GPT-5.5 by default; whatever ran is echoed to stderr by the review script]
Reviewing: discovery.md, swarm-[N]-synthesis.md

[script output here]
```

### Step 6: Present to PM

Tell the PM:

> "I ran a cross-model review through an independent OpenAI model (GPT-5.5). Here's what it flagged:"
>
> [Summarise CRITICAL and NOTABLE findings — skip MINOR unless there are no higher-severity findings]
>
> "Full review is in `review-[N].md`. Want me to address any of these before we continue?"

### Step 7: Incorporate CRITICAL findings

If any findings are rated CRITICAL, factor them into the confidence scores before proceeding. Update `discovery.md` scores and explain the adjustment to the PM.

Update `discovery.md` Research Files section:
```
- review-[N].md — Cross-model review: post-swarm ([date])
```

---

## 6.5. Pre-Mortem & Kill Criteria (automatic after Cross-Model Review)

The cross-model review catches single-model bias. The pre-mortem catches *the founder's own bias* — the things they're not asking because they want the answer to be yes. This phase produces falsifiable kill criteria so the PM has a real "stop" condition, not just a wish-list of "things to validate".

**Frameworks this phase applies:**
- **Annie Duke — Thinking in Bets / Quit:** every "go" decision is a bet under uncertainty. The pre-mortem asks: under what circumstances would I be glad I quit? What's the falsifiable signal that would tell me to stop? Annie's central point — most people quit too late, not too early — applies directly to product validation.
- **Shreyas Doshi — Pre-mortem framework:** imagine it failed; reason backwards. Distinguish 'inevitable' failures (the idea is wrong) from 'avoidable' ones (the execution would be).
- **Sean Ellis — PMF survey threshold:** make at least one kill criterion the 'very disappointed' bar. If it can't be hit, walk.
- **Marty Cagan — Death by features:** the most common quiet death is shipping more without adding more value. Watch for it.

Frame this to the PM:

> "Now I want to spend 10 minutes on the pre-mortem. Imagine it's 12 months from now and this idea is dead. What killed it? I'll write the failure scenarios out, then turn each one into a falsification test you can actually run — with a date by which you'd kill the idea if the test fails. This is the Annie Duke / Shreyas Doshi pre-mortem, applied to your idea."

### Step 1: Determine pre-mortem round number

Glob for `pre-mortem-*.md`. Count, add 1 to get N.

### Step 2: Generate the pre-mortem document

Synthesise from `discovery.md`, latest `research-*.md`, and (if it exists) the latest `swarm-*-synthesis.md` and `review-*.md`. Use Lenny's Podcast (`mcp__lenny-transcripts__search_transcripts`) to pull failure-mode patterns from analogous products. Suggested searches:
- "pre-mortem" (Annie Duke is the top match in Lenny's archive)
- "tarpit" (Dalton Caldwell — 'just don't die')
- "thinking in bets" (Annie Duke — falsification + when to quit)
- "why startups fail" + the idea's specific category for category-specific failure modes

Required structure for `pre-mortem-[N].md`:

```markdown
# Pre-Mortem [N]: [Idea Name]
Date: [date]

## The story of how this failed

[2-3 paragraph narrative: imagine it's 12 months from now and this is dead. Tell the story of what happened — written as if it has already happened, past tense. Be specific. Reference the actual market dynamics, competitor moves, and user behaviour patterns surfaced in research and the swarm.]

## The 3 critical bets you are making by proceeding

For each bet:
- **Bet:** [the assumption underneath]
- **Why it's load-bearing:** [what depends on it being true]
- **Falsification test:** [a specific, runnable experiment that would prove the bet wrong]
- **Pass criteria:** [what would need to be true to count as 'still alive']
- **Kill date:** [calendar date by which the test must produce a result]

[List exactly 3 — pick the 3 highest-leverage bets, not all possible ones]

## Failure modes ranked

| # | Failure mode | Likelihood | Severity | Detectable by |
|---|---|---|---|---|
| 1 | [scenario] | [Low/Med/High] | [Low/Med/High] | [signal that would surface this in time] |

[3-5 modes. Cite Lenny guests where they've seen the failure mode before — e.g. "Shreyas Doshi described this exact dynamic on episode XYZ".]

## Kill criteria

A list of conditions that, if met, mean stop building. State each as a measurable condition with a date:

- "If [metric] is below [threshold] by [date], kill."
- "If [signal] appears within [window], kill."

[3-5 kill criteria — non-overlapping with the falsification tests above. These are the *operational* stop conditions, while the bet tests are *strategic*.]

## What would need to be true to keep going

The inverse of the kill criteria. Write it as a "we keep going if:" list. This is the explicit list of things the PM is committing to monitor.

## Confidence after pre-mortem

| Score | Before | After | Why |
|---|---|---|---|
| Desirability | X/10 | Y/10 | [reason — usually unchanged unless pre-mortem surfaces new evidence] |
| Viability | X/10 | Y/10 | [reason] |
| Feasibility | X/10 | Y/10 | [reason] |
```

### Step 3: Present to the PM

Show the 3 critical bets and the kill criteria explicitly. Don't just summarise — read out each falsification test and its kill date. Ask: "These are the things you're betting on. Are any of these wrong, missing, or framed badly?"

The PM may correct, add, or remove items. Update `pre-mortem-[N].md` accordingly.

### Step 4: Update discovery.md

Add to Research Files section:
```
- pre-mortem-[N].md — Pre-mortem & kill criteria ([date])
```

Add a new top-level section to `discovery.md` called "## Live bets" containing the 3 critical bets with their kill dates. This is the section the PM should be able to glance at any time and know what they're committing to.

If the pre-mortem changes any confidence scores, update them in `discovery.md`'s Confidence Score block with a note: `Adjusted post-pre-mortem: [reason]`.

---

## 6.7. Wave 3 — Scenario Planning & Experiment Design (optional, offered after Pre-Mortem)

**The first three waves are about gathering evidence; Wave 3 is about acting on it.** Discovery → Research → Swarm + Pre-Mortem produce strong conviction in either direction (go or kill). Wave 3 turns that conviction into runnable experiments and probability-weighted scenarios. Most validation tools stop at "here's what the data says". Wave 3 is what makes ProveIt actually de-risk the idea, not just describe it.

This phase is **optional**. Offer it after the pre-mortem; the PM can take it or skip to BrandIt / Outputs.

### Frameworks this phase applies

- **Annie Duke — *Thinking in Bets* / probabilistic decision-making:** every "go" is a bet under uncertainty. Decision quality and outcome quality are different — Wave 3 produces probability-weighted scenarios so the PM is making a *good decision under uncertainty*, not gambling on a single point estimate.
- **Camille Fournier — Scenario planning in engineering orgs:** strong Lenny coverage. The discipline of imagining 3 specific futures (best / expected / kill) rather than one rosy projection.
- **Mike Krieger (Anthropic CPO, ex-Instagram) — AI product scenario thinking:** for AI-powered ideas, the foundation-model roadmap is one of the largest input variables. Scenario-plan against the next 12-month model trajectory.
- **Lane Shackleton — Experiment design:** the discipline of designing experiments that produce a binary yes/no per assumption, not a vague "we learned a lot".
- **Teresa Torres — Assumption-test design:** her continuous-discovery framework explicitly produces test artefacts (interview scripts, prototype variants), not just lists of unknowns.
- **Sean Ellis — PMF survey instrument:** the actual survey copy is the artefact, not "we should run a PMF survey".

### Frame this to the PM

> "Want to spend another 20 minutes turning this into runnable experiments? I'll generate 3 future scenarios — best case, expected case, kill case — with honest probability weights, and then write the actual artefacts you'd need to run the next experiments: landing page copy, interview scripts, pricing-test pages, technical spike specs. This is the difference between 'here's what to validate' and 'here's the email you can send tomorrow'."

If the PM says yes, proceed.

### Step 1: Determine round number

Glob for `scenarios-*.md`. Count, add 1 to get N.

### Step 2: Generate `scenarios-N.md`

Synthesise from `discovery.md`, latest `research-*.md`, latest `swarm-*-synthesis.md`, latest `review-*.md`, latest `pre-mortem-*.md`. Use Lenny's MCP (`mcp__lenny-transcripts__search_transcripts`) for relevant scenario-planning content (suggested queries: "scenario planning", "thinking in bets", "probability", "AI product scenarios").

Required structure for `scenarios-N.md`:

```markdown
# Scenarios [N]: [Idea Name]
Date: [date]
Methodology: Annie Duke probabilistic framing + Camille Fournier scenario planning + Mike Krieger AI-trajectory thinking (where applicable)

## Three plausible futures (12-month horizon)

### Scenario A — Best case
**What happens:** [2-3 sentences. Specific market/competitor/user moves, not vague optimism.]
**Probability:** [X%] — [reason for this number]
**Confidence at end of year:** D[X]/V[X]/F[X] (vs current D[Y]/V[Y]/F[Y])
**The one bet that has to come right:** [from the 3 critical bets in `pre-mortem-N.md` — which one drives this scenario?]

### Scenario B — Expected case
**What happens:** [2-3 sentences.]
**Probability:** [X%]
**Confidence at end of year:** D[X]/V[X]/F[X]
**The one bet that has to come right:** [...]

### Scenario C — Kill case
**What happens:** [2-3 sentences. The pre-mortem narrative made concrete.]
**Probability:** [X%]
**Detection signals:** [specific metrics or events that would confirm this scenario is unfolding]
**The one bet that breaks:** [...]

**Probabilities must sum to 100.** Force the discipline. If you find yourself wanting to assign 60/30/10 because the PM is enthusiastic, that's exactly the bias the scenario phase is designed to surface.

## Decision quality assessment

Per Annie Duke: a good decision is one that makes sense given what you knew at the time, regardless of outcome. Given the probability weights above:

- **Expected value of proceeding:** [if outcomes are quantified — e.g. £X if A, £0 if B, -£Y if C — what's the EV?]
- **Worst-case downside:** [Scenario C's actual cost — time, money, opportunity]
- **Asymmetric upside check:** [is there a scenario where the upside is 10x the downside? If so, even low probability is a buy.]

## Experiment artefacts

For each of the 3 critical bets in `pre-mortem-N.md`, generate the actual artefacts the PM would need to run the next experiment. Don't just describe — write the artefact.

### Bet 1: [The bet from pre-mortem]
**Falsification test:** [from pre-mortem]
**Artefact required:** [landing page / interview script / pricing test / technical spike / etc.]

#### [Artefact title — e.g. "Landing page copy for [URL]"]

[Actual copy. Real headline. Real body paragraphs. Real CTA. Real fake-pricing if it's a pricing test. Production-ready, not template-with-placeholders.]

#### [Optional second artefact for the same bet]

[E.g. interview script with the actual 8-12 questions, ordered, with prompts for follow-ups.]

### Bet 2: [...]

[Same structure.]

### Bet 3: [...]

[Same structure.]

## Sequencing — what to run first

The 3 experiments cost different amounts of time/money and produce different information. Order them by **information value per unit cost**:

| Order | Experiment | Cost (time + £) | Information value | Decision it informs |
|-------|------------|-----------------|-------------------|---------------------|
| 1 | [Cheapest highest-info] | [...] | [...] | [Which bet it tests] |
| 2 | [...] | [...] | [...] | [...] |
| 3 | [Expensive or low-info; deprioritise] | [...] | [...] | [...] |

## What this updates

After the experiments run, update `discovery.md` Confidence Score block AND `pre-mortem-N.md` Live Bets section with the new evidence. If a bet falls (test failed, pass criteria not met, kill date reached): execute the kill criterion. Don't quietly extend the deadline — that defeats the whole point of having one.
```

### Step 3: Present to the PM

Show the scenarios summary table (probabilities + the one bet for each scenario), the EV calculation, the experiment sequencing table. Do NOT paste all the artefacts inline — they're long, they're for the PM to copy out of the file. Just tell them which artefacts were generated and where.

> "Three scenarios written to `scenarios-[N].md`. Probabilities sum to 100% — A: [X]%, B: [Y]%, C (kill): [Z]%. Generated [N] experiment artefacts: [list]. The cheapest highest-information experiment to run first is [name] — that artefact starts at line [L] of the file."

### Step 4: Update `discovery.md`

Add to Research Files section:
```
- scenarios-[N].md — Wave 3 scenarios + experiment artefacts ([date])
```

Add a new "## Wave 3 sequencing" section with the experiment order and decision criteria so the PM has a glanceable next-action list.

---
