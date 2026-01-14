import { describe, expect, it } from "vitest";

import { normalizeUrl } from "../src/crawl/normalizer.js";

describe("normalizeUrl", () => {
  it("resolves relative URLs and strips fragments", () => {
    const normalized = normalizeUrl("/about#team", { baseUrl: "https://example.com/start" });
    expect(normalized).toBe("https://example.com/about");
  });

  it("keeps query strings", () => {
    const normalized = normalizeUrl("https://example.com/page?ref=1#section");
    expect(normalized).toBe("https://example.com/page?ref=1");
  });

  it("returns null for non-http protocols", () => {
    expect(normalizeUrl("mailto:test@example.com")).toBeNull();
  });
});
