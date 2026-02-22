// Client-side utility

import type { ValidationSession } from "@/types";

/**
 * Generates a markdown summary document for download.
 * Called by DownloadButton when session.phase === "complete".
 */
export function generateDiscoveryMarkdown(session: ValidationSession): string {
  const date = new Date(session.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const scores = session.scores;
  const desirability = scores.desirability !== null ? `${scores.desirability}/10` : "Not assessed";
  const viability = scores.viability !== null ? `${scores.viability}/10` : "Not assessed";
  const feasibility = scores.feasibility !== null ? `${scores.feasibility}/10` : "Not assessed";

  const killSignalSection =
    session.killSignals.length > 0
      ? `## Kill Signals\n\n${session.killSignals
          .map((s) => `- **${s.type}**: ${s.evidence}`)
          .join("\n")}\n`
      : "";

  const conversation = session.messages
    .map((m) => {
      const role = m.role === "user" ? "PM" : "ProveIt";
      return `**${role}:** ${m.content}`;
    })
    .join("\n\n");

  return `# ProveIt: ${session.ideaSummary}

Generated: ${date}

## Confidence Scores

Desirability: ${desirability} | Viability: ${viability} | Feasibility: ${feasibility}

${killSignalSection}## Conversation

${conversation}
`;
}
