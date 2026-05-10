# Pre-Mortem 1: ProveIt GTM (Profile-primary launch)
Date: 2026-05-10
Anchored: Annie Duke (Thinking in Bets), Shreyas Doshi (Pre-mortem framing)

This document pre-commits the kill criteria for the 30-day launch sequence. It is signed by Claire, dated, and saved here so that "future Claire on day 30" can be held to "current Claire on day 1."

---

## The story of how this fails (Annie Duke pre-mortem)

It is day 30. Three Substack posts are published. A WoZ test ran with 7 friends. Substack sits at 73 subscribers — most from Claire's warm network. Zero strangers paid. One friend paid £4.99 out of social obligation; the bundle email arrived; Claire never heard about it again. No DMs from hiring managers. No consulting inquiries. The two LinkedIn posts got 41 and 19 reactions respectively, mostly from former colleagues. The Hacker News Show HN landed at rank 47, then sank. The PostHog-thesis Substack post was kindly received by three people in Claire's network who sent supportive replies.

Claire opens this document at 8pm on day 30. The kill criteria are unambiguous. She does not hit them. The internal pull is to *re-frame* — *to call this "early signal," to extend the runway by another 30 days, to add features, to write a fourth post that explains things better.*

This document exists to make that re-framing visible as the rationalisation it is.

---

## The 3 critical bets (Annie Duke "what would have to be true")

For ProveIt-as-launched to succeed in the Profile-primary frame, three things all have to be true. The launch is the test. Each is independently falsifiable.

### Bet 1: "PMs in Claire's broader network share content they find useful with one another."

If this is true → first 100 subscribers come within 14 days of Post #1 going live, mostly via warm-network reshares + LinkedIn comments + a few cold Notes finds.
If this is false → Post #1 sits at 17 reactions, the warm network engages but doesn't propagate.

**Falsification:** sub count + share-source attribution at day 14.

### Bet 2: "The 'active disagreement' positioning is a recognisable, share-worthy hook for PMs who haven't met ProveIt yet."

