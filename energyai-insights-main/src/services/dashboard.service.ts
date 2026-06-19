import { apiClient } from "./api";
import { aiHealth, consumptionSeries, insights, kpis } from "@/lib/mock-data";

export const dashboardService = {
  getKPIs: () => apiClient.get("/dashboard/kpis", kpis),
  getConsumption: () => apiClient.get("/dashboard/consumption", consumptionSeries),
  getInsights: () => apiClient.get("/dashboard/insights", insights),
  getAIHealth: () => apiClient.get("/ai/health", aiHealth),
};
