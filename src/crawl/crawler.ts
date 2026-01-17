import { DedupeSet } from "./dedupe.js";
import { fetchPage } from "./fetcher.js";
import { matchesAny, type Matcher } from "./matcher.js";
import { isAllowedDomain, normalizeUrl } from "./normalizer.js";
import { extractLinks } from "./parser.js";
import { CrawlQueue, type QueueItem } from "./queue.js";
import { CsvWriter } from "../output/csv.js";
import { JsonlWriter } from "../output/jsonl.js";
import { JsonlStore } from "../storage/jsonl-store.js";

export type CrawlOptions = {
  startUrl: string;
  allowedDomains: string[];
  maxPages: number;
  maxDepth: number;
  concurrency: number;
  delayMs: number;
  matchers: Matcher[];
  followRedirects: boolean;
  outputPath: string;
  format: "csv" | "jsonl";
  render: boolean;
  dataDir: string;
  userAgent: string;
};

export type CrawlResult = {
  pagesVisited: number;
  resultsFound: number;
};

export async function crawlSite(options: CrawlOptions): Promise<CrawlResult> {
  const queue = new CrawlQueue();
  const visited = new Set<string>();
  const dedupe = new DedupeSet();
  const store = new JsonlStore({ dataDir: options.dataDir });
  const writer = options.format === "csv" ? new CsvWriter({ outputPath: options.outputPath }) : null;
  const jsonlWriter = options.format === "jsonl" ? new JsonlWriter({ outputPath: options.outputPath }) : null;

  const normalizedStart = normalizeUrl(options.startUrl);
  if (!normalizedStart) {
    throw new Error(`Invalid start URL: ${options.startUrl}`);
  }

  queue.enqueue({ url: normalizedStart, depth: 0 });
  visited.add(normalizedStart);

  let pagesVisited = 0;
  let resultsFound = 0;

  const renderer = options.render ? new RenderedFetcher(options.userAgent, options.followRedirects) : null;
  if (renderer) {
    await renderer.init();
  }

  async function processQueueItem(item: QueueItem): Promise<void> {
    if (pagesVisited >= options.maxPages) return;
    const result = renderer
      ? await renderer.fetch(item.url)
      : await fetchPage(item.url, { followRedirects: options.followRedirects, userAgent: options.userAgent });

    if (!isAllowedDomain(result.finalUrl, options.allowedDomains)) {
      throw new Error(
        `Redirected to a URL outside allowed domains: ${result.finalUrl}. Adjust --allowed or disable redirects.`
      );
    }

    pagesVisited += 1;

    store.recordPage({
      requestedUrl: result.requestedUrl,
      finalUrl: result.finalUrl,
      status: result.status,
      depth: item.depth
    });

    const isHtml = result.contentType?.includes("text/html") || result.contentType?.includes("application/xhtml+xml");
    if (!isHtml && result.contentType) {
      return;
    }

    const rawLinks = extractLinks(result.body);
    for (const rawLink of rawLinks) {
      const normalized = normalizeUrl(rawLink, { baseUrl: result.finalUrl });
      if (!normalized) continue;

      if (matchesAny(normalized, options.matchers)) {
        if (dedupe.add(result.finalUrl, normalized)) {
          resultsFound += 1;
          if (writer) {
            writer.writeRow(result.finalUrl, normalized);
          }
          if (jsonlWriter) {
            jsonlWriter.writeRow({ Page: result.finalUrl, Link: normalized });
          }
          store.recordResult({ page: result.finalUrl, link: normalized });
        }
      }

      if (item.depth < options.maxDepth && isAllowedDomain(normalized, options.allowedDomains)) {
        if (!visited.has(normalized) && pagesVisited + queue.length < options.maxPages) {
          visited.add(normalized);
          queue.enqueue({ url: normalized, depth: item.depth + 1 });
        }
      }
    }
  }

  async function worker(): Promise<void> {
    while (true) {
      const item = queue.dequeue();
      if (!item) break;
      if (pagesVisited >= options.maxPages) break;
      await processQueueItem(item);
      await delay(options.delayMs);
    }
  }

  const workerCount = Math.max(1, options.concurrency);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (renderer) {
    await renderer.close();
  }
  await store.close();
  if (writer) {
    await writer.end();
  }
  if (jsonlWriter) {
    await jsonlWriter.end();
  }

  return { pagesVisited, resultsFound };
}

function delay(ms: number): Promise<void> {
  const jitter = Math.floor(Math.random() * Math.max(1, ms * 0.2));
  const total = ms + jitter;
  return new Promise((resolve) => setTimeout(resolve, total));
}

class RenderedFetcher {
  private browser: import("playwright").Browser | null = null;
  private context: import("playwright").BrowserContext | null = null;
  private readonly userAgent: string;
  private readonly followRedirects: boolean;

  constructor(userAgent: string, followRedirects: boolean) {
    this.userAgent = userAgent;
    this.followRedirects = followRedirects;
  }

  async init(): Promise<void> {
    const playwright = await import("playwright");
    this.browser = await playwright.chromium.launch();
    this.context = await this.browser.newContext({ userAgent: this.userAgent });
  }

  async fetch(
    url: string
  ): Promise<{ requestedUrl: string; finalUrl: string; status: number | null; contentType: string | null; body: string }> {
    if (!this.browser || !this.context) {
      throw new Error("Rendered fetcher not initialized.");
    }

    const page = await this.context.newPage();
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? null;
      if (status === 403 || status === 429) {
        throw new Error(
          `Blocked by target site (HTTP ${status}). The crawl was stopped. The site may have rate limits or bot protection.`
        );
      }
      const finalUrl = page.url();
      const contentType = response?.headers()["content-type"] ?? null;
      const body = await page.content();
      return { requestedUrl: url, finalUrl, status, contentType, body };
    } catch (error) {
      if (isDownloadError(error)) {
        return fetchPage(url, { followRedirects: this.followRedirects, userAgent: this.userAgent });
      }
      throw error;
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    await this.context?.close();
    this.context = null;
    await this.browser?.close();
    this.browser = null;
  }
}

function isDownloadError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Download is starting");
}
