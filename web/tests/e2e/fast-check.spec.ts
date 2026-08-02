import { test, expect } from "@playwright/test";

const fastStreamBody = `**Assumption 1: Desirability — Teams need async standups**

Verdict: SUPPORTED

Evidence:
- remote-work.com: Distributed teams report daily coordination friction

**Assumption 2: Viability — Budget exists for team tools**

Verdict: WEAK

Evidence:
- pricing-surveys.com: SMB spend remains constrained

**Quick verdict:** Desirability looks real, but monetisation is the risk.
`;

test("fast check renders assumption cards from mocked stream", async ({ page }) => {
  await page.route("**/api/fast", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
      body: fastStreamBody,
    });
  });

  await page.goto("/fast");
  await page
    .getByRole("textbox", { name: /describe your product idea/i })
    .fill("Async standup tool for distributed engineering teams");
  await page.getByRole("button", { name: /run fast check/i }).click();

  await expect(page.getByText("FAST CHECK")).toBeVisible();
  await expect(page.getByText("SUPPORTED")).toBeVisible();
  await expect(page.getByText(/monetisation is the risk/i)).toBeVisible();
});
