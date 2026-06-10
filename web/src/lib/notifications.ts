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
 * Send a notification email about a Wizard-of-Oz pricing-intent click.
 * Fire-and-forget — never throws, never blocks the calling code.
 */
export async function notifyWozIntent(entry: {
  email: string;
  chosenOption: "one_off" | "subscription";
  intendedUse: string;
  ideaSummary: string;
  ip: string;
  ts: string;
}): Promise<void> {
  const resend = getResend();
  const to = process.env.WAITLIST_NOTIFY_EMAIL;
  const from = process.env.WAITLIST_FROM_EMAIL || "onboarding@resend.dev";

  if (!resend || !to) {
    if (!resend) console.warn("[notifications] RESEND_API_KEY unset — WoZ notifications disabled");
    if (!to) console.warn("[notifications] WAITLIST_NOTIFY_EMAIL unset — WoZ notifications disabled");
    return;
  }

  const optionLabel =
    entry.chosenOption === "one_off"
      ? "£4.99 one-off"
      : "£9.99/mo subscription";
  const subject = `[ProveIt WoZ] ${optionLabel} — ${entry.email}`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: entry.email,
      subject,
      html: renderWozHtml(entry, optionLabel),
      text: renderWozText(entry, optionLabel),
    });
    if (error) {
      console.error("[notifications] Resend WoZ send error (swallowed):", error);
    }
  } catch (err) {
    console.error("[notifications] notifyWozIntent threw (swallowed):", err);
  }
}

/**
 * Send a notification email when a Stripe payment completes.
 *
 * This is the Phase 1 manual-fulfilment alert. Claire receives the email,
 * then manually assembles and sends the bundle to the customer.
 *
 * Fire-and-forget — never throws, never blocks the webhook response.
 */
