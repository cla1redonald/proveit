import "server-only";

/** Token usage from Anthropic when available on streamed responses. */
export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

/**
 * Log estimated vs observed token usage so spend-ledger constants can be retuned.
 * No user-facing behaviour change — structured server log only.
 */
export function logSpendCalibration(args: {
  endpoint: "fast" | "chat";
  phase?: string;
  estimatedUsd: number;
  usage?: AnthropicUsage | null;
}): void {
  const { endpoint, phase, estimatedUsd, usage } = args;
  if (!usage || (usage.input_tokens === 0 && usage.output_tokens === 0)) return;

  console.info(
    "[spend-calibration]",
    JSON.stringify({
      endpoint,
      ...(phase ? { phase } : {}),
      estimated_usd: estimatedUsd,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
    })
  );
}

/** Partial usage shape from Anthropic stream events (nullable fields). */
type StreamUsageFields = {
  input_tokens?: number | null;
  output_tokens?: number | null;
};

/** Accumulate usage from Anthropic streaming events. */
export function trackStreamUsage(
  event: {
    type: string;
    message?: { usage?: StreamUsageFields };
    usage?: StreamUsageFields;
  },
  current: AnthropicUsage
): AnthropicUsage {
  if (event.type === "message_start") {
    const input = event.message?.usage?.input_tokens;
    if (input != null) current.input_tokens = input;
  }
  if (event.type === "message_delta") {
    const output = event.usage?.output_tokens;
    if (output != null) current.output_tokens = output;
  }
  return current;
}
