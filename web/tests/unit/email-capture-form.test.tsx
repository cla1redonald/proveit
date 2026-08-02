import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailCaptureForm from "@/components/EmailCaptureForm";

vi.mock("@/lib/posthog", () => ({
  captureEvent: vi.fn(),
}));

describe("EmailCaptureForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      }),
    );
  });

  it("renders waitlist copy for global_cap", () => {
    render(<EmailCaptureForm reason="global_cap" ideaExcerpt="My product idea" />);
    expect(screen.getByText(/Want more access/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /let me know/i })).toBeDisabled();
  });

  it("submits email to /api/waitlist and shows thanks state", async () => {
    const user = userEvent.setup();
    const onSubmitted = vi.fn();

    render(
      <EmailCaptureForm
        reason="per_ip_cap"
        ideaExcerpt="Focus scheduling for engineers"
        onSubmitted={onSubmitted}
      />,
    );

    await user.type(screen.getByLabelText(/email address/i), "pm@example.com");
    await user.type(
      screen.getByLabelText(/optional note/i),
      "Hit the daily cap while testing",
    );
    await user.click(screen.getByRole("button", { name: /let me know/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/Thanks/i);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/waitlist",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("pm@example.com"),
      }),
    );
    expect(onSubmitted).toHaveBeenCalledOnce();
  });

  it("shows server error message on failed submit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "That email looks invalid" }),
      }),
    );

    const user = userEvent.setup();
    render(<EmailCaptureForm reason="global_cap" />);

    await user.type(screen.getByLabelText(/email address/i), "bad@example.com");
    await user.click(screen.getByRole("button", { name: /let me know/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That email looks invalid",
    );
  });
});
