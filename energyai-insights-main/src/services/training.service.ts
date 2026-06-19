import { trainingHistory } from "@/lib/mock-data";
import { apiClient } from "./api";

export const trainingService = {
  list: () => apiClient.get("/training/history", trainingHistory),
};
