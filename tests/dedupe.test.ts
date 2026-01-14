import { describe, expect, it } from "vitest";

import { DedupeSet } from "../src/crawl/dedupe.js";

describe("DedupeSet", () => {
  it("deduplicates by source and link", () => {
    const dedupe = new DedupeSet();
    expect(dedupe.add("https://example.com", "https://example.com/a")).toBe(true);
    expect(dedupe.add("https://example.com", "https://example.com/a")).toBe(false);
    expect(dedupe.add("https://example.com", "https://example.com/b")).toBe(true);
  });
});
