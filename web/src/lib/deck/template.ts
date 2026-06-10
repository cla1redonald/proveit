import "server-only";

/**
 * Deterministic HTML deck renderer for ProveIt validation reports.
 *
 * Takes structured data and returns a complete index.html string using the
 * html-deck template system. Assets are served from /deck-assets/ (the three
 * support files copied verbatim into web/public/deck-assets/).
 *
 * ProveIt/Roami palette: river #2A5A52 family + cream #FAF6F1.
 *
 * Rules (non-negotiable per SKILL.md):
 *   - Never import/edit deck-stage.js, deck.css, or colors_and_type.css
 *   - All customisation is via the token-override <style> block
 *   - UK spelling, sentence case, no em-dashes in slide copy
 *   - Visual-first: icon-topped KPI cards, paired rows for kill signals
 *   - Dark `statement` slides for opener + close
 */

import type { ConfidenceScores, KillSignal } from "@/types/index";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Finding {
  title: string;
  body: string;
  source?: string;
}

export interface Recommendation {
  title: string;
  body: string;
}

export interface DeckData {
  ideaSummary: string;
  scores: ConfidenceScores;
  killSignals: KillSignal[];
  findings: Finding[];
  recommendations: Recommendation[];
  soWhat: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Format a score (0-100) as a percentage string, or "n/a" if null. */
function fmtScore(score: number | null): string {
  if (score === null) return "n/a";
  return `${Math.round(score)}%`;
}

/** Map kill signal type to a human-readable label. */
function killSignalLabel(type: KillSignal["type"]): string {
  switch (type) {
    case "tarpit":
      return "Tarpit idea";
    case "saturation":
      return "Market saturated";
    case "no_switching":
      return "No switching trigger";
    case "no_willingness_to_pay":
      return "No willingness to pay";
    default:
      return type;
  }
}

// ─── Icon sprite (Lucide-style inline SVG) ────────────────────────────────────

const ICON_SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="ic-target" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></symbol>
    <symbol id="ic-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></symbol>
    <symbol id="ic-coins" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></symbol>
    <symbol id="ic-zap" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></symbol>
    <symbol id="ic-alert" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></symbol>
    <symbol id="ic-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></symbol>
    <symbol id="ic-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></symbol>
    <symbol id="ic-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></symbol>
    <symbol id="ic-lightbulb" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></symbol>
    <symbol id="ic-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></symbol>
    <symbol id="ic-proveit" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="3"/><path d="M30.5 17.5l-3.6 9.4-9.4 3.6 3.6-9.4z" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></symbol>
  </defs>
</svg>`.trim();

// ─── Token-override style block ────────────────────────────────────────────────

const PALETTE_OVERRIDE = `<style>
  /* ====== ProveIt / Roami palette re-skin ====== */
  :root {
    --rm-river:         #2A5A52;
    --rm-river-600:     #316B61;
    --rm-river-700:     #234B45;
    --rm-river-900:     #18332F;
    --rm-mint-tint:     #E4EEE9;
    --rm-mint-100:      #CDE0D7;

    --rm-amber:         #C4956A;
    --rm-amber-soft:    #F5EAD9;

    --rm-cream:         #FAF6F1;
    --rm-cream-2:       #F0E8DC;
    --rm-line:          #E0D9CF;

    --rm-risk:          #C45252;
    --rm-risk-soft:     #F5DEDE;

    /* Map deck system tokens to ProveIt palette */
    --slide-bg:         var(--rm-cream);
    --surface:          #FFFCF6;
    --surface-2:        var(--rm-cream-2);
    --accent:           var(--rm-river);
    --accent-ink:       var(--rm-river-700);
    --dark-bg:          var(--rm-river-900);
    --dark-surface:     var(--rm-river-700);
    --dark-ink-2:       #A8C4BC;
    --on-accent:        #0E2722;
    --shadow-accent:    0 12px 30px rgba(42,90,82,.28);
    --line:             var(--rm-line);
  }

  /* Cover headline must be LIGHT on the dark statement slide: deck.css's .cover-headline
     does not inherit the is-dark ink, so it rendered dark-on-dark (illegible). Override here
     (never edit the verbatim deck.css). Also cap the size so a long idea summary stays on-slide. */
  .is-dark .cover-headline {
    color: var(--dark-ink);
    font-size: clamp(30px, 4.4vw, 52px);
    line-height: 1.12;
    max-width: 24ch;
    text-wrap: balance;
  }

