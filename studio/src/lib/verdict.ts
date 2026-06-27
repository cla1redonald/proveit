// Tiny helpers for turning scores into the visual language of the verdict.

/** Strength band for a 0–10 score → which verdict colour it earns. */
export function band(score: number | undefined): 'strong' | 'moderate' | 'weak' | 'none' {
  if (score == null) return 'none'
  if (score >= 8) return 'strong'
  if (score >= 6) return 'moderate'
  return 'weak'
}

export const bandColor: Record<string, string> = {
  strong: 'var(--verdict-strong)',
  moderate: 'var(--color-accent)',
  weak: 'var(--verdict-weak)',
  none: 'var(--text-muted)',
}
