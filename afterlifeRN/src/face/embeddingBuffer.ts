

export const EMBEDDING_BUFFER_SIZE = 5;

export class EmbeddingBuffer {
  private items: number[][] = [];

  push(vec: number[]): void {
    this.items.push(vec);
    if (this.items.length > EMBEDDING_BUFFER_SIZE) {
      this.items.shift();
    }
  }

  latest(n: number): number[][] {
    if (n <= 0) return [];
    return this.items.slice(Math.max(0, this.items.length - n));
  }
}
