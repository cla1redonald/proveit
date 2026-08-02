## 7. Brand Identity (optional — gated on context type)

Branching logic — read `## Context type` from `discovery.md` first:

### If `contextType: existing` — skip BrandIt by default

The brand exists. Don't ask the PM to "create a brand identity for [parent brand]" — that's wrong-shaped. Instead offer a single optional path:

> "Your initiative is under [parent brand name] — I'll use the existing brand assets in the deck. If you want a sub-brand or campaign-specific extension (different palette, sub-tagline) on top of the parent, I can run a lightweight BrandIt-extend flow. Otherwise we go straight to the Final Review."

If PM says "extend":
- Run a compressed BrandIt that produces `brand-extension.md` instead of `brand.md`
- Output structure: just sub-name, campaign palette, campaign tagline, voice notes — no logo, no full token set
- Use the parent brand from `## Inherited assets` as input
- Time: 5-10 minutes, not the full 20

If PM says skip (default): continue to Phase 8. The Gamma deck uses inherited brand from `## Inherited assets`.

### If `contextType: new` — offer full BrandIt

> "Before I generate the deck — want to create a brand identity? It'll take about 20 minutes. You'll get a name, logo, colours, fonts, and design tokens. The Gamma deck will use your actual brand."

This is optional. The PM can skip it.

### Prerequisites (when running BrandIt)

Before offering this phase, check:

**`OPENAI_API_KEY`** — if not set, offer the brand flow without logo generation:
> "Logo generation requires an OpenAI API key. I can still create your brand identity — name, colours, fonts, and tokens — but without an AI-generated logo. Want to proceed?"

**`brand.md` already exists** — if the PM previously ran `/brandit`:
> "You already have a brand set up — [name]. Want to use it for the deck, refine it, or start fresh?"

If the PM says "use it," skip to Phase 8. If "refine" or "start fresh," continue below.

### What BrandIt does NOT produce — boundary with Claude Design and Gamma

BrandIt produces a **brand system** — not UX, not screens, not slides. The boundary table:

| Tool | Produces | Does NOT produce |
|------|----------|------------------|
| **BrandIt** (this phase) | Full brand system: name, tagline, palette (full neutral scale + semantic colours), typography pairing, logo PNG, design tokens (CSS + JSON), tone of voice | UX, wireframes, screens, marketing copy beyond tagline |
| **Claude Design** (Phase 10 next-step) | Decks, wireframes, screens, social cards, exploratory logo *directions*, any 2D layout. Reads BrandIt tokens or a saved Design System. | Brand system (no token export), engineering spec, marketing copy beyond what's in an artefact |
| **Gamma** (Phase 9 Output 1) | Stakeholder slides for the leadership / funding / team conversation. Uses brand for visual cohesion. | UX, engineering spec, brand identity, executable artefacts |

**Logo overlap nuance.** Claude Design and BrandIt overlap on logos. BrandIt produces *one* finished logo as part of a complete brand system. Claude Design produces *three exploratory directions* with rationale, in vector/HTML, in 3 minutes — useful when you want to choose between approaches before committing. They compose: run BrandIt for the brand system; if the PM wants to A/B the logo direction before locking it, the Claude Design "logos" prompt in Phase 10 is the way.

Do not let BrandIt drift into "let me sketch a home page" or "let me write the ad copy". Those belong to Claude Design and the marketing function respectively.

### Step 1: Brand Brief (3-4 questions)

Skip product/user questions — you already know from Discovery. Ask only brand-specific gaps:

1. "What personality should this brand have? More playful or more serious? More premium or more accessible?"
2. "Any names you've been kicking around, or should I start fresh?"
3. "Any brands you admire the look and feel of? Doesn't have to be in the same space."
4. "Anything you definitely don't want? (e.g. 'no blue — every competitor is blue')"

One question at a time. After 2-3 answers, reflect back: "So I'm hearing [X personality] for [Y audience]. Sound right?"

### Step 2: Generate Three Directions

Tell the PM: "Give me a couple of minutes — I'm putting together three brand directions."

Spawn 3 parallel Sonnet subagents via the Task tool in a **single message**. All use `model: "sonnet"` and `subagent_type: "general-purpose"`.

Each agent receives the brief context, contents of `discovery.md`, and their specific mandate.

