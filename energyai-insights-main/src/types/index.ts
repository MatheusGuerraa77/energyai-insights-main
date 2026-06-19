export interface KPI {
  label: string;
  value: string;
  change: number;
  icon?: string;
}

export interface ConsumptionPoint {
  time: string;
  actual: number;
  predicted: number;
}

export interface TrainingMetrics {
  epoch: number;
  totalEpochs: number;
  loss: number;
  valLoss: number;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
  learningRate: number;
  elapsed: number;
  remaining: number;
  status: "idle" | "training" | "completed";
}

export interface TrainingHistoryItem {
  id: string;
  model: string;
  date: string;
  duration: string;
  loss: number;
  mae: number;
  rmse: number;
  status: "Sucesso" | "Falhou" | "Em andamento";
}

export interface PredictionInput {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weekday: string;
  month: string;
  holiday: boolean;
  hour: number;
  prevConsumption: number;
  consumerType: string;
}

export interface PredictionResult {
  value: number;
  confidence: number;
  rangeMin: number;
  rangeMax: number;
  probability: number;
}

export interface AIInsight {
  id: string;
  type: "info" | "success" | "warning";
  title: string;
  description: string;
}

export interface AIHealth {
  accuracy: number;
  lastTrained: string;
  status: "Online" | "Treinando" | "Atualizando";
  version: string;
  predictionsCount: number;
  avgResponse: number;
  dataset: string;
  lastUpdate: string;
  dataQuality: number;
}
