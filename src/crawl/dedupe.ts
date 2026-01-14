export class DedupeSet {
  private readonly seen = new Set<string>();

  add(source: string, link: string): boolean {
    const key = `${source}::${link}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    return true;
  }

  size(): number {
    return this.seen.size;
  }
}
