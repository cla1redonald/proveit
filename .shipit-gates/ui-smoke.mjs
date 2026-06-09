/**
 * ui-smoke.mjs — the UI half of the runtime smoke gate.
 *
 * Loads the DEPLOYED page in a real browser (Playwright) and asserts it actually
 * RENDERS — not just that the server returned 200. Catches the failures a curl can't:
 * a white screen, an uncaught render error, a missing root element, a 5xx behind the
 * page. Console errors are reported (warn) and can hard-fail with SHIPIT_SMOKE_FAIL_ON_CONSOLE=1.
 *
 * Requires `playwright` in the project (`npm i -D playwright && npx playwright install chromium`).
 * Env: SHIPIT_SMOKE_UI_URL (required), SHIPIT_SMOKE_SELECTOR (default "body"),
 *      SHIPIT_SMOKE_FAIL_ON_CONSOLE ("1" to fail on console errors).
 */
import { chromium } from "playwright";

const url = process.env.SHIPIT_SMOKE_UI_URL;
const selector = process.env.SHIPIT_SMOKE_SELECTOR || "body";
const failOnConsole = process.env.SHIPIT_SMOKE_FAIL_ON_CONSOLE === "1";

if (!url) {
  console.log("ui-smoke: no SHIPIT_SMOKE_UI_URL — skipping.");
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => pageErrors.push(e.message));

let ok = true;
try {
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  const status = resp ? resp.status() : 0;
  if (status === 401 || status === 403) {
    // Auth-gated (e.g. Vercel deployment protection on a preview). The page that loads is the
    // protection/login screen, NOT the app — asserting a selector here would FALSE-PASS on it.
    // Skip the render check honestly rather than claim a render; the public PRODUCTION deploy
    // (deployment_status fires there too) is where the UI is actually verified.
    console.warn(`::warning::ui-smoke: ${url} → HTTP ${status} (auth-gated — likely deployment protection). The protection screen is not the app, so the render assertion is SKIPPED here, not false-passed. The production deploy verifies the UI.`);
    await browser.close();
    process.exit(0);
  }
  if (status >= 400) {
    // 404/4xx/5xx: the page did not load — never claim it "rendered".
    console.error(`::error::ui-smoke: ${url} → HTTP ${status} — page did not load`);
    ok = false;
  } else {
    await page.waitForSelector(selector, { state: "attached", timeout: 15000 });
    console.log(`ui-smoke: ${url} rendered (selector '${selector}' present) ✓`);
  }
} catch (e) {
  console.error(`::error::ui-smoke: ${url} did not render — ${e.message}`);
  ok = false;
}

if (pageErrors.length) {
  console.error(`::error::ui-smoke: ${pageErrors.length} uncaught page error(s): ${pageErrors.slice(0, 5).join(" | ")}`);
  ok = false;
}
if (consoleErrors.length) {
  const msg = `ui-smoke: ${consoleErrors.length} browser console error(s): ${consoleErrors.slice(0, 5).join(" | ")}`;
  if (failOnConsole) { console.error(`::error::${msg}`); ok = false; }
  else { console.warn(`::warning::${msg}`); }
}

await browser.close();
process.exit(ok ? 0 : 1);