  /* KPI / stat card: icon ABOVE label (SKILL.md rule) */
  .kpi-card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 28px 20px 20px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }
  .kpi-icon {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: var(--rm-mint-tint);
    color: var(--rm-river-700);
    display: grid;
    place-items: center;
  }
  .kpi-icon.risk { background: var(--rm-risk-soft); color: var(--rm-risk); }
  .kpi-label {
    font: 700 13px/1.2 var(--font-sans);
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: .07em;
  }
  .kpi-value {
    font: 800 36px/1 var(--font-sans);
    color: var(--ink);
    letter-spacing: -.02em;
    font-variant-numeric: tabular-nums;
  }
  .kpi-value.na { color: var(--ink-3); font-size: 22px; font-weight: 600; }

  /* Kill signal paired rows */
  .kill-row {
    display: grid;
    grid-template-columns: 1fr 48px 1fr;
    gap: 0 8px;
    align-items: stretch;
  }
  .kill-cell {
    border-radius: 12px;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }
  .kill-cell.ask {
    background: var(--rm-mint-tint);
    border: 1px solid var(--rm-mint-100);
    border-left: 4px solid var(--rm-river);
  }
  .kill-cell.walk {
    background: var(--rm-risk-soft);
    border: 1px solid var(--rm-risk-soft);
    border-left: 4px solid var(--rm-risk);
  }
  .kill-type {
    font: 800 10.5px/1 var(--font-sans);
    letter-spacing: .1em;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .kill-type.ask { color: var(--rm-river-700); }
  .kill-type.walk { color: var(--rm-risk); }
  .kill-evidence {
    font: 400 14px/1.4 var(--font-sans);
    color: var(--ink-2);
  }
  .kill-mid {
    display: grid;
    place-items: center;
    color: var(--ink-3);
  }
  .findings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 14px;
  }
  .finding-card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .finding-title {
    font: 700 16px/1.3 var(--font-sans);
    color: var(--ink);
  }
  .finding-body {
    font: 400 14px/1.5 var(--font-sans);
    color: var(--ink-2);
  }
  .finding-source {
    font: 600 12px/1 var(--font-sans);
    color: var(--ink-3);
    margin-top: 4px;
  }
  .reco-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .reco-row {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 16px 18px;
  }
  .reco-icon {
    flex: 0 0 auto;
    width: 36px; height: 36px;
    border-radius: 10px;
    background: var(--rm-mint-tint);
    color: var(--rm-river-700);
    display: grid;
    place-items: center;
  }
  .reco-text { display: flex; flex-direction: column; gap: 3px; }
  .reco-title { font: 700 15px/1.3 var(--font-sans); color: var(--ink); }
  .reco-body  { font: 400 14px/1.5 var(--font-sans); color: var(--ink-2); }
