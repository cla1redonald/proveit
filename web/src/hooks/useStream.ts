"use client";

import { useState, useRef, useCallback } from "react";
import { readStream } from "@/lib/streaming";
import type { StreamEvent } from "@/types";

interface UseStreamReturn {
  isStreaming: boolean;
  error: string | null;
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (
      url: string,
      body: unknown,
      onText: (chunk: string) => void,
      onEvent: (event: StreamEvent) => void
    ) => {
      setError(null);
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

  return { isStreaming, error, startStream, stopStream };
}
