import type { v_a68f35 } from "./common";

export type ApiCreditBalance = {
  balance: number;
  checkpoint: number;
  updatedAt: v_a68f35;
};

export type ApiCreditLedger = {
  id: number;
  amount: number;
  reason: string;
  createdAt: v_a68f35;
};