</style>`;

// ─── Slide builders ────────────────────────────────────────────────────────────

function slideCover(ideaSummary: string): string {
  return `
  <!-- ===== 01 · COVER ===== -->
  <section data-label="Cover">
    <div class="slide statement is-dark">
      <div class="pad">
        <div class="cover-top" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
          <div class="identity">
            <span class="nm">ProveIt</span>
            <span class="rl">Idea Validation Report</span>
          </div>
          <svg width="48" height="48" style="color:var(--rm-mint-tint);flex:0 0 auto;" aria-hidden="true"><use href="#ic-proveit"/></svg>
        </div>
        <div class="anim">
          <span class="eyebrow">Your validation results</span>
          <h1 class="cover-headline" style="margin-top:22px;">${esc(ideaSummary)}</h1>
        </div>
        <div class="cover-meta anim-2" style="margin-top:32px;">
          <span class="cover-rule"></span>
          <span class="chip">Structured evidence-based validation</span>
          <span class="chip">Desirability, viability, feasibility</span>
        </div>
      </div>
    </div>
  </section>`.trim();
}

function slideScores(scores: ConfidenceScores): string {
  const desScore = fmtScore(scores.desirability);
  const viScore = fmtScore(scores.viability);
  const feaScore = fmtScore(scores.feasibility);

  const desClass = scores.desirability === null || scores.desirability < 40 ? "risk" : "";
  const viClass = scores.viability === null || scores.viability < 40 ? "risk" : "";
  const feaClass = scores.feasibility === null || scores.feasibility < 40 ? "risk" : "";

  return `
  <!-- ===== 02 · CONFIDENCE SCORES ===== -->
  <section data-label="Confidence scores">
    <div class="slide content">
      <div class="pad">
        <div class="content-head anim">
          <span class="eyebrow">Confidence assessment</span>
          <h2 class="slide-title">How confident are we in this idea?</h2>
        </div>
        <div class="content-body anim-2">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:860px;margin:0 auto;">
            <div class="kpi-card">
              <div class="kpi-icon ${desClass}">
                <svg width="28" height="28"><use href="#ic-heart"/></svg>
              </div>
              <div class="kpi-label">Desirability</div>
              <div class="kpi-value${desScore === "n/a" ? " na" : ""}">${esc(desScore)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon ${viClass}">
                <svg width="28" height="28"><use href="#ic-coins"/></svg>
              </div>
              <div class="kpi-label">Viability</div>
              <div class="kpi-value${viScore === "n/a" ? " na" : ""}">${esc(viScore)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon ${feaClass}">
                <svg width="28" height="28"><use href="#ic-zap"/></svg>
              </div>
              <div class="kpi-label">Feasibility</div>
              <div class="kpi-value${feaScore === "n/a" ? " na" : ""}">${esc(feaScore)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="deck-footer"><span class="who"><span class="dot"></span><b>ProveIt</b> · Validation Report</span><span class="t-num">02</span></div>
    </div>
  </section>`.trim();
}

function slideKillSignals(killSignals: KillSignal[]): string {
  if (killSignals.length === 0) {
    return `
  <!-- ===== 03 · KILL SIGNALS (none) ===== -->
  <section data-label="Risk signals">
    <div class="slide content">
      <div class="pad">
        <div class="content-head anim">
          <span class="eyebrow">Risk signals</span>
          <h2 class="slide-title">No critical kill signals detected.</h2>
        </div>
        <div class="content-body anim-2">
          <div class="card accent" style="display:flex;align-items:center;gap:16px;padding:24px 28px;">
            <svg width="32" height="32" style="color:#fff;flex:0 0 auto;"><use href="#ic-shield"/></svg>
            <span style="font:700 20px/1.3 var(--font-sans);color:#fff;">The validation found no hard stop signals. Continue with normal risk management.</span>
          </div>
        </div>
      </div>
      <div class="deck-footer"><span class="who"><span class="dot"></span><b>ProveIt</b> · Validation Report</span><span class="t-num">03</span></div>
    </div>
  </section>`.trim();
  }

  const rows = killSignals
    .map(
      (sig) => `
            <div class="kill-row" style="margin-bottom:14px;">
              <div class="kill-cell ask">
                <div class="kill-type ask">Ask this</div>
                <div class="kill-evidence">${esc(killSignalLabel(sig.type))}: probe for real evidence</div>
              </div>
              <div class="kill-mid">
                <svg width="20" height="20"><use href="#ic-arrow"/></svg>
              </div>
              <div class="kill-cell walk">
                <div class="kill-type walk">Walk away when</div>
                <div class="kill-evidence">${esc(sig.evidence)}</div>
              </div>
            </div>`
    )
    .join("");

  return `
  <!-- ===== 03 · KILL SIGNALS ===== -->
  <section data-label="Risk signals">
    <div class="slide content">
      <div class="pad">
        <div class="content-head anim">
          <span class="eyebrow">Kill signals detected</span>
          <h2 class="slide-title">Ask this. Walk away when.</h2>
        </div>
        <div class="content-body anim-2">
          ${rows}
        </div>
      </div>
      <div class="deck-footer"><span class="who"><span class="dot"></span><b>ProveIt</b> · Validation Report</span><span class="t-num">03</span></div>
    </div>
  </section>`.trim();
}

function slideFindings(findings: Finding[], slideNum: number): string {
  const cards = findings
    .map(
      (f) => `
          <div class="finding-card">
            <div class="finding-title">${esc(f.title)}</div>
            <div class="finding-body">${esc(f.body)}</div>
            ${f.source ? `<div class="finding-source">${esc(f.source)}</div>` : ""}
          </div>`
    )
    .join("");

  return `
  <!-- ===== ${slideNum.toString().padStart(2, "0")} · FINDINGS ===== -->
  <section data-label="Findings">
    <div class="slide content">
      <div class="pad">
        <div class="content-head anim">
          <span class="eyebrow">What the validation found</span>
          <h2 class="slide-title">Key findings</h2>
        </div>
        <div class="content-body anim-2">
          <div class="findings-grid">
            ${cards}
          </div>
        </div>
      </div>
      <div class="deck-footer"><span class="who"><span class="dot"></span><b>ProveIt</b> · Validation Report</span><span class="t-num">${String(slideNum).padStart(2, "0")}</span></div>
    </div>
  </section>`.trim();
}

function slideRecommendations(recommendations: Recommendation[], soWhat: string, slideNum: number): string {
  const rows = recommendations
    .map(
      (r, i) => `
          <div class="reco-row">
            <div class="reco-icon">
              <svg width="20" height="20"><use href="#ic-${i % 2 === 0 ? "lightbulb" : "check"}"/></svg>
            </div>
            <div class="reco-text">
              <div class="reco-title">${esc(r.title)}</div>
              <div class="reco-body">${esc(r.body)}</div>
            </div>
          </div>`
    )
    .join("");

  return `
  <!-- ===== ${slideNum.toString().padStart(2, "0")} · RECOMMENDATIONS ===== -->
  <section data-label="Recommendations">
    <div class="slide content">
      <div class="pad">
        <div class="content-head anim">
          <span class="eyebrow">What to do next</span>
          <h2 class="slide-title">Recommendations</h2>
        </div>
        <div class="content-body anim-2">
          <div class="reco-list">
            ${rows}
          </div>
          ${soWhat ? `<div class="card mint anim-3" style="margin-top:16px;display:flex;align-items:center;gap:14px;padding:16px 20px;"><svg width="22" height="22" style="color:var(--accent-ink);flex:0 0 auto;"><use href="#ic-target"/></svg><span style="font:600 17px/1.4 var(--font-sans);color:var(--ink-2);"><b style="color:var(--ink);">The so what:</b> ${esc(soWhat)}</span></div>` : ""}
        </div>
      </div>
      <div class="deck-footer"><span class="who"><span class="dot"></span><b>ProveIt</b> · Validation Report</span><span class="t-num">${String(slideNum).padStart(2, "0")}</span></div>
    </div>
  </section>`.trim();
}

function slideClose(): string {
  return `
  <!-- ===== CLOSE ===== -->
  <section data-label="Close">
    <div class="slide statement is-dark">
      <div class="pad">
        <div class="anim">
          <span class="eyebrow">Validated with ProveIt</span>
          <h2 class="big" style="font-size:44px;line-height:1.15;max-width:22ch;margin-top:24px;">Good ideas survive scrutiny. Now you have the receipts.</h2>
        </div>
        <div class="attrib anim-2" style="color:var(--dark-ink-2);margin-top:32px;">
          <span class="bar"></span>
          Made with ProveIt at <strong>proveit.tools</strong>
        </div>
      </div>
    </div>
  </section>`.trim();
}

// ─── Main renderer ────────────────────────────────────────────────────────────

/**
 * Render a complete index.html string from structured deck data.
 * Deterministic: same input always produces the same output.
 */
export function renderDeckHtml(data: DeckData): string {
  const slides = [
    slideCover(data.ideaSummary),
    slideScores(data.scores),
    slideKillSignals(data.killSignals),
    ...(data.findings.length > 0 ? [slideFindings(data.findings, 4)] : []),
    ...(data.recommendations.length > 0 ? [slideRecommendations(data.recommendations, data.soWhat, 5)] : []),
    slideClose(),
  ].join("\n\n");

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>ProveIt: Validation Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/deck-assets/colors_and_type.css">
<link rel="stylesheet" href="/deck-assets/deck.css">
${PALETTE_OVERRIDE}
</head>
<body>
${ICON_SPRITE}

<deck-stage width="1280" height="720">

${slides}

</deck-stage>

<script src="/deck-assets/deck-stage.js"></script>
</body>
</html>`;
}
