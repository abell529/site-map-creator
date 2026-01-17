import { describe, expect, it } from "vitest";
import { matchesAny, parseMatcher } from "../src/crawl/matcher.js";
describe("matcher logic", () => {
    it("matches contains matcher", () => {
        const matcher = parseMatcher("contains:example");
        expect(matchesAny("https://example.com", [matcher])).toBe(true);
    });
    it("matches regex matcher", () => {
        const matcher = parseMatcher("regex:example\\.com");
        expect(matchesAny("https://example.com/path", [matcher])).toBe(true);
    });
    it("matches domain matcher", () => {
        const matcher = parseMatcher("domain:example.com");
        expect(matchesAny("https://sub.example.com", [matcher])).toBe(true);
    });
});
