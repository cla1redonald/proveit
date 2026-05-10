# Expert Frameworks

Approaches that consistently produced better outcomes when used in this repo. These are durable methodology patterns, not one-off tactics.

---

## Observation-first before drafting integrations

**Context:** Designing an integration between ProveIt and an external tool (Claude Design, Gamma, BrandIt, Stripe, etc.). Especially when the external tool is new, evolving, or under-documented.

**The framework:**

1. **Probe the live surface** before drafting any integration design. Run N representative probes against the actual tool — same task family the integration will trigger — and capture observations (build time, output quality, edge cases, exports, hidden affordances) in a single observations doc.
2. **Separate observation from interpretation.** The observations doc records what was observed; integration design happens *after* the user reviews observations and the agent has synthesised. This protects against the agent drafting integration design from imagined or stale capability.
3. **Convert observations into a small set of integration questions** the user answers conversationally. Don't assume answers from the observations alone — surface trade-offs as questions.
4. **Write the design doc against those answered questions, not against the observations directly.** This forces the design to be grounded in user intent, not the agent's prior of "what would be cool."

**Evidence this works (2026-05-10 Claude Design session):**
- 5 probes (~25 min wall clock) surfaced features the agent would not have known to design around: Handoff-to-Claude-Code button, top-level Design Systems tab, Templates as a workflow primitive, the verifier subagent UX, the Wireframe-mode "interview first" default. Several of these directly changed the integration design (e.g. Phase 10 round-trip language).
- The probes showed brand-specific prompts produce dramatically richer output (Probe 2 vs Probe 1) — which became the structural argument for shipping `claude-design-prompts.md` populated with the PM's evidence rather than a generic instruction to "go paste discovery.md."
- Without the probes, the integration would have shipped with apologetic "no API, manual paste required" framing.

**Action for any agent:**
- For any integration involving an external tool, default to probe-first. Skip only if the tool is one the agent (and user) has years of operational experience with.
- Capture probes in `.session-state/<integration>-observations.md`. Keep observations and design as separate artefacts.
- Sequence: probes → observations doc → user-reviewed integration questions → design doc → ship.

**Caveat (see also: common-mistakes.md "Defending a parallel approach"):** Probes are often run in parallel for speed. This is fine when the probes are genuinely orthogonal (different output modes, different constraints). It is a methodological cost when probe K's findings would have sharpened probe K+1's prompt — in that case run serially even if it's slower.
