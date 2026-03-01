#!/usr/bin/env node

import OpenAI from "openai";
import { readFileSync } from "fs";

const content = readFileSync("/dev/stdin", "utf-8");

if (!content.trim()) {
  console.error("Error: No content provided on stdin.");
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is not set.");
  process.exit(1);
}

const client = new OpenAI();

const systemPrompt = `You are an independent reviewer of a product validation analysis performed by a different AI model. Your job is to find what it missed or got wrong.

Review the following analysis for:

1. GAPS — What questions weren't asked? What evidence is missing? What market segments, user types, or risk factors were overlooked?
2. BIAS — Confirmation bias, optimism bias, anchoring to the PM's original framing, or systematic blind spots in the research methodology.
3. LOGICAL LEAPS — Conclusions that don't follow from the evidence cited. Claims presented as findings that are actually assumptions.
4. CONTRADICTIONS — Things that conflict within the research. Evidence that points in opposite directions without acknowledgement.

For each finding:
- Cite the specific section and quote the relevant text
- Rate severity: CRITICAL / NOTABLE / MINOR
- CRITICAL = would change the recommendation if addressed
- NOTABLE = worth investigating but not deal-breaking
- MINOR = style or completeness nit

If the analysis is solid and you find no significant issues, say so clearly. Do not manufacture problems to appear thorough.

Format your response as markdown with these sections:
## Gaps
## Bias
## Logical Leaps
## Contradictions
## Overall Assessment`;

const response = await client.chat.completions.create({
  model: "o3",
  reasoning_effort: "high",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content },
  ],
});

console.log(response.choices[0].message.content);
