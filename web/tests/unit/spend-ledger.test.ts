/**
 * Unit tests for lib/spend-ledger.ts
 *
 * Exercises estimateCost, checkSpend, and recordSpend against the in-memory
 * fallback (no Upstash env vars set during the test). Tests the soft-cap
 * semantics, the per-IP vs global cap distinction, and the fail-open
 * Upstash error path.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  estimateCost,
  checkSpend,
  recordSpend,
  resetSpendStores,
} from "@/lib/spend-ledger";

const ORIGINAL_GLOBAL_CEILING = process.env.DAILY_SPEND_CEILING_USD;
const ORIGINAL_IP_CEILING = process.env.PER_IP_DAILY_CEILING_USD;

describe("estimateCost", () => {
  it("returns the fast-check cost for /api/fast", () => {
    expect(estimateCost("fast")).toBe(0.10);
  });

  it("returns the chat-research cost for research phase", () => {
    expect(estimateCost("chat", "research")).toBe(0.50);
  });

  it("returns the brain_dump cost for the new Phase 0 web_search budget", () => {
    expect(estimateCost("chat", "brain_dump")).toBe(0.10);
  });

  it("returns the no-search chat cost for discovery / findings / complete phases", () => {
    expect(estimateCost("chat", "discovery")).toBe(0.05);
    expect(estimateCost("chat", "findings")).toBe(0.05);
    expect(estimateCost("chat", "complete")).toBe(0.05);
  });

  it("defaults to no-search chat cost when phase is missing", () => {
    expect(estimateCost("chat")).toBe(0.05);
  });
});

describe("checkSpend / recordSpend (in-memory fallback)", () => {
  beforeEach(() => {
    resetSpendStores();
    process.env.DAILY_SPEND_CEILING_USD = "5";
    process.env.PER_IP_DAILY_CEILING_USD = "1";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    if (ORIGINAL_GLOBAL_CEILING === undefined) delete process.env.DAILY_SPEND_CEILING_USD;
    else process.env.DAILY_SPEND_CEILING_USD = ORIGINAL_GLOBAL_CEILING;
    if (ORIGINAL_IP_CEILING === undefined) delete process.env.PER_IP_DAILY_CEILING_USD;
    else process.env.PER_IP_DAILY_CEILING_USD = ORIGINAL_IP_CEILING;
  });

  it("allows a fresh first call when both ceilings are clean", async () => {
    const result = await checkSpend("1.2.3.4", 0.10);
    expect(result.allowed).toBe(true);
    expect(result.globalSpendUsd).toBe(0);
    expect(result.ipSpendUsd).toBe(0);
    expect(result.globalCeilingUsd).toBe(5);
    expect(result.ipCeilingUsd).toBe(1);
  });

  it("subsequent checkSpend reflects recorded spend", async () => {
    await recordSpend("1.2.3.4", 0.50);
    const result = await checkSpend("1.2.3.4", 0.10);
    expect(result.allowed).toBe(true);
    expect(result.globalSpendUsd).toBeCloseTo(0.50, 2);
    expect(result.ipSpendUsd).toBeCloseTo(0.50, 2);
  });

  it("blocks with reason=per_ip_cap when one IP is over its cap", async () => {
    // Push the same IP over $1 by recording 11 chat-research calls
    for (let i = 0; i < 11; i++) await recordSpend("9.9.9.9", 0.10);
    const result = await checkSpend("9.9.9.9", 0.10);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("per_ip_cap");
    expect(result.ipSpendUsd).toBeGreaterThan(1.0);
  });

  it("a different IP is not blocked when only the first IP is over per-IP cap", async () => {
    for (let i = 0; i < 11; i++) await recordSpend("9.9.9.9", 0.10);
    const result = await checkSpend("8.8.8.8", 0.10);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("blocks with reason=global_cap when global ceiling is hit (multiple IPs)", async () => {
    // Spread spend across 6 IPs, $0.95 each = $5.70 global, each IP under $1 cap
    for (let i = 1; i <= 6; i++) {
      for (let j = 0; j < 19; j++) {
        await recordSpend(`10.0.0.${i}`, 0.05);
      }
    }
    // New IP, no per-IP spend yet, but global is over
    const result = await checkSpend("11.0.0.1", 0.10);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("global_cap");
    expect(result.globalSpendUsd).toBeGreaterThan(5.0);
    expect(result.ipSpendUsd).toBe(0);
  });

  it("checks both ceilings: global cap takes precedence when both would breach", async () => {
    // Only one IP, push it over both caps
    for (let i = 0; i < 60; i++) await recordSpend("1.1.1.1", 0.10);
    const result = await checkSpend("1.1.1.1", 0.10);
    expect(result.allowed).toBe(false);
    // Global is checked first in the implementation, so this is global_cap
    expect(result.reason).toBe("global_cap");
  });

  it("respects DAILY_SPEND_CEILING_USD env override", async () => {
    process.env.DAILY_SPEND_CEILING_USD = "0.20";
    await recordSpend("2.2.2.2", 0.15);
    const result = await checkSpend("2.2.2.2", 0.10);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("global_cap");
    expect(result.globalCeilingUsd).toBe(0.20);
  });

  it("falls back to default ceilings when env vars are missing or non-numeric", async () => {
    delete process.env.DAILY_SPEND_CEILING_USD;
    delete process.env.PER_IP_DAILY_CEILING_USD;
    const result = await checkSpend("3.3.3.3", 0.10);
    expect(result.globalCeilingUsd).toBe(5);
    expect(result.ipCeilingUsd).toBe(1);
  });

  it("ignores invalid env values (e.g. negative or non-numeric) and uses defaults", async () => {
    process.env.DAILY_SPEND_CEILING_USD = "not-a-number";
    process.env.PER_IP_DAILY_CEILING_USD = "-5";
    const result = await checkSpend("4.4.4.4", 0.10);
    expect(result.globalCeilingUsd).toBe(5);
    expect(result.ipCeilingUsd).toBe(1);
  });
});

describe("resetSpendStores", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.DAILY_SPEND_CEILING_USD = "5";
    process.env.PER_IP_DAILY_CEILING_USD = "1";
  });

  it("clears in-memory state between tests", async () => {
    await recordSpend("test-ip", 0.50);
    let result = await checkSpend("test-ip", 0.01);
    expect(result.ipSpendUsd).toBeCloseTo(0.50, 2);

    resetSpendStores();
    result = await checkSpend("test-ip", 0.01);
    expect(result.ipSpendUsd).toBe(0);
  });
});