If this is true → at least one stranger DMs / replies / quote-tweets / comments on the *positioning itself* (not on Claire's reputation, not on the methodology list) within 21 days. Specifically: someone outside Claire's network names "tells you your idea might be bad" as the thing that caught their attention.
If this is false → 30 days pass with engagement but no one repeats the positioning back. The hook isn't catching.

**Falsification:** named-positioning-quoted-by-stranger by day 21.

### Bet 3: "There exists ≥1 person in Claire's reachable cohort who pays £4.99 or £9.99 specifically because the bundle output is valuable to them — not because they like Claire."

If this is true → at least one WoZ conversion that survives the social-obligation filter. Test: when asked at debrief, the buyer can articulate a specific use they made of the bundle (showed the spec.md to engineering, used the Gamma deck in a stakeholder meeting, sent the design-brief.md to a designer). Not "I just wanted to support you."
If this is false → 0 friends pay, OR 1-2 friends pay but cannot describe a specific use of what they got.

**Falsification:** ≥1 WoZ conversion + articulated use-of-bundle by day 14.

---

## Calendar kill criteria (the "we keep going if" test)

By **end of day 30 (June 10, 2026)**, ALL THREE must be true to continue investing primary time in ProveIt:

| # | Criterion | Threshold | Why this number |
|---|-----------|-----------|-----------------|
| 1 | Substack subscribers | **≥200** | 100 from warm network is achievable; 200+ implies content reached beyond it. Below 200 = content didn't propagate. |
| 2 | WoZ conversions (paid, not social-obligation) | **≥1, with articulated use of bundle** | One stranger-payment > five friend-payments. The use-articulation is the social-obligation filter. |
| 3 | Unsolicited inbound | **≥1 DM/email/reply** from a stranger asking to know more, try the tool, or talk | This is the Profile-primary minimum signal. Without it, profile-frame is not working. |

**If all three are true →** continue. Month 2 = Stripe subscription billing + Miro/Notion output artefacts + second amplifier push.

**If subscriber count <100 AND zero WoZ conversions AND zero inbound →** do not quit, but **do not add product features**. Re-write Post #1 from scratch with a completely different angle. Run another 30 days on content alone. Re-assess.

**If WoZ produces zero conversions but subs/inbound look good →** profile outcome works; commercial outcome doesn't. Keep writing. Re-investigate pricing separately. Do NOT build Stripe.

**If subs and conversions look good but zero inbound →** content is reaching people but Claire-as-creator isn't sticking. The Profile-primary frame is failing in its specific mechanism. Investigate before continuing.

---

## What "re-framing" looks like (Shreyas Doshi pre-mortem trap)

Annie Duke's specific concern: founders don't quit when they should. The day-30 trap will be one of these:

1. *"This is early signal — 90 days is more honest than 30."* **Rejection criterion:** the kill criteria were committed at day 0 to specifically avoid this re-framing. Honour them.

2. *"The content is good — I just need a viral moment."* **Rejection criterion:** if 4 weeks of consistent posting produced no viral moment, week 5 won't either. Either the angle is wrong or the audience isn't there.

3. *"I should add a feature — maybe Miro output unlocks it."* **Rejection criterion:** Tech Feasibility was clear. Miro/Notion output is month-2 work. Adding features in response to commercial under-performance is product-as-flinch.

4. *"Maybe the price is wrong — drop to £2.99."* **Rejection criterion:** WoZ tested £4.99 specifically. Lower prices won't fix a non-existent buyer; they'll just confirm one with even less commitment.

5. *"It's working, it's just slow."* **Rejection criterion:** "slow" is a verdict made AT day 90 or 180, not a hypothesis advanced AT day 30 to avoid acknowledging signal.

If a re-framing in any of these shapes appears at day 30, this document exists to make it visible as the avoidance it is.

---

## The 4th bet (the one nobody wants to bet on)

There's a fourth bet that doesn't fit the synthesis-recommended frame but should be named honestly:

### Bet 4: "Claire personally has the bandwidth to write three publishable Substack posts in 30 days while running the WoZ test, doing day-job work, and not burning out."

If this is true → all three posts ship at quality.
If this is false → the launch becomes "two posts, one of them rushed, no follow-up" — *which is the most likely actual failure mode that the validation has been politely not naming.*

**Falsification:** check on day 14. If Post #1 hasn't shipped or Post #2 isn't drafted, this bet is failing live and the launch needs to be re-scoped (e.g. fewer posts, or pushed by a week).

**Mitigation pre-commitment:** if day 14 shows the bet failing, switch to a 2-post 30-day plan (drop Post #2, keep Post #1 and Post #3-with-WoZ-data). One excellent Substack post + one evidence-backed follow-up beats three rushed posts.

---

## What the kill signals are NOT

To prevent moving the goalposts in either direction:

- **NOT a kill signal:** WoZ converts but at a different price than expected. (Find out what they'd actually pay; re-price.)
- **NOT a kill signal:** Subscribers under 200 but Post #3 is in active discussion with strong engagement. (The Notes-and-conversation is the leading indicator; subs lag.)
- **NOT a kill signal:** Hacker News post bombs. (HN is a low-downside bet; bombing is expected ~70% of the time.)
- **NOT a kill signal:** No paid subscribers (the Substack paid tier wasn't even enabled in the 30-day plan).

- **IS a kill signal:** All three success criteria miss with no plausible explanation — content was published, distribution was attempted, friends were asked, and nothing converted on any axis.
- **IS a kill signal:** Claire stops opening this document because the answer is uncomfortable.

---

## Sign-off

This pre-mortem is committed at the start of the 30-day launch sequence. The kill criteria above are the pre-committed contract between current-Claire and day-30-Claire. If the criteria don't hit, the honest move is to re-evaluate, not to extend the experiment by changing the rules.

Annie Duke's whole frame: founders quit too late, not too early. This document is the structural defence against quitting too late.

Day-30 assessment: scheduled for **June 10, 2026** (or nearest business day).
Re-read this document **before** doing the day-30 review. Read it cold, then read the data.
