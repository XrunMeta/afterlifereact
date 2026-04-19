import type { IsoTimestamp } from "./common";

export type ApiCreditBalance = {
  balance: number;
  checkpoint: number;
  updatedAt: IsoTimestamp;
};

export type ApiCreditLedger = {
  id: number;
  amount: number;
  reason: string;
  createdAt: IsoTimestamp;
};
