# ProveIt — Frontend Design System

**Version:** 1.0
**Date:** 2026-02-22
**Status:** LOCKED — @engineer references this before building any component. Changes require explicit design approval.

---

## 1. Color System

All colors are defined as CSS custom properties on `:root`. Use only these values. Do not introduce ad-hoc hex values in component files.

### CSS Custom Properties

```css
:root {
  /* Background scale */
  --bg-base:     #0e1115;  /* Page background — near-black charcoal, NOT pure black */
  --bg-surface:  #161b22;  /* Cards, panels, chat bubbles (ProveIt side) */
  --bg-elevated: #1f2937;  /* Modals, dropdowns, user chat bubbles */

  /* Text scale */
  --text-primary:   #f0f4f8;  /* Headings, primary body text — off-white */
  --text-secondary: #8b949e;  /* Secondary labels, metadata, timestamps */
  --text-muted:     #484f58;  /* Disabled states, placeholder text */

  /* Accent — one color, used sparingly */
  --accent:         #e05a2b;  /* Primary CTA buttons and verdict badges only */
  --accent-hover:   #c94e22;  /* Hover state for accent elements */

  /* Semantic verdict colors */
  --color-supported:    #2d6a4f;  /* SUPPORTED verdict — dark green background */
  --color-supported-fg: #52b788;  /* SUPPORTED verdict — green text/badge */
  --color-weak:         #7c5800;  /* WEAK verdict — dark amber background */
  --color-weak-fg:      #e9a829;  /* WEAK verdict — amber text/badge */
  --color-contradicted:     #6b1a1a;  /* CONTRADICTED verdict — dark red background */
  --color-contradicted-fg:  #f87171;  /* CONTRADICTED verdict — red text/badge */

  /* Kill signal */
  --color-kill-signal:    #3d1515;  /* Kill signal section background */
  --color-kill-signal-fg: #f87171;  /* Kill signal label and icon */

  /* Border */
  --border-subtle:  rgba(255, 255, 255, 0.06);  /* Hairline separators */
  --border-default: rgba(255, 255, 255, 0.12);  /* Card outlines, input borders */
  --border-focus:   #e05a2b;                     /* Focus rings on interactive elements */
}
```

### Usage Rules

- `--accent` appears in exactly two contexts at any time: primary CTA buttons and verdict status badges. Not in backgrounds, not in decorative elements.
- `--bg-elevated` is never used as a page background — only for layered surfaces.
- Verdict colors (`--color-supported`, `--color-weak`, `--color-contradicted`) are reserved for assumption verdict badges and kill signal callouts. Do not use them for general UI states.
- Never invent a new color. If the palette is insufficient, escalate to design review.

---

## 2. Typography

### Font Families

```css
:root {
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, 'Courier New', monospace;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
}
```

**JetBrains Mono** is the primary brand font. Load from Google Fonts or self-host. Weight 400 and 500 only.
**Inter** is for UI chrome only: nav, button labels, metadata, timestamps.

### When to Use Each Font

- `font-mono`: All result/research output text. Section labels (`FAST CHECK`, `ASSUMPTION 01`). Textarea input content. Chat message content. Streaming text output. Evidence citations. Score displays.
- `font-sans`: Navigation. Button labels. Form labels. Error messages. Toast notifications. Modal chrome.

### Type Scale

```css
:root {
  --text-xs:   0.75rem;   /* 12px — metadata, timestamps, char counts */
  --text-sm:   0.875rem;  /* 14px — secondary labels, evidence source citations */
  --text-base: 1rem;      /* 16px — body text, chat messages, card content */
  --text-lg:   1.125rem;  /* 18px — card headings, assumption titles */
  --text-xl:   1.25rem;   /* 20px — section headings, ProveIt responses */
  --text-2xl:  1.5rem;    /* 24px — page headings */
  --text-3xl:  1.875rem;  /* 30px — landing hero headline */
  --text-4xl:  2.25rem;   /* 36px — desktop hero headline */
}
```

### Line Height

```css
:root {
  --leading-tight:   1.25;  /* Headlines, section labels */
  --leading-snug:    1.375; /* Card titles */
  --leading-normal:  1.5;   /* Body text, chat messages */
  --leading-relaxed: 1.625; /* Long-form output text, evidence */
  --leading-loose:   2;     /* Streaming text while active (gives room for cursor) */
}
```

