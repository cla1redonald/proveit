/** Hosted Studio (STUDIO_SOURCE=supabase) requires a single allow-listed email. */

export function isHostedStudio(): boolean {
  return process.env.STUDIO_SOURCE === 'supabase'
}

export function studioAllowedEmail(): string {
  return (process.env.STUDIO_ALLOWED_EMAIL ?? '').trim().toLowerCase()
}

/** True when hosted mode is on but STUDIO_ALLOWED_EMAIL is missing/blank. */
export function isHostedStudioMisconfigured(): boolean {
  return isHostedStudio() && !studioAllowedEmail()
}
