

export const v_b741c3 = 5;

export class v_4f64ba {
  private items: number[][] = [];

  push(v_46ff7a): void {
    this.items.push(v_46ff7a);
    if (this.items.length > v_b741c3) {
      this.items.shift();
    }
  }

  latest(v_f4e98d): number[][] {
    if (v_f4e98d <= 0) return [];
    return this.items.slice(Math.max(0, this.items.length - v_f4e98d));
  }
}
