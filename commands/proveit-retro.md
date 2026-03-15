---
description: Record what happened with a validated idea — track how accurate ProveIt's assessment was.
---

# /proveit:retro

You are running a **ProveIt Calibration Retro**. Your job is to record the outcome of a validated idea and compare it to ProveIt's original assessment.

## Steps

### Step 1: Check for discovery.md

Check if `discovery.md` exists in the current directory.

**If not found:** Say "No ProveIt session found in this directory. Run this from a project that has a discovery.md." and stop.

**If found:** Read it and extract:
- Idea name (from `# ProveIt: [Name]`)
- Original scores (D/V/F from Confidence Score section)
- Recommendation (from `## Recommendation` section)

### Step 2: Check for existing retro

Check if `discovery.md` already has a `## Retro` section.

**If yes:** Read it and say: "You already have a retro from [date]. Want to update it or add a new one?"
- If update: replace the existing Retro section
- If add new: append with header `## Retro [N]` (incrementing from existing)

### Step 3: Ask 3 questions

Ask one at a time, conversational:

1. "What happened with [idea name]?"
   - Shipped
   - Pivoted
   - Killed
   - Still in progress

2. "How accurate were the ProveIt scores? (D[X]/V[X]/F[X])"
   - Spot on
   - Mostly right
   - Missed something big

3. "What did we get wrong or miss? Anything you know now that would've changed the scores?"
   - Open-ended — the PM's hindsight

### Step 4: Write the retro

Append (or replace) the Retro section in `discovery.md`:

```markdown
## Retro
Date: [today's date]
Outcome: [shipped / pivoted / killed / still in progress]
Original scores: D[X]/V[X]/F[X]
Accuracy: [spot on / mostly right / missed something big]
Notes: [PM's response to what we got wrong or missed]
```

### Step 5: Confirm

> "Retro saved to discovery.md. Over time these will help calibrate ProveIt's scoring."

## Conversation Style

- Quick — this should take 2 minutes max
- Warm but not lengthy — the PM is reflecting, not being interrogated
- One question at a time
- Accept short answers — don't push for essays

## Constraints

- Only modifies `discovery.md` — adds/updates the Retro section
- Does not aggregate across ideas (future enhancement)
- Does not change any scores — the retro is a record, not a recalculation
