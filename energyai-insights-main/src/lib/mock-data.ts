import type {
  AIHealth,
  AIInsight,
  ConsumptionPoint,
  KPI,
  TrainingHistoryItem,
} from "@/types";

const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

export const consumptionSeries: ConsumptionPoint[] = hours.map((h, i) => {
  const base = 400 + Math.sin((i / 24) * Math.PI * 2) * 120 + Math.cos(i / 3) * 30;
  const actual = Math.round(base + (Math.random() - 0.5) * 40);
  const predicted = Math.round(base + (Math.random() - 0.5) * 25);
  return { time: h, actual, predicted };
});

export const kpis: KPI[] = [
  { label: "Consumo Atual", value: "523 kWh", change: 4.2 },
  { label: "Previsão 24h", value: "12.480 kWh", change: 11.8 },
  { label: "Economia Estimada", value: "R$ 3.214", change: 7.6 },
  { label: "Status do Modelo", value: "Online", change: 0 },
];

export const heatmapData = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => ({
    day: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d],
    hour: h,
    value: Math.round(
      300 +
        Math.sin((h / 24) * Math.PI * 2) * 150 +
        Math.cos(d) * 40 +
        Math.random() * 60,
    ),
  })),
).flat();

export const insights: AIInsight[] = [
  {
    id: "1",
    type: "warning",
    title: "Pico previsto às 19h",
    description: "Demanda esperada 22% acima da média semanal.",
  },
  {
    id: "2",
    type: "info",
    title: "Consumo amanhã +12%",
    description: "Aumento associado à temperatura elevada (32°C).",
  },
  {
    id: "3",
    type: "success",
    title: "Janela de economia 01h–05h",
    description: "Custo de energia 38% menor neste período.",
  },
  {
    id: "4",
    type: "info",
    title: "Modelo recalibrado",
    description: "Precisão aumentou 1,4% após retraining noturno.",
  },
];

export const aiHealth: AIHealth = {
  accuracy: 97.2,
  lastTrained: "há 2 horas",
  status: "Online",
  version: "v1.0.3",
  predictionsCount: 84392,
  avgResponse: 142,
  dataset: "energy-br-2019-2025",
  lastUpdate: "19/06/2026 14:32",
  dataQuality: 96,
};

export const trainingHistory: TrainingHistoryItem[] = [
  { id: "T-014", model: "LSTM v1.0.3", date: "19/06/2026", duration: "12m 04s", loss: 0.0142, mae: 8.2, rmse: 11.4, status: "Sucesso" },
  { id: "T-013", model: "LSTM v1.0.2", date: "18/06/2026", duration: "11m 52s", loss: 0.0163, mae: 8.9, rmse: 12.1, status: "Sucesso" },
  { id: "T-012", model: "GRU v0.9.8", date: "17/06/2026", duration: "10m 21s", loss: 0.0188, mae: 9.4, rmse: 12.8, status: "Sucesso" },
  { id: "T-011", model: "LSTM v1.0.1", date: "15/06/2026", duration: "13m 11s", loss: 0.0205, mae: 9.7, rmse: 13.2, status: "Sucesso" },
  { id: "T-010", model: "Dense v0.8.0", date: "14/06/2026", duration: "07m 48s", loss: 0.0291, mae: 11.2, rmse: 15.0, status: "Falhou" },
  { id: "T-009", model: "LSTM v1.0.0", date: "12/06/2026", duration: "12m 33s", loss: 0.0218, mae: 9.9, rmse: 13.6, status: "Sucesso" },
];

export const monthlyData = [
  { month: "Jan", consumo: 9800, previsto: 9650 },
  { month: "Fev", consumo: 8700, previsto: 8800 },
  { month: "Mar", consumo: 9400, previsto: 9300 },
  { month: "Abr", consumo: 8900, previsto: 9000 },
  { month: "Mai", consumo: 10200, previsto: 10100 },
  { month: "Jun", consumo: 11400, previsto: 11250 },
  { month: "Jul", consumo: 12100, previsto: 12000 },
  { month: "Ago", consumo: 11800, previsto: 11900 },
  { month: "Set", consumo: 10600, previsto: 10500 },
  { month: "Out", consumo: 9900, previsto: 10000 },
  { month: "Nov", consumo: 9300, previsto: 9400 },
  { month: "Dez", consumo: 10800, previsto: 10700 },
];

export const consumerSplit = [
  { name: "Residencial", value: 42 },
  { name: "Industrial", value: 31 },
  { name: "Comercial", value: 19 },
  { name: "Rural", value: 8 },
];

export const radarData = [
  { metric: "Precisão", A: 95, B: 88 },
  { metric: "Velocidade", A: 88, B: 78 },
  { metric: "Estabilidade", A: 92, B: 84 },
  { metric: "Generalização", A: 90, B: 82 },
  { metric: "Robustez", A: 87, B: 80 },
  { metric: "Eficiência", A: 91, B: 79 },
];

export const scatterData = Array.from({ length: 60 }, () => ({
  temp: 15 + Math.random() * 20,
  consumo: 300 + Math.random() * 400,
}));
