#!/usr/bin/env node
import path from "node:path";

import { Command } from "commander";

import { crawlSite } from "./crawl/crawler.js";
import { parseMatcher } from "./crawl/matcher.js";
import { normalizeUrl } from "./crawl/normalizer.js";

const program = new Command();

program
  .name("linksieve")
  .description("Local-only CLI crawler that extracts user-designated links.")
  .version("0.1.0");

program
  .command("crawl")
  .argument("<startUrl>", "Starting URL to crawl")
  .option("--allowed <domain>", "Allowed domain (repeatable)", collect)
  .option("--max-pages <n>", "Maximum pages to crawl", "500")
  .option("--max-depth <n>", "Maximum crawl depth", "5")
  .option("--concurrency <n>", "Concurrent fetches", "3")
  .option("--delay-ms <n>", "Delay between requests in ms", "200")
  .option("--match <matcher>", "Matcher (repeatable)", collect)
  .option("--follow-redirects <bool>", "Follow redirects", "true")
  .option("--output <path>", "Output path", "./linksieve-results.csv")
  .option("--format <format>", "Output format: csv|jsonl", "csv")
  .option("--render", "Use Playwright to render pages", false)
  .action(async (startUrl, options) => {
    try {
      const normalizedStart = normalizeUrl(startUrl);
      if (!normalizedStart) {
        throw new Error(`Invalid start URL: ${startUrl}`);
      }

      const startDomain = new URL(normalizedStart).hostname;
      const allowedDomains = options.allowed?.length ? options.allowed : [startDomain];
      const matchers = (options.match ?? []).map((matcher: string) => parseMatcher(matcher));

      const outputPath = path.resolve(process.cwd(), options.output);
      const dataDir = path.resolve(process.cwd(), ".linksieve-data");

      const result = await crawlSite({
        startUrl: normalizedStart,
        allowedDomains,
        maxPages: Number(options.maxPages),
        maxDepth: Number(options.maxDepth),
        concurrency: Number(options.concurrency),
        delayMs: Number(options.delayMs),
        matchers,
        followRedirects: parseBoolean(options.followRedirects),
        outputPath,
        format: options.format === "jsonl" ? "jsonl" : "csv",
        render: Boolean(options.render),
        dataDir
      });

      console.log(`Crawl complete. Pages visited: ${result.pagesVisited}. Results found: ${result.resultsFound}.`);
      console.log("Note: linksieve does not enforce robots.txt by default.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Crawl failed: ${message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

function collect(value: string, previous: string[] = []): string[] {
  return previous.concat([value]);
}

function parseBoolean(value: string): boolean {
  return value === "true" || value === "1";
}
