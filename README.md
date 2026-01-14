# linksieve

Local-only CLI crawler that extracts user-designated links into CSV or JSONL output.

> Note: linksieve does **not** enforce robots.txt by default.

## Install

```bash
npm install
npm run build
```

## Example crawl

```bash
npm run crawl -- https://example.com --match contains:pricing --output ./linksieve-results.csv
```

The CSV output uses headers `Page,Link` and records the final page URL after redirects.

## Matchers

Matchers can be repeated. Formats:

- `contains:<text>`
- `regex:<pattern>`
- `domain:<domain>`

Example:

```bash
npm run crawl -- https://example.com \
  --match contains:pricing \
  --match regex:example\\.com/news \
  --match domain:example.com
```

## Rendered mode

Use `--render` to load pages with Playwright for JavaScript-rendered content:

```bash
npm run crawl -- https://example.com --match contains:pricing --render
```

If Playwright is unable to access a page (HTTP 403/429), the crawl stops with a clear error.

## CLI options

- `linksieve crawl <startUrl>`
- `--allowed <domain>` (repeatable, defaults to the start URL domain)
- `--max-pages <n>` (default 500)
- `--max-depth <n>` (default 5)
- `--concurrency <n>` (default 3)
- `--delay-ms <n>` (default 200)
- `--match <matcher>` (repeatable)
- `--follow-redirects <bool>` (default true)
- `--output <path.csv>` (default `./linksieve-results.csv`)
- `--format csv|jsonl` (default csv)
- `--render` (use Playwright)
