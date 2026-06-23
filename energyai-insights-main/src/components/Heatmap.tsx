import { useEffect, useMemo, useState } from "react";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type PredictionRow = {
  modelo: string;
  horizonte: string;
  passo: number;
  hora?: string;
  data?: string;
  real: number;
  previsto: number;
};

type HeatmapProps = {
  data?: PredictionRow[];
};

async function getText(path: string): Promise<string> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Erro ao carregar ${path}`);
  }

  return response.text();
}

function parseCSV(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());

  return lines.filter(Boolean).map((line) => {
    const values = line.split(",").map((v) => v.trim());

    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });
}

function parsePrevisoesCSV(text: string): PredictionRow[] {
  return parseCSV(text).map((obj, index) => ({
    modelo: obj.modelo ?? "Modelo",
    horizonte: obj.horizonte ?? "-",
    passo: Number(obj.passo ?? obj.passos ?? index + 1),
    hora: obj.hora ?? obj.datetime ?? obj.data ?? String(index + 1),
    data: obj.data ?? obj.datetime ?? "",
    real: Number(obj.real ?? obj.y_real ?? obj.consumo_real ?? 0),
    previsto: Number(obj.previsto ?? obj.y_pred ?? obj.previsao ?? 0),
  }));
}

function getHour(value?: string, fallback = 0) {
  if (!value) return fallback % 24;

  const hourMatch = value.match(/(\d{1,2}):\d{2}/);

  if (hourMatch) {
    const hour = Number(hourMatch[1]);
    return Number.isFinite(hour) ? hour : fallback % 24;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return numeric % 24;
  }

  return fallback % 24;
}

function getDayIndex(value?: string, fallback = 0) {
  if (!value) return fallback % 7;

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.getDay();
  }

  return fallback % 7;
}

export function Heatmap({ data }: HeatmapProps) {
  const [internalData, setInternalData] = useState<PredictionRow[]>([]);

  useEffect(() => {
    if (data && data.length > 0) return;

    async function carregarDados() {
      try {
        const csv = await getText("/data/previsoes_modelos.csv");
        setInternalData(parsePrevisoesCSV(csv));
      } catch (error) {
        console.error(error);
      }
    }

    carregarDados();
  }, [data]);

  const rows = data && data.length > 0 ? data : internalData;

  const heatmapData = useMemo(() => {
    const base = Array.from({ length: 7 }, (_, dayIndex) =>
      Array.from({ length: 24 }, (_, hour) => ({
        day: days[dayIndex],
        dayIndex,
        hour,
        total: 0,
        count: 0,
        value: 0,
      }))
    );

    rows.forEach((item, index) => {
      const hour = getHour(item.hora, index);
      const dayIndex = getDayIndex(item.data ?? item.hora, index);
      const value = Number(item.previsto || item.real || 0);

      base[dayIndex][hour].total += value;
      base[dayIndex][hour].count += 1;
    });

    return base.flatMap((dayRows) =>
      dayRows.map((cell) => ({
        ...cell,
        value:
          cell.count > 0
            ? Number((cell.total / cell.count).toFixed(2))
            : 0,
      }))
    );
  }, [rows]);

  const max = Math.max(...heatmapData.map((d) => d.value), 1);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Intensidade calculada com base em <strong>previsoes_modelos.csv</strong>
          </p>

          <p className="text-xs text-muted-foreground">
            {rows.length} registros
          </p>
        </div>

        <div className="grid grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-1">
          <div />

          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="text-center text-[9px] text-muted-foreground"
            >
              {h % 3 === 0 ? `${h}h` : ""}
            </div>
          ))}

          {days.map((day) => (
            <div key={day} className="contents">
              <div className="flex items-center text-[10px] text-muted-foreground">
                {day}
              </div>

              {heatmapData
                .filter((d) => d.day === day)
                .map((cell) => {
                  const intensity = cell.value / max;

                  return (
                    <div
                      key={`${day}-${cell.hour}`}
                      title={`${day} ${cell.hour}h · ${cell.value} kWh`}
                      className="aspect-square rounded-sm border border-white/5 transition-transform hover:scale-110"
                      style={{
                        background: `oklch(0.7 0.18 260 / ${
                          0.08 + intensity * 0.85
                        })`,
                      }}
                    />
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}