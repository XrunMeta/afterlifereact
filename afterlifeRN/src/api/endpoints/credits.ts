import { apiClient } from "../client";
import type {
  ApiCreditBalance,
  ApiCreditLedger,
  Paginated,
} from "../../types/api";

export const creditsApi = {
  me: () => apiClient.get<ApiCreditBalance>("/oth-path"),
  ledgers: (cursor?: string, limit = 30) =>
    apiClient.get<Paginated<ApiCreditLedger>>("/oth-path", {
      query: { cursor, limit },
    }),
};
