"use client";

import { useState, useRef, useCallback } from "react";
import { readStream } from "@/lib/streaming";
import type { StreamEvent } from "@/types";

interface UseStreamReturn {
  isStreaming: boolean;
  error: string | null;
  /**
   * When the API returns a 503 from the spend-ledger circuit breaker, this
   * is set to the `reason` field from the response body — `global_cap` or
   * `per_ip_cap`. Stays null for any other error. Lets the UI decide
   * whether to show the EmailCaptureForm and which framing to use.
   */
  errorReason: "global_cap" | "per_ip_cap" | null;
  startStream: (
    url: string,
    body: unknown,
    onText: (chunk: string) => void,
    onEvent: (event: StreamEvent) => void
  ) => Promise<void>;
  stopStream: () => void;
}

export function useStream(): UseStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorReason, setErrorReason] = useState<"global_cap" | "per_ip_cap" | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (
      url: string,
      body: unknown,
      onText: (chunk: string) => void,
      onEvent: (event: StreamEvent) => void
    ) => {
      setError(null);
      setErrorReason(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Request failed" }));
          // Capture the spend-ledger reason if present
          if (errorData.reason === "global_cap" || errorData.reason === "per_ip_cap") {
            setErrorReason(errorData.reason);
          }
          throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        await readStream(response, onText, onEvent);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User stopped the stream intentionally — not an error
          return;
        }
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setError(message);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { isStreaming, error, errorReason, startStream, stopStream };
}