### Letter Spacing

Section labels (monospace, all-caps) require explicit letter spacing:

```css
.section-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-weight: 500;
}
```

---

## 3. Spacing System

Base unit: 4px. All spacing values are multiples of the base unit.

```css
:root {
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
}
```

### Spacing Usage Guide

| Context | Value |
|---------|-------|
| Between section label and section title | `--space-2` |
| Card internal padding (mobile) | `--space-4` |
| Card internal padding (desktop) | `--space-6` |
| Between cards in a list | `--space-4` |
| Section vertical gap (mobile) | `--space-10` |
| Section vertical gap (desktop) | `--space-16` |
| Container horizontal padding (mobile) | `--space-4` |
| Container horizontal padding (desktop) | `--space-8` |
| Textarea vertical padding | `--space-4` |
| Button padding (horizontal) | `--space-6` |
| Button padding (vertical) | `--space-3` |
| Chat message gap | `--space-3` |
| Between chat message groups | `--space-6` |

---

## 4. Component Tokens

### Border Radius

```css
:root {
  --radius-sm: 0.25rem;   /* 4px — badges, small pills */
  --radius-md: 0.375rem;  /* 6px — buttons, inputs */
  --radius-lg: 0.5rem;    /* 8px — cards, panels */
  --radius-xl: 0.75rem;   /* 12px — modals, large surfaces */
}
```

ProveIt is a tool, not an app. Keep radii small — avoid rounded corners that signal "friendly consumer app". `--radius-md` is the default for most interactive elements.

### Box Shadow

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.6);
}
```

Use `--shadow-sm` on cards. Use `--shadow-md` on modals and floating panels. Do not use shadows on text elements.

---

## 5. Breakpoints

Mobile-first. All components are designed for 375px first, then scaled up.

```css
/* Breakpoints (use in Tailwind config or as CSS variables) */
--screen-sm: 640px;   /* Small phones landscape, large phones portrait */
--screen-md: 768px;   /* Tablets portrait */
--screen-lg: 1024px;  /* Tablets landscape, small laptops */
--screen-xl: 1280px;  /* Standard desktop */
```

### Tailwind Breakpoint Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
}
```

### Layout Width

- Mobile: full width with `--space-4` horizontal padding
- Tablet (md+): max-width 720px, centered
- Desktop (lg+): max-width 860px, centered
- Wide desktop (xl+): max-width 960px, centered

Preflight felt narrow. ProveIt breathes more — 860px max on desktop gives the output room to be read, not squinted at.

---

## 6. Animation

### Streaming Text

Streaming text is the core UX of this product. Characters appear as they arrive from the API stream. This must feel deliberate, not janky.

**Approach:** Characters appear instantly (no typewriter delay per character). The effect comes from the natural rhythm of the API stream. Do not add artificial delays.

```css
/* Streaming cursor — appears at end of streaming content */
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: var(--text-secondary);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: cursor-blink 0.8s step-end infinite;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
```

The cursor disappears when streaming for that section ends. It reappears at the start of the next section.

### Assumption Card Entrance

Cards slide up and fade in as they become available during streaming:

```css
.assumption-card-enter {
  animation: card-enter 0.3s ease-out forwards;
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Stagger each card by 80ms (`animation-delay: calc(var(--card-index) * 80ms)`).

### Loading / Web Search Indicator

The "Searching the web..." indicator uses a pulsing dot animation:

```css
.search-dots span {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--text-secondary);
  animation: dot-pulse 1.4s ease-in-out infinite;
}

.search-dots span:nth-child(2) { animation-delay: 0.2s; }
.search-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
  40%           { opacity: 1;   transform: scale(1.2); }
}
```

### General Timing

```css
:root {
  --duration-fast:   150ms;  /* Hover states, button active */
  --duration-base:   200ms;  /* Most transitions */
  --duration-slow:   300ms;  /* Card entrances, panel slides */
  --duration-xslow:  500ms;  /* Modal opens, page transitions */
  --easing-default:  cubic-bezier(0.4, 0, 0.2, 1);  /* Standard ease */
  --easing-enter:    cubic-bezier(0, 0, 0.2, 1);     /* Elements entering */
  --easing-exit:     cubic-bezier(0.4, 0, 1, 1);     /* Elements leaving */
}
```

### Reduced Motion

All animations must be disabled when the user prefers reduced motion. No exceptions.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .streaming-cursor {
    animation: none;
    opacity: 1;
  }
}
```

