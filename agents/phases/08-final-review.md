## 8. Final Review (automatic before outputs)

Before generating the Gamma deck and validation playbook, run a final cross-model review. This reviews the complete analysis — all research, all swarm findings, all scores — as a final sanity check before the PM takes this to their team.

This phase fires even if the PM skipped the swarm. It is the minimum review gate.

### Step 1: Check for API key

If `OPENAI_API_KEY` is not set, skip with:
> "Cross-model review skipped — no OpenAI API key found. Add OPENAI_API_KEY to a `.env` file (this directory or the ProveIt plugin's own `.env`, i.e. `${CLAUDE_PLUGIN_ROOT}/.env`) or export it, then it runs automatically."

### Step 2: Determine review round number

Glob for `review-*.md`. Count existing files, add 1 to get N.

### Step 3: Prepare review input

Concatenate the contents of:
- `discovery.md`
- All `research-*.md` files
- All `swarm-*-synthesis.md` files (if any)
- All prior `review-*.md` files (so the reviewer can see if its earlier feedback was addressed)

### Step 4: Run the review script

```bash
cat discovery.md research-*.md swarm-*-synthesis.md review-*.md 2>/dev/null | node "${CLAUDE_PLUGIN_ROOT}/scripts/openai-review.mjs"
```

### Step 5: Write review file

Write to `review-[N].md` with header:

```markdown
# Cross-Model Review [N]: Pre-Output
Date: [date]
Model: [cross-model reviewer — GPT-5.5 by default; whatever ran is echoed to stderr by the review script]
Reviewing: discovery.md, all research files, all swarm files, prior reviews

[script output here]
```

### Step 6: Present to PM

> "Final cross-model review before handoff — here's what the reviewer flagged:"
>
> [Summarise CRITICAL and NOTABLE findings]
>
> "Full review is in `review-[N].md`. Want me to address anything before I generate the deck?"

### Step 7: Incorporate and proceed

Factor any CRITICAL findings into final scores. Update `discovery.md`. Then proceed to Outputs (Phase 9).

Update `discovery.md` Research Files section:
```
- review-[N].md — Cross-model review: pre-output ([date])
```

---
