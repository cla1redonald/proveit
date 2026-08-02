import { test, expect } from "@playwright/test";

test("validate flow opens chat after idea submit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
      body: "Welcome — tell me more about the problem you are solving.\n",
    });
  });

  await page.goto("/validate");
  await page
    .getByRole("textbox", { name: /describe your product idea/i })
    .fill("A calendar app that schedules focus blocks for engineers automatically");
  await page.getByRole("button", { name: /start validation/i }).click();

  await expect(page.getByLabel(/Phase 1 of 4: BRAIN DUMP/i)).toBeVisible();
  await expect(page.getByText(/Welcome — tell me more/i)).toBeVisible();
  await expect(page.getByRole("textbox", { name: /type your answer/i })).toBeVisible();
});