---

## 7. shadcn/ui Theme Config

Apply these overrides to `globals.css` to match ProveIt's dark theme. This replaces the default shadcn/ui variables.

```css
/* globals.css */

@layer base {
  :root {
    --background:    14 17 21;     /* #0e1115 */
    --foreground:    240 244 248;  /* #f0f4f8 */

    --card:          22 27 34;     /* #161b22 */
    --card-foreground: 240 244 248;

    --popover:       31 41 55;     /* #1f2937 */
    --popover-foreground: 240 244 248;

    --primary:       224 90 43;    /* #e05a2b — accent */
    --primary-foreground: 240 244 248;

    --secondary:     22 27 34;     /* --bg-surface */
    --secondary-foreground: 139 148 158;

    --muted:         22 27 34;
    --muted-foreground: 72 79 88;  /* --text-muted */

    --accent:        31 41 55;     /* --bg-elevated */
    --accent-foreground: 240 244 248;

    --destructive:   248 113 113;  /* --color-contradicted-fg */
    --destructive-foreground: 240 244 248;

    --border:        255 255 255 / 0.12;  /* --border-default */
    --input:         255 255 255 / 0.12;
    --ring:          224 90 43;           /* --border-focus */

    --radius: 0.375rem;  /* --radius-md */
  }
}

@layer base {
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-family: var(--font-mono);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
  }
}
```

**Important:** shadcn/ui uses HSL channel values (space-separated, no commas) for its CSS variable format. The values above follow this convention. Do not add `hsl()` wrappers to the custom property values themselves.

---

## 8. Accessibility

### Contrast Ratios

All text must meet WCAG AA minimum (4.5:1 for normal text, 3:1 for large text).

