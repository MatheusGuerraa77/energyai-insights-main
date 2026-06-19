import { heatmapData } from "@/lib/mock-data";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function Heatmap() {
  const max = Math.max(...heatmapData.map((d) => d.value));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-1">
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-center text-[9px] text-muted-foreground">
              {h % 3 === 0 ? `${h}h` : ""}
            </div>
          ))}
          {days.map((day) => (
            <>
              <div key={day} className="text-[10px] text-muted-foreground flex items-center">
                {day}
              </div>
              {heatmapData
                .filter((d) => d.day === day)
                .map((cell, i) => {
                  const intensity = cell.value / max;
                  return (
                    <div
                      key={`${day}-${i}`}
                      title={`${day} ${cell.hour}h · ${cell.value} kWh`}
                      className="aspect-square rounded-sm transition-transform hover:scale-110"
                      style={{
                        background: `oklch(0.7 0.18 260 / ${0.08 + intensity * 0.85})`,
                      }}
                    />
                  );
                })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