**Direction A** (writes to `.brandit-temp/direction-a.json`):
> "You are generating the **BOLD, CONFIDENT** brand direction. Context: [BRIEF + DISCOVERY]. Your mandate: Create a brand that feels strong, assertive, and direct. Choose a punchy name, bold colours (strong primary, high contrast), a confident tagline, and a direct tone of voice. Use Google Fonts only. Write your output as JSON to `.brandit-temp/direction-a.json` using this structure:
> ```json
> {
>   "name": "BrandName",
>   "tagline": "One line tagline",
>   "personality": { "adjectives": ["bold", "confident", "direct"], "description": "One paragraph" },
>   "colors": {
>     "primary": "#hex", "secondary": "#hex", "accent": "#hex",
>     "neutral": { "50": "#hex", "100": "#hex", "200": "#hex", "300": "#hex", "400": "#hex", "500": "#hex", "600": "#hex", "700": "#hex", "800": "#hex", "900": "#hex" },
>     "success": "#hex", "warning": "#hex", "error": "#hex", "info": "#hex"
>   },
>   "typography": {
>     "heading": { "family": "Font Name", "weights": [600, 700] },
>     "body": { "family": "Font Name", "weights": [400, 500] },
>     "mono": { "family": "Font Name", "weights": [400] }
>   },
>   "toneOfVoice": {
>     "guidelines": "How we write",
>     "weSay": "Example phrase",
>     "weDontSay": "Example phrase",
>     "errorExample": "Example error message",
>     "welcomeExample": "Example welcome message"
>   },
>   "logoPrompt": "A DALL-E prompt for the symbol/icon. Describe the visual style, shape, mood. No text."
> }
> ```"

**Direction B** (writes to `.brandit-temp/direction-b.json`):
> Same structure, mandate: "**FRIENDLY, APPROACHABLE** brand direction. Warm colours, inviting name, conversational tone."

**Direction C** (writes to `.brandit-temp/direction-c.json`):
> Same structure, mandate: "**MINIMAL, PREMIUM** brand direction. Restrained palette, elegant name, refined tone."

Adapt mandates based on the PM's brief. If they said "nothing corporate," Direction C becomes "minimal, creative."

### Step 3: Domain Check

Use WebSearch to check availability of `.com`, `.co`, `.io`, and `.app` for each name. Results are indicative ("likely available" / "likely taken"), not guaranteed.

### Step 4: Generate Logos

After all 3 direction JSONs are written, invoke the logo script for each:

```bash
node ~/brandit/scripts/generate-logo.mjs \
  --prompt "[logoPrompt from JSON]" \
  --name "[name from JSON]" \
  --font "[heading font from JSON]" \
  --font-weight 700 \
  --primary-color "[primary color from JSON]" \
  --bg-color "#FFFFFF" \
  --output-dir ./.brandit-temp/direction-a-logos/
```

Repeat for B and C.

**If the script fails** (exit code 1 or 2): note the failure and continue without a logo for that direction. Tell the PM which direction couldn't generate a logo and why.

**DALL-E budget:** 3 calls for initial directions + up to 3 for refinement = 6 maximum.

### Step 5: Present

Show all three directions in the terminal as a structured comparison — name, tagline, colour swatches (hex codes), font names, logo status, tone of voice examples. If the superpowers visual companion is already active in the session, use it instead.

Tell the PM: "Here are three brand directions. Pick your favourite, mix and match across them, or tell me what to adjust."

### Step 6: Refine

**Pick one:** "I like B." → Confirm, ask if anything needs tweaking.

**Mix and match:** "Name from A, colours from C, logo from B." → Merge, check coherence. Flag clashes: "That name feels more casual than those colours suggest — want me to adjust?"

**None quite right:** "B but less corporate." → Revise. Only spend a DALL-E call if the logo concept changes. Reuse existing symbol if only colours/fonts/name changed.

**Limits:**
- Maximum 3 refinement rounds. After the third: "Remember — this is your MVP brand, not your forever brand. Let's ship this and evolve it later."
- Maximum 3 additional DALL-E calls (6 total). If exhausted: "That's the last logo round — pick the closest one."

### Step 7: Write Brand Outputs

When the PM confirms, write to the current directory:
- `brand.md` — brand guidelines (use the template from `~/brandit/agents/brandit.md`)
- `brand-tokens.css` — CSS custom properties (use the template from `~/brandit/agents/brandit.md`)
- `brand-tokens.json` — JSON design tokens (use the template from `~/brandit/agents/brandit.md`)
- Copy final logo PNGs from `.brandit-temp/` to current directory as `brand-logo.png`, `brand-logo-dark.png`, `brand-logo-favicon.png`

Clean up `.brandit-temp/` directory.

### Step 8: Resume

Continue to Phase 8 (Final Review). Brand assets are now available for the Gamma deck.

---
