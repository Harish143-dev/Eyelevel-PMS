import React from 'react';

interface HeatmapChartProps {
  data: number[][]; // 7 days x 24 hours
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
  // Find max value for color scaling
  const maxValue = Math.max(...data.flat(), 1);

  const getColorClass = (value: number) => {
    if (value === 0) return 'bg-background border-border';
    
    const intensity = value / maxValue;
    if (intensity < 0.25) return 'bg-primary/20 border-primary/30';
    if (intensity < 0.5) return 'bg-primary/40 border-primary/50';
    if (intensity < 0.75) return 'bg-primary/70 border-primary/80';
    return 'bg-primary border-primary';
  };

  return (
    <div className="overflow-x-auto py-4">
      <div className="flex min-w-[700px]">
        {/* Y-axis labels (Days) */}
        <div className="w-12 mt-6 mr-2 flex flex-col gap-1">
          {DAYS.map((day) => (
            <div key={day} className="h-6 flex items-center text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex-1">
          {/* X-axis labels (Hours) */}
          <div className="flex mb-2">
            {HOURS.map((hour) => (
              <div key={hour} className="flex-1 text-center text-[10px] text-text-muted font-medium">
                {hour % 2 === 0 ? `${hour}h` : ''}
              </div>
            ))}
          </div>

          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}
          >
            {HOURS.map((hour) => (
              <div key={hour} className="flex flex-col gap-1">
                {DAYS.map((_, dayIndex) => {
                  const value = data[dayIndex][hour];
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`h-6 w-full rounded-md border transition-all duration-200 hover:scale-125 hover:z-10 hover:shadow-md cursor-help ${getColorClass(value)}`}
                      title={`${DAYS[dayIndex]} ${hour}:00 — ${value.toFixed(2)} hours tracked`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end mt-6 gap-2 pr-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Less Activity</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-background border border-border"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/30"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/40 border border-primary/50"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/70 border border-primary/80"></div>
          <div className="w-3 h-3 rounded-sm bg-primary border border-primary"></div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Peak Focus</span>
      </div>
    </div>
  );
};

export default HeatmapChart;
