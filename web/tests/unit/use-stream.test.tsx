import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStream } from "@/hooks/useStream";
import { readStream } from "@/lib/streaming";

vi.mock("@/lib/streaming", () => ({
  readStream: vi.fn(),
}));

describe("useStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: {},
      }),
    );
  });

  it("streams text and clears error state on success", async () => {
    vi.mocked(readStream).mockImplementation(async (_res, onText) => {
      onText("Hello ");
      onText("world");
    });

    const { result } = renderHook(() => useStream());
    const onText = vi.fn();
    const onEvent = vi.fn();

    await act(async () => {
      await result.current.startStream("/api/chat", { idea: "test" }, onText, onEvent);
    });

    expect(onText).toHaveBeenCalledWith("Hello ");
    expect(onText).toHaveBeenCalledWith("world");
    expect(result.current.error).toBeNull();
    expect(result.current.errorReason).toBeNull();
    expect(result.current.isStreaming).toBe(false);
  });

  it("sets errorReason on 503 spend-cap responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          error: "ProveIt is at capacity for today.",
          reason: "global_cap",
        }),
      }),
    );

    const { result } = renderHook(() => useStream());

    await act(async () => {
      await result.current.startStream("/api/fast", { idea: "test" }, vi.fn(), vi.fn());
    });

    expect(result.current.errorReason).toBe("global_cap");
    expect(result.current.error).toMatch(/capacity/i);
    expect(readStream).not.toHaveBeenCalled();
  });

  it("sets per_ip_cap errorReason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          error: "Daily budget reached for this connection.",
          reason: "per_ip_cap",
        }),
      }),
    );

    const { result } = renderHook(() => useStream());

    await act(async () => {
      await result.current.startStream("/api/chat", {}, vi.fn(), vi.fn());
    });

    expect(result.current.errorReason).toBe("per_ip_cap");
  });

  it("uses fallback error when 503 body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => {
          throw new Error("not json");
        },
      }),
    );

    const { result } = renderHook(() => useStream());

    await act(async () => {
      await result.current.startStream("/api/fast", {}, vi.fn(), vi.fn());
    });

    expect(result.current.error).toBe("Request failed");
    expect(result.current.errorReason).toBeNull();
  });

  it("ignores AbortError when the user stops the stream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(Object.assign(new Error("Aborted"), { name: "AbortError" })),
    );

    const { result } = renderHook(() => useStream());

    await act(async () => {
      await result.current.startStream("/api/chat", {}, vi.fn(), vi.fn());
    });

    expect(result.current.error).toBeNull();
  });

  it("aborts an in-flight request via stopStream", async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url, init) => {
        capturedSignal = init?.signal as AbortSignal;
        return new Promise(() => {});
      }),
    );

    const { result } = renderHook(() => useStream());

    act(() => {
      void result.current.startStream("/api/chat", {}, vi.fn(), vi.fn());
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(true));

    act(() => {
      result.current.stopStream();
    });

    expect(capturedSignal?.aborted).toBe(true);
    expect(result.current.isStreaming).toBe(false);
  });
});
