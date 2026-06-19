import type { PredictionInput, PredictionResult } from "@/types";
import { apiClient } from "./api";

export const predictionsService = {
  predict: (input: PredictionInput) => {
    const base =
      300 +
      input.temperature * 6 +
      input.humidity * 0.8 +
      input.prevConsumption * 0.4 +
      (input.holiday ? -40 : 20) +
      Math.sin((input.hour / 24) * Math.PI * 2) * 80;
    const value = Math.round(base + (Math.random() - 0.5) * 30);
    const confidence = Math.round(92 + Math.random() * 6);
    const result: PredictionResult = {
      value,
      confidence,
      rangeMin: Math.round(value * 0.94),
      rangeMax: Math.round(value * 1.06),
      probability: confidence,
    };
    return apiClient.post("/predict", input, result, 900);
  },
};
