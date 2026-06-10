import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FullBundlePointer from "@/components/validate/FullBundlePointer";

describe("FullBundlePointer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the one-off £4.99 button and the free Claude Code fallback", () => {
    render(<FullBundlePointer />);
    expect(
      screen.getByRole("button", { name: /£4\.99.*one-off/i })
    ).toBeInTheDocument();
    // Subscription button is deferred to #37 — should NOT be present
    expect(
      screen.queryByRole("button", { name: /£9\.99\/mo/i })
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: /claude code/i })
    ).toHaveAttribute("href", "https://claude.com/claude-code");
  });

  it("redirects to the Stripe checkout URL when the one-off button is clicked and checkout succeeds", async () => {
    const assignMock = vi.fn();
    // jsdom doesn't support window.location.assign natively — stub it
    Object.defineProperty(window, "location", {
      value: { assign: assignMock },
      writable: true,
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ url: "https://checkout.stripe.com/pay/test_123" }), {
        status: 200,
      })
    );

    render(<FullBundlePointer />);
    fireEvent.click(screen.getByRole("button", { name: /£4\.99.*one-off/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/stripe/checkout",
        expect.objectContaining({ method: "POST" })
      );
    });

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("https://checkout.stripe.com/pay/test_123");
    });
  });

  it("falls back to the WoZ modal when the checkout API returns 503 (Stripe not configured)", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Payment processing is not available yet." }),
        { status: 503 }
      )
    );

    render(<FullBundlePointer />);
    fireEvent.click(screen.getByRole("button", { name: /£4\.99.*one-off/i }));

    // The WoZ modal should open as a fallback
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Modal should show the one-off label
    expect(screen.getByRole("dialog").textContent).toMatch(/£4\.99 \(one-off\)/);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("WoZ modal submits to /api/woz-intent when shown via the 503 fallback", async () => {
    // First fetch: 503 from checkout → triggers modal
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "not available" }), { status: 503 })
      )
      // Second fetch: WoZ submit succeeds
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

    render(<FullBundlePointer />);
    fireEvent.click(screen.getByRole("button", { name: /£4\.99.*one-off/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/what will you use this for/i), {
      target: { value: "demo use case" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send me the bundle/i }));

    await waitFor(() => {
      // The second fetch should go to /api/woz-intent
      const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
      expect(fetchMock.mock.calls[1][0]).toBe("/api/woz-intent");
    });

    await screen.findByText(/Claire will personally email you the bundle within 4 hours/i);
  });

  it("shows an error message when the checkout API returns a non-503 error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Something went wrong" }),
        { status: 500 }
      )
    );

    render(<FullBundlePointer />);
    fireEvent.click(screen.getByRole("button", { name: /£4\.99.*one-off/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByRole("alert").textContent).toMatch(/something went wrong/i);
    // Modal should NOT open — this is a server error, not a 503 config signal
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
