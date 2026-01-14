export type Matcher =
  | { type: "contains"; value: string }
  | { type: "regex"; value: RegExp }
  | { type: "domain"; value: string };

export function parseMatcher(input: string): Matcher {
  const [prefix, ...rest] = input.split(":");
  const value = rest.join(":");
  if (!value) {
    throw new Error(`Invalid matcher: ${input}`);
  }

  switch (prefix) {
    case "contains":
      return { type: "contains", value };
    case "regex":
      return { type: "regex", value: new RegExp(value) };
    case "domain":
      return { type: "domain", value };
    default:
      throw new Error(`Unknown matcher type: ${prefix}`);
  }
}

export function matchesAny(url: string, matchers: Matcher[]): boolean {
  if (matchers.length === 0) return false;
  return matchers.some((matcher) => {
    switch (matcher.type) {
      case "contains":
        return url.includes(matcher.value);
      case "regex":
        return matcher.value.test(url);
      case "domain":
        try {
          const { hostname } = new URL(url);
          return hostname === matcher.value || hostname.endsWith(`.${matcher.value}`);
        } catch {
          return false;
        }
      default:
        return false;
    }
  });
}