export async function notifyOrderPaid(entry: {
  email: string;
  ideaSummary: string;
  orderId: string;
  amountPence: number;
  ts: string;
}): Promise<void> {
  const resend = getResend();
  const to = process.env.WAITLIST_NOTIFY_EMAIL;
  const from = process.env.WAITLIST_FROM_EMAIL || "onboarding@resend.dev";

  if (!resend || !to) {
    if (!resend) console.warn("[notifications] RESEND_API_KEY unset — order paid notifications disabled");
    if (!to) console.warn("[notifications] WAITLIST_NOTIFY_EMAIL unset — order paid notifications disabled");
    return;
  }

  const amountLabel = `£${(entry.amountPence / 100).toFixed(2)}`;
  const subject = `[ProveIt PAID] ${amountLabel} — ${entry.email}`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: entry.email !== "unknown" ? entry.email : undefined,
      subject,
      html: renderOrderPaidHtml(entry, amountLabel),
      text: renderOrderPaidText(entry, amountLabel),
    });
    if (error) {
      console.error("[notifications] Resend order-paid send error (swallowed):", error);
    }
  } catch (err) {
    console.error("[notifications] notifyOrderPaid threw (swallowed):", err);
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

function renderWozHtml(
  entry: {
    email: string;
    intendedUse: string;
    ideaSummary: string;
    ip: string;
    ts: string;
  },
  optionLabel: string
): string {
  const intendedBlock = entry.intendedUse
    ? `<p style="margin: 16px 0 8px; font-size: 13px; color: #6a8a8a; text-transform: uppercase; letter-spacing: 0.08em;">Intended use</p>
       <p style="margin: 0 0 16px; padding: 12px 16px; background: #f0eee8; border-left: 3px solid #c4956a; border-radius: 4px; font-size: 14px; color: #2d2a26;">${escapeHtml(entry.intendedUse)}</p>`
    : "";
  const ideaBlock = entry.ideaSummary
    ? `<p style="margin: 16px 0 8px; font-size: 13px; color: #6a8a8a; text-transform: uppercase; letter-spacing: 0.08em;">Idea they validated</p>
       <p style="margin: 0 0 16px; padding: 12px 16px; background: #f0eee8; border-left: 3px solid #6a8a8a; border-radius: 4px; font-size: 14px; color: #2d2a26;">${escapeHtml(entry.ideaSummary)}</p>`
    : "";

  return `<!doctype html>
<html>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #faf6f1; color: #2d2a26;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e0d9cf;">
    <p style="margin: 0 0 4px; font-size: 12px; color: #6a8a8a; text-transform: uppercase; letter-spacing: 0.12em;">ProveIt — WoZ pricing intent</p>
    <h1 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 500; color: #111a24;">Someone wants the bundle.</h1>
    <p style="margin: 0 0 16px; font-size: 14px;"><strong>Chose:</strong> ${escapeHtml(optionLabel)}</p>
    <p style="margin: 0 0 16px; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(entry.email)}" style="color: #c4956a; text-decoration: none;">${escapeHtml(entry.email)}</a></p>
    <p style="margin: 0 0 16px; font-size: 14px;"><strong>From IP:</strong> ${escapeHtml(entry.ip)}</p>
    <p style="margin: 0 0 16px; font-size: 14px;"><strong>When:</strong> ${escapeHtml(entry.ts)}</p>
    ${intendedBlock}
    ${ideaBlock}
    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e0d9cf;" />
    <p style="margin: 0; font-size: 13px; color: #6b5d4f;">Manually email the bundle within 4 hours. Hitting <strong>Reply</strong> goes to the submitter. Full list: <a href="https://supabase.com/dashboard/project/bbpdicijaqoujnpidiho/editor" style="color: #c4956a;">Supabase dashboard</a>.</p>
  </div>
</body>
</html>`;
}

function renderWozText(
  entry: {
    email: string;
    intendedUse: string;
    ideaSummary: string;
    ip: string;
    ts: string;
  },
  optionLabel: string
): string {
  return [
    `Someone clicked the ${optionLabel} button on ProveIt.`,
    "",
    `Chose:   ${optionLabel}`,
    `Email:   ${entry.email}`,
    `From IP: ${entry.ip}`,
    `When:    ${entry.ts}`,
    entry.intendedUse ? `\nIntended use:\n  ${entry.intendedUse}` : "",
    entry.ideaSummary ? `\nIdea they validated:\n  ${entry.ideaSummary}` : "",
    "",
    "Manually email the bundle within 4 hours.",
    "Hitting Reply emails the submitter directly.",
    "Read the WoZ list: https://supabase.com/dashboard/project/bbpdicijaqoujnpidiho/editor",
  ]
    .filter(Boolean)
    .join("\n");
}

function renderOrderPaidHtml(
  entry: {
    email: string;
    ideaSummary: string;
    orderId: string;
    amountPence: number;
    ts: string;
  },
  amountLabel: string
): string {
  const ideaBlock = entry.ideaSummary
    ? `<p style="margin: 16px 0 8px; font-size: 13px; color: #6a8a8a; text-transform: uppercase; letter-spacing: 0.08em;">Idea they validated</p>
       <p style="margin: 0 0 16px; padding: 12px 16px; background: #f0eee8; border-left: 3px solid #6a8a8a; border-radius: 4px; font-size: 14px; color: #2d2a26;">${escapeHtml(entry.ideaSummary)}</p>`
    : "";
  const dashboardUrl = `https://supabase.com/dashboard/project/bbpdicijaqoujnpidiho/editor?filter=id%3Deq.${encodeURIComponent(entry.orderId)}`;

  return `<!doctype html>
<html>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #faf6f1; color: #2d2a26;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e0d9cf;">
    <p style="margin: 0 0 4px; font-size: 12px; color: #6a8a8a; text-transform: uppercase; letter-spacing: 0.12em;">ProveIt — paid order</p>
    <h1 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 500; color: #111a24;">Someone paid. Fulfil manually.</h1>
    <p style="margin: 0 0 8px; font-size: 14px;"><strong>Amount:</strong> ${escapeHtml(amountLabel)}</p>
    <p style="margin: 0 0 8px; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(entry.email)}" style="color: #c4956a; text-decoration: none;">${escapeHtml(entry.email)}</a></p>
    <p style="margin: 0 0 8px; font-size: 14px;"><strong>Order ID:</strong> <code style="font-size: 13px; background: #f0eee8; padding: 2px 6px; border-radius: 3px;">${escapeHtml(entry.orderId)}</code></p>
    <p style="margin: 0 0 16px; font-size: 14px;"><strong>When:</strong> ${escapeHtml(entry.ts)}</p>
    ${ideaBlock}
    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e0d9cf;" />
    <p style="margin: 0 0 12px; font-size: 13px; color: #6b5d4f;">
      <strong>Action required:</strong> email the bundle to the customer within 4 hours.
      Hitting <strong>Reply</strong> goes to the customer directly.
    </p>
    <p style="margin: 0; font-size: 13px; color: #6b5d4f;">
      View order in <a href="${dashboardUrl}" style="color: #c4956a;">Supabase dashboard</a>.
    </p>
  </div>
</body>
</html>`;
}

function renderOrderPaidText(
  entry: {
    email: string;
    ideaSummary: string;
    orderId: string;
    amountPence: number;
    ts: string;
  },
  amountLabel: string
): string {
  return [
    `ProveIt: someone paid ${amountLabel} — fulfil manually.`,
    "",
    `Amount:   ${amountLabel}`,
    `Email:    ${entry.email}`,
    `Order ID: ${entry.orderId}`,
    `When:     ${entry.ts}`,
    entry.ideaSummary ? `\nIdea they validated:\n  ${entry.ideaSummary}` : "",
    "",
    "Action required: email the bundle to the customer within 4 hours.",
    "Hitting Reply emails the customer directly.",
    `View order: https://supabase.com/dashboard/project/bbpdicijaqoujnpidiho/editor`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
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
