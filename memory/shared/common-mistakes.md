# Common Mistakes

Patterns observed across ProveIt sessions that any agent (or Claude in this repo) should watch for.

---

## Framing a missing capability as a constraint without checking direction

**What happens:** When evaluating an external tool's integration surface, the agent assumes the relevant interface is the one the agent *wishes* existed (e.g. an API, a programmatic invoke). When that interface is missing, the agent labels the absence as a "constraint" or "limitation" — and writes downstream design (closing copy, handoff language, deferred-feature lists) around the apology.

**Root cause:** Default assumption is that integration runs in one direction (us → them). The agent doesn't ask "in which direction does the user actually move between these tools?" before grading the surface.

**Concrete instance (2026-05-10, Claude Design session):** Agent framed "claude.ai/design has no API or MCP" as a constraint blocking ProveIt's integration. User reframed: the Handoff-to-Claude-Code button means the integration direction is canvas → Code, not Code → canvas. ProveIt is the *destination*, not the caller. Phase 10 copy that had been written apologetically had to be rewritten as a confident round-trip.

**Prevention:**
- Before describing any external tool's surface as a "limit" or "constraint," explicitly write out **both directions** of possible flow (us calling them, them calling us, user moving manually between).
- For each direction, name the actual interface (API, button, paste, file drop, URL).
- The "missing" interface is only a constraint if the user's actual journey requires it. If users naturally flow the other way, there is no constraint — only a different shape.

**Detection:**
- Watch for hedging copy in deliverables: "since we can't programmatically...", "the limitation here is...", "manual paste is required because...". These phrasings frequently mark a one-direction analysis.
- If the design treats a tool exclusively as a destination users send things *to*, ask whether users ever come *from* it — and what they bring back.

---

## Defending a parallel approach when serial would have been cleaner

**What happens:** Agent runs N independent probes/tasks in parallel for wall-clock speed, then writes up the result as if parallelism was the right methodological choice — when in fact serial execution would have produced cleaner observations because each probe could have informed the next prompt.

**Root cause:** Parallel execution feels productive and impressive. The agent conflates "fast" with "good methodology" and post-hoc rationalises.

**Concrete instance (2026-05-10, Claude Design session):** 4 probes ran in parallel across browser tabs against claude.ai/design. The probes were independent enough that this worked, but probe 2's "branded deck" finding (brand specificity sharpens voice) could have informed probe 3's wireframe prompt design. The session note framed the parallel approach as a small data point in favour of "concurrent ProveIt invocations work" — which was a real but secondary observation. The methodological cost (no learning carry-over between probes) wasn't acknowledged.

**Prevention:**
- Before running N probes/experiments in parallel, ask: *would the output of probe K change how I'd prompt probe K+1?* If yes, run serially. If no (truly orthogonal), parallel is fine.
- When writing up a parallel run, include one sentence on what was *lost* by not running serially. If nothing was lost, the orthogonality claim is real.

**Detection:** In the writeup, look for sentences that defend the parallel choice ("the fact that this works without rate-limiting is..."). If the defence is post-hoc and the probes covered overlapping conceptual ground, the methodology was suboptimal even if the result was usable.

---

## Producing finished deliverables on a deferral the user is still pivoting on

**What happens:** User pivots scope mid-session (defer X → tackle X → defer X). Agent produces a polished deliverable (design doc, gh comment, scoping artefact) at the "tackle X" peak. The pivot back to defer arrives, the deliverable is now strictly an asset for next session — but the time spent on it ate session budget.

**Root cause:** Agent treats the user's mid-pivot decision as final and races to ship. Doesn't price in the cost of churn when scope is visibly oscillating.

**Concrete instance (2026-05-10, ProveIt session, issue #20):** User went defer → tackle → defer on the monetisation test inside one session. Agent produced full design + scoping for the monetisation test as a gh comment during the "tackle" phase. The artefact has independent value (it captures the design thinking for next session) but the total time cost of the back-and-forth wasn't surfaced.

**Prevention:**
- When scope visibly oscillates inside a single session, name it: "I notice this is the second pivot on #20 in 30 minutes — should we lock the call before I draft anything?"
- For an in-progress deliverable on an oscillating decision, prefer a *sketch* (bullet list, rough outline) over a *finished artefact* (gh comment, design doc) until the decision settles.
- If a finished artefact gets produced and the pivot then reverses, explicitly account for it in the retro: "this had independent value but cost N minutes of session budget."

**Detection:** Two pivots in opposite directions on the same scope inside one session is the threshold. If you see it, surface it.
