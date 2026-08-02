import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  isUpstashConfigured,
  requireUpstashInProduction,
  upstashRequiredInProduction,
} from "@/lib/upstash-guard";

describe("upstash-guard", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("isUpstashConfigured is false when env vars are missing", () => {
    expect(isUpstashConfigured()).toBe(false);
  });

  it("isUpstashConfigured is true when both env vars are set", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    expect(isUpstashConfigured()).toBe(true);
  });

  it("requireUpstashInProduction allows missing Upstash in test/dev", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(requireUpstashInProduction()).toBeNull();
  });

  it("requireUpstashInProduction returns 503 in production without Upstash", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = requireUpstashInProduction();
    expect(res?.status).toBe(503);
    expect(await res?.json()).toMatchObject({ error: expect.stringMatching(/misconfigured/i) });
  });

  it("requireUpstashInProduction passes in production when Upstash is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    expect(requireUpstashInProduction()).toBeNull();
  });

  it("upstashRequiredInProduction only triggers for NODE_ENV=production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(upstashRequiredInProduction()).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    expect(upstashRequiredInProduction()).toBe(true);
  });
});