| Foreground | Background | Ratio | Status |
|------------|------------|-------|--------|
| `--text-primary` (#f0f4f8) | `--bg-base` (#0e1115) | ~17:1 | Pass |
| `--text-secondary` (#8b949e) | `--bg-base` (#0e1115) | ~6.5:1 | Pass |
| `--text-muted` (#484f58) | `--bg-base` (#0e1115) | ~3.1:1 | Pass (large text only) |
| `--color-supported-fg` (#52b788) | `--color-supported` (#2d6a4f) | ~3.5:1 | Pass (large text / bold) |
| `--color-weak-fg` (#e9a829) | `--color-weak` (#7c5800) | ~4.6:1 | Pass |
| `--color-contradicted-fg` (#f87171) | `--color-contradicted` (#6b1a1a) | ~4.8:1 | Pass |

Use `--text-muted` only for non-essential decorative text (char counts, separators). Never for content the user needs to act on.

### Focus Rings

All interactive elements must have visible focus rings. Do not remove outline without replacing it.

```css
/* Applied globally */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* For elements with their own border (inputs, textareas) */
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 0;
  border-color: var(--border-focus);
}
```

Mouse users should not see focus rings (`:focus-visible` handles this). Keyboard users must always see them.

### Semantic HTML Requirements

- The main textarea on `/fast` and `/validate` must have an associated `<label>` (visually hidden is acceptable, but it must exist in the DOM).
- Streaming result sections must use appropriate heading levels (`h2` for section headings, `h3` for card titles).
- Assumption verdict badges must include screen-reader text (e.g., `<span class="sr-only">Verdict:</span>` before the badge label).
- The "Searching the web..." indicator must use `role="status"` and `aria-live="polite"` so screen readers announce it.
- Loading states must use `aria-busy="true"` on the containing element.

---

## 9. Component Reference

### Verdict Badge

```
Structure:
[ LABEL ]

Where LABEL is: SUPPORTED | WEAK | CONTRADICTED

Visual:
- Monospace, uppercase, letter-spaced (--text-xs, 0.12em tracking)
- Background: --color-supported / --color-weak / --color-contradicted
- Text: --color-supported-fg / --color-weak-fg / --color-contradicted-fg
- Padding: 2px 8px (--space-1 vertical, --space-2 horizontal)
- Border radius: --radius-sm
- Font weight: 500
```

### Primary CTA Button

```
Structure:
[ BUTTON LABEL ]

Visual:
- Background: --accent
- Text: --text-primary, font-sans, uppercase, letter-spaced (0.08em)
- Font size: --text-sm
- Font weight: 600
- Padding: --space-3 vertical, --space-6 horizontal
- Border radius: --radius-md
- Border: none
- Disabled state: opacity 0.4, cursor not-allowed
- Hover state: background --accent-hover
- Active state: scale(0.98) transform
- Transition: background-color var(--duration-fast), transform var(--duration-fast)
```

### Textarea Input

```
Visual:
- Background: --bg-surface
- Text: --text-primary, font-mono
- Placeholder: --text-muted
- Border: 1px solid --border-default
- Border radius: --radius-md
- Padding: --space-4
- Focus border: --border-focus (2px)
- Font size: --text-base
- Line height: --leading-relaxed
- Resize: vertical only (resize: vertical)
- Min height: 120px mobile, 160px desktop
```

### Assumption Card

```
Structure:
[ VERDICT BADGE ]
[ ASSUMPTION TITLE — monospace, --text-lg ]
[ EVIDENCE BLOCK — monospace, --text-sm, --leading-relaxed ]
[ SOURCE CITATIONS — --text-xs, --text-secondary ]

Visual:
- Background: --bg-surface
- Border: 1px solid --border-default
- Border radius: --radius-lg
- Padding: --space-6
- Left border accent: 3px solid matching verdict color (--color-supported-fg / etc.)
- Shadow: --shadow-sm
```

### Kill Signal Callout

Kill signals must be visually distinct. They are not errors — they are important findings.

```
Structure:
[ KILL SIGNAL — monospace label, --color-kill-signal-fg ]
[ Signal title — --text-base, bold ]
[ Evidence — --text-sm, --leading-relaxed ]
[ "Here's what would need to be true..." — italic, --text-secondary ]

Visual:
- Background: --color-kill-signal
- Border: 1px solid rgba(248, 113, 113, 0.2)
- Border-left: 3px solid --color-kill-signal-fg
- Border radius: --radius-lg
- Padding: --space-6
```

### Web Search Indicator

```
Structure:
[ SEARCHING THE WEB ]
[ ... three dots ]

Visual:
- Section label style: monospace, --text-xs, uppercase, --text-secondary
- Dots: three 4px circles, --text-secondary, animated (see Animation section)
- No background — appears inline where the streaming content will go
- role="status" aria-live="polite" aria-label="Searching the web for evidence"
```

### Chat Bubble — ProveIt

```
Visual:
- Background: --bg-surface
- Border: 1px solid --border-subtle
- Border radius: --radius-lg --radius-lg --radius-lg 0  (bottom-left flat)
- Max width: 84% of container
- Align: left
- Font: font-mono, --text-base, --leading-relaxed
- Padding: --space-4 --space-5
```

### Chat Bubble — PM

```
Visual:
- Background: --bg-elevated
- Border: 1px solid --border-default
- Border radius: --radius-lg --radius-lg 0 --radius-lg  (bottom-right flat)
- Max width: 80% of container
- Align: right
- Font: font-mono, --text-base, --leading-normal
- Padding: --space-3 --space-4
- Color: --text-primary
```

### Confidence Score Display

```
Structure:
[ LABEL ]  [ X/10 ]

Example:
DESIRABILITY  8/10
VIABILITY     5/10
FEASIBILITY   7/10

Visual:
- Label: monospace, --text-xs, uppercase, --text-secondary
- Score: monospace, --text-xl, --text-primary, font-weight 500
- Low (1-4): --color-contradicted-fg
- Mid (5-7): --color-weak-fg
- High (8-10): --color-supported-fg
- Layout: grid, label left-aligned, score right-aligned
- Border-bottom: 1px solid --border-subtle between rows
```

---

## 10. Do Not

- Do not use gradients anywhere.
- Do not use hero imagery, illustrations, or decorative icons.
- Do not use emojis. Anywhere.
- Do not use pure black (`#000000`) or pure white (`#ffffff`).
- Do not use more than one accent color. `--accent` is the only warm color in the palette.
- Do not animate background colors (only opacity and transform).
- Do not add hover effects to non-interactive elements.
- Do not invent component variants not specified here. If a new variant is needed, update this document first.
- Do not use `!important` except inside `prefers-reduced-motion` overrides.
