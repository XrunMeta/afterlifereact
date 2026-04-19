export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

export type IsoTimestamp = string;
