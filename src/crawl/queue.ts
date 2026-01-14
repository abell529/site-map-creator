export type QueueItem = {
  url: string;
  depth: number;
};

export class CrawlQueue {
  private readonly items: QueueItem[] = [];

  enqueue(item: QueueItem): void {
    this.items.push(item);
  }

  dequeue(): QueueItem | undefined {
    return this.items.shift();
  }

  get length(): number {
    return this.items.length;
  }
}
