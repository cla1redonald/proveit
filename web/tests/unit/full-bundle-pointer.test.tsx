import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FullBundlePointer from "@/components/validate/FullBundlePointer";

describe("FullBundlePointer", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders both pricing buttons and the free Claude Code fallback", () => {
    render(<FullBundlePointer />);
    expect(
      screen.getByRole("button", { name: /£4\.99.*one-off/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /£9\.99\/mo/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /claude code/i })
    ).toHaveAttribute("href", "https://claude.com/claude-code");
  });

  it("opens the modal with the one-off label when £4.99 is clicked", () => {
    render(<FullBundlePointer />);
    fireEvent.click(screen.getByRole("button", { name: /£4\.99.*one-off/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.textContent).toMatch(/£4\.99 \(one-off\)/);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/what will you use this for/i)).toBeInTheDocument();
  });

  it("POSTs to /api/woz-intent with the chosen option and shows the confirmation", async () => {
    render(<FullBundlePointer />);
    fireEvent.click(screen.getByRole("button", { name: /£9\.99\/mo/i }));
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/what will you use this for/i), {
      target: { value: "demo use case" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send me the bundle/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/woz-intent",
        expect.objectContaining({ method: "POST" })
      );
    });

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.chosenOption).toBe("subscription");
    expect(body.email).toBe("test@example.com");
    expect(body.intendedUse).toBe("demo use case");

    await screen.findByText(/Claire will personally email you the bundle within 4 hours/i);
  });
});
