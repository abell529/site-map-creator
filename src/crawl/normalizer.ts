export type NormalizeOptions = {
  baseUrl?: string;
};

export function normalizeUrl(rawUrl: string, options: NormalizeOptions = {}): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("javascript:") || trimmed.startsWith("tel:")) {
    return null;
  }

  try {
    const url = options.baseUrl ? new URL(trimmed, options.baseUrl) : new URL(trimmed);
    if (!url.protocol.startsWith("http")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function isAllowedDomain(url: string, allowedDomains: string[]): boolean {
  try {
    const { hostname } = new URL(url);
    return allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}
