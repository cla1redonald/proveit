import "server-only";

/**
 * Email notifications for waitlist signups.
 *
 * Sends a "new waitlist signup" email to the maintainer when someone
 * submits the form on the spend-cap 503 page. Resend is the email
 * provider — generous free tier, modern API, simple setup.
 *
 * Setup (production):
 *   1. Create a free Resend account at https://resend.com
 *   2. Grab your API key
 *   3. Set RESEND_API_KEY in Vercel production env
 *   4. Set WAITLIST_NOTIFY_EMAIL to the address that should receive
 *      notifications (e.g. claire@roami.group)
 *   5. (Optional) Set WAITLIST_FROM_EMAIL to a verified-domain address
 *      (e.g. noreply@roami.group). Without verification, falls back to
 *      Resend's default sandbox address — still delivers to YOUR own
 *      registered email but not to others.
 *
 * Failure mode: fire-and-forget. If Resend is unreachable or the env
 * vars are unset, the call logs and returns. The waitlist submission
 * itself has already succeeded (row in Supabase) by the time this
 * fires, so a notification failure doesn't cost the user anything —
 * the maintainer just won't see the alert until they check the dashboard.
 */

import { Resend } from "resend";
import type { WaitlistEntry } from "./waitlist";

let _resend: Resend | null | undefined;

function getResend(): Resend | null {
  if (_resend !== undefined) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  _resend = apiKey ? new Resend(apiKey) : null;
  return _resend;
}

/**
 * Send a notification email about a new waitlist signup.
 * Fire-and-forget — never throws, never blocks the calling code.
 */
export async function notifyWaitlistSignup(entry: WaitlistEntry): Promise<void> {
  const resend = getResend();
  const to = process.env.WAITLIST_NOTIFY_EMAIL;
  const from = process.env.WAITLIST_FROM_EMAIL || "onboarding@resend.dev";

  if (!resend || !to) {
    // Silent no-op if not configured. Logged once at startup-style level.
    if (!resend) console.warn("[notifications] RESEND_API_KEY unset — waitlist notifications disabled");
    if (!to) console.warn("[notifications] WAITLIST_NOTIFY_EMAIL unset — waitlist notifications disabled");
    return;
  }

  const subject = `[ProveIt] New waitlist signup — ${entry.email}`;
  const html = renderHtml(entry);
  const text = renderText(entry);

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: entry.email, // hitting Reply goes straight to the submitter
      subject,
      html,
      text,
    });
    if (error) {
      console.error("[notifications] Resend send error (swallowed):", error);
    }
  } catch (err) {
    console.error("[notifications] notifyWaitlistSignup threw (swallowed):", err);
  }
}

/**
 * Test-only — reset the cached Resend client.
 */
export function resetNotificationClient(): void {
  _resend = undefined;
}

// ─── Templates ────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHtml(entry: WaitlistEntry): string {
  const reasonLabel =
    entry.reason === "global_cap" ? "Global daily cap" : "Per-IP daily cap";
  const ideaBlock = entry.ideaExcerpt
    ? `<p style="margin: 16px 0 8px; font-size: 13px; color: #6a8a8a; text-transform: uppercase; letter-spacing: 0.08em;">Their idea / note</p>
       <p style="margin: 0 0 16px; padding: 12px 16px; background: #f0eee8; border-left: 3px solid #c4956a; border-radius: 4px; font-size: 14px; color: #2d2a26;">${escapeHtml(entry.ideaExcerpt)}</p>`
    : "";

  return `<!doctype html>
<html>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #faf6f1; color: #2d2a26;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e0d9cf;">
    <p style="margin: 0 0 4px; font-size: 12px; color: #6a8a8a; text-transform: uppercase; letter-spacing: 0.12em;">ProveIt — waitlist signup</p>
    <h1 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 500; color: #111a24;">Someone hit the cap and left their email.</h1>
    <p style="margin: 0 0 16px; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(entry.email)}" style="color: #c4956a; text-decoration: none;">${escapeHtml(entry.email)}</a></p>
    <p style="margin: 0 0 16px; font-size: 14px;"><strong>Cap hit:</strong> ${escapeHtml(reasonLabel)}</p>
    <p style="margin: 0 0 16px; font-size: 14px;"><strong>From IP:</strong> ${escapeHtml(entry.ip)}</p>
    <p style="margin: 0 0 16px; font-size: 14px;"><strong>When:</strong> ${escapeHtml(entry.ts)}</p>
    ${ideaBlock}
    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e0d9cf;" />
    <p style="margin: 0; font-size: 13px; color: #6b5d4f;">Hitting <strong>Reply</strong> emails the submitter directly. Or read the full waitlist in the <a href="https://supabase.com/dashboard/project/bbpdicijaqoujnpidiho/editor" style="color: #c4956a;">Supabase dashboard</a>.</p>
  </div>
</body>
</html>`;
}

function renderText(entry: WaitlistEntry): string {
  const reasonLabel =
    entry.reason === "global_cap" ? "Global daily cap" : "Per-IP daily cap";
  return [
    "Someone hit the ProveIt spend cap and left their email.",
    "",
    `Email:   ${entry.email}`,
    `Cap hit: ${reasonLabel}`,
    `From IP: ${entry.ip}`,
    `When:    ${entry.ts}`,
    entry.ideaExcerpt ? `\nTheir idea / note:\n  ${entry.ideaExcerpt}` : "",
    "",
    "Hitting Reply emails the submitter directly.",
    "Read the full waitlist: https://supabase.com/dashboard/project/bbpdicijaqoujnpidiho/editor",
  ]
    .filter(Boolean)
    .join("\n");
}
