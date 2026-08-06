import Link from "next/link";
import type { Metadata } from "next";
import { AnalyticsConsentControls } from "@/components/AnalyticsConsent";

export const metadata: Metadata = {
  title: "Privacy notice — ProveIt",
  description: "How ProveIt collects and uses information.",
};

const LAST_UPDATED = "6 August 2026";

export default function PrivacyPage() {
  return (
    <main
      className="min-h-screen px-[var(--space-4)] py-[var(--space-8)] md:px-[var(--space-8)] md:py-[var(--space-16)]"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <article className="mx-auto max-w-[760px]">
        <Link
          href="/"
          className="font-display inline-block mb-[var(--space-10)]"
          style={{ fontSize: "var(--text-2xl)", color: "var(--text-primary)" }}
        >
          ProveIt
        </Link>

        <p className="section-label mb-[var(--space-4)]">PRIVACY</p>
        <h1
          className="font-display mb-[var(--space-3)]"
          style={{
            fontSize: "var(--text-4xl)",
            lineHeight: "var(--leading-tight)",
            color: "var(--text-primary)",
          }}
        >
          Privacy notice
        </h1>
        <p className="font-sans mb-[var(--space-10)] text-sm" style={{ color: "var(--text-secondary)" }}>
          Last updated {LAST_UPDATED}. ProveIt is a small independent project
          operated by Claire Donald. This notice explains what the service
          collects, why it is needed, and how to contact me about it.
        </p>

        <div
          className="space-y-[var(--space-8)] font-sans"
          style={{ color: "var(--text-secondary)", lineHeight: "var(--leading-relaxed)" }}
        >
          <section>
            <h2 className="font-display mb-[var(--space-3)] text-2xl" style={{ color: "var(--text-primary)" }}>
              What ProveIt collects
            </h2>
            <ul className="list-disc space-y-[var(--space-2)] pl-5">
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Ideas and conversations:</strong>{" "}
                the product idea, answers, and chat messages you submit are
                sent to Anthropic to generate the validation and research
                response. Full Validation may use Anthropic&apos;s web-search
                capability.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Contact and intent details:</strong>{" "}
                if you use the waitlist or pricing-intent form, ProveIt
                receives your email address, optional note or idea excerpt,
                selected pricing option, intended use, and the IP address
                associated with the request.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Orders:</strong>{" "}
                if you use the paid-bundle flow, ProveIt stores an order
                record, idea summary, submitted transcript, payment status,
                and the email Stripe provides after checkout. Stripe handles
                card details; ProveIt does not receive or store your full
                payment-card number.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Technical information:</strong>{" "}
                IP addresses are used for rate limiting, abuse prevention, and
                spend controls. The browser also uses essential local storage
                for the resumable ProveIt session.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Optional analytics:</strong>{" "}
                PostHog is off by default. If you allow analytics, it may
                receive page and feature events, browser/device information,
                and error metadata. ProveIt does not intentionally send your
                idea or chat text to client-side PostHog analytics.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display mb-[var(--space-3)] text-2xl" style={{ color: "var(--text-primary)" }}>
              Why and where information is used
            </h2>
            <p>
              Information is used to provide the validation service, return
              results, fulfil paid orders, respond to requests, prevent abuse,
              protect the service from unexpected spend, and improve reliability
              where analytics has been enabled.
            </p>
            <p className="mt-[var(--space-3)]">
              ProveIt uses third-party providers to run these functions:
              Anthropic for AI processing and research, Supabase for selected
              application records, Resend for notification and fulfilment
              email, Stripe for payment checkout, PostHog for optional
              analytics, and hosting/infrastructure providers to serve the
              application. These providers process information under their own
              terms and privacy notices.
            </p>
          </section>

          <section>
            <h2 className="font-display mb-[var(--space-3)] text-2xl" style={{ color: "var(--text-primary)" }}>
              Analytics choices
            </h2>
            <p className="mb-[var(--space-4)]">
              PostHog analytics and its cookies/local storage do not start
              until you choose “Allow analytics”. You can change your choice
              here at any time. Essential session storage remains available
              because it is needed for the product to work.
            </p>
            <div
              className="rounded-[var(--radius-lg)] border p-[var(--space-4)]"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
              }}
            >
              <AnalyticsConsentControls />
            </div>
          </section>

          <section>
            <h2 className="font-display mb-[var(--space-3)] text-2xl" style={{ color: "var(--text-primary)" }}>
              Retention and deletion
            </h2>
            <p>
              Submitted contact, intent, and order records are kept only while
              they are needed to respond, provide the service, fulfil an
              order, maintain operational records, or resolve disputes. Some
              deletion work is handled manually because this is a small
              project and it does not yet have an automated retention schedule
              for every provider. Provider logs and backups may persist for
              longer under the provider&apos;s own policies.
            </p>
            <p className="mt-[var(--space-3)]">
              To ask for access, correction, or deletion, email{" "}
              <a className="underline underline-offset-2" href="mailto:cla1re@me.com">
                cla1re@me.com
              </a>
              . Please include enough detail to identify the submission, but do
              not send passwords or payment-card details.
            </p>
          </section>

          <section>
            <h2 className="font-display mb-[var(--space-3)] text-2xl" style={{ color: "var(--text-primary)" }}>
              Your choices and rights
            </h2>
            <p>
              Depending on where you live, you may have rights to access,
              correct, delete, restrict, or object to the use of your
              personal information, to withdraw analytics consent, and to
              complain to your local data-protection authority. Contact me
              first and I will respond as soon as reasonably practical.
            </p>
          </section>

          <section>
            <h2 className="font-display mb-[var(--space-3)] text-2xl" style={{ color: "var(--text-primary)" }}>
              Security and sensitive information
            </h2>
            <p>
              ProveIt uses HTTPS, server-side environment variables for
              credentials, database access controls, rate limiting, and signed
              payment webhooks. No online service is completely secure. Do not
              submit health, financial, employment, client-confidential, or
              other sensitive information unless you are comfortable with it
              being processed by the providers described above.
            </p>
          </section>

          <section>
            <h2 className="font-display mb-[var(--space-3)] text-2xl" style={{ color: "var(--text-primary)" }}>
              Children and changes
            </h2>
            <p>
              ProveIt is not directed at children and I do not knowingly
              collect information from children. This notice may change as the
              service changes; the “last updated” date above will change with
              material updates.
            </p>
          </section>

          <section
            className="border-t pt-[var(--space-6)]"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <p className="text-sm">
              Questions or privacy requests:{" "}
              <a className="underline underline-offset-2" href="mailto:cla1re@me.com">
                cla1re@me.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
