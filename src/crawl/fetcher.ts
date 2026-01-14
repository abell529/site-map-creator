export type FetchResult = {
  requestedUrl: string;
  finalUrl: string;
  status: number | null;
  contentType: string | null;
  body: string;
};

export type FetchOptions = {
  followRedirects: boolean;
};

export async function fetchPage(url: string, options: FetchOptions): Promise<FetchResult> {
  const response = await fetch(url, {
    redirect: options.followRedirects ? "follow" : "manual",
    headers: {
      "user-agent": "linksieve/0.1.0"
    }
  });

  const status = response.status ?? null;
  if (status === 403 || status === 429) {
    throw new Error(
      `Blocked by target site (HTTP ${status}). The crawl was stopped. The site may have rate limits or bot protection.`
    );
  }

  const contentType = response.headers.get("content-type");
  const body = await response.text();

  return {
    requestedUrl: url,
    finalUrl: response.url || url,
    status,
    contentType,
    body
  };
}
