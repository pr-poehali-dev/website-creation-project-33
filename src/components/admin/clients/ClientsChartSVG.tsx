import React from 'react';

interface ChartData {
  label: string;
  total: number;
  selected: number;
  date: string;
}

interface ClientsChartSVGProps {
  chartData: ChartData[];
  maxValue: number;
  minValue: number;
  valueRange: number;
  onHoverPoint: (point: {x: number; y: number; label: string; total: number; selected?: number} | null) => void;
  hoveredPoint: {x: number; y: number; label: string; total: number; selected?: number} | null;
  hasSelectedOrg: boolean;
}

export default function ClientsChartSVG({ 
  chartData, 
  maxValue, 
  minValue, 
  valueRange,
  onHoverPoint,
  hoveredPoint,
  hasSelectedOrg
}: ClientsChartSVGProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const totalPoints = chartData.map((item, i) => {
    const x = 60 + (i / (chartData.length - 1 || 1)) * 880;
    const normalizedValue = valueRange > 0 ? (item.total - minValue) / valueRange : 0.5;
    const y = 350 - normalizedValue * 280;
    return { x, y, label: item.label, value: item.total };
  });

  const selectedPoints = hasSelectedOrg ? chartData.map((item, i) => {
    const x = 60 + (i / (chartData.length - 1 || 1)) * 880;
    const normalizedValue = valueRange > 0 ? (item.selected - minValue) / valueRange : 0;
    const y = 350 - normalizedValue * 280;
    return { x, y, label: item.label, value: item.selected };
  }) : [];

  const createSmoothPath = (pts: typeof totalPoints) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    
    let path = `M ${pts[0].x} ${pts[0].y}`;
    
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const xMid = (current.x + next.x) / 2;
      const yMid = (current.y + next.y) / 2;
      const cpX1 = (xMid + current.x) / 2;
      const cpX2 = (xMid + next.x) / 2;
      
      path += ` Q ${cpX1} ${current.y}, ${xMid} ${yMid}`;
      path += ` Q ${cpX2} ${next.y}, ${next.x} ${next.y}`;
    }
    
    return path;
  };

  const totalPath = createSmoothPath(totalPoints);
  const selectedPath = hasSelectedOrg ? createSmoothPath(selectedPoints) : '';

  const yAxisValues = [
    maxValue,
    Math.round(maxValue * 0.75),
    Math.round(maxValue * 0.5),
    Math.round(maxValue * 0.25),
    0
  ];

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '450px', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 420"
        className="w-full h-full"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {yAxisValues.map((val, i) => (
          <g key={i}>
            <line
              x1="60"
              y1={70 + i * 70}
              x2="940"
              y2={70 + i * 70}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.3"
            />
            <text
              x="45"
              y={70 + i * 70 + 5}
              fill="#94a3b8"
              fontSize="12"
              textAnchor="end"
            >
              {val}
            </text>
          </g>
        ))}

        {chartData.map((item, i) => {
          const x = 60 + (i / (chartData.length - 1 || 1)) * 880;
          return (
            <text
              key={i}
              x={x}
              y="390"
              fill="#94a3b8"
              fontSize="11"
              textAnchor="middle"
            >
              {item.label}
            </text>
          );
        })}

        <path
          d={totalPath}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="3"
          filter="url(#glow)"
        />
        
        {hasSelectedOrg && (
          <path
            d={selectedPath}
            fill="none"
            stroke="#ec4899"
            strokeWidth="3"
            filter="url(#glow)"
          />
        )}

        {totalPoints.map((point, i) => (
          <circle
            key={`total-${i}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#06b6d4"
            stroke="#0e7490"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => onHoverPoint({
              x: point.x,
              y: point.y,
              label: chartData[i].label,
              total: chartData[i].total,
              selected: hasSelectedOrg ? chartData[i].selected : undefined
            })}
            onMouseLeave={() => onHoverPoint(null)}
          />
        ))}
        
        {hasSelectedOrg && selectedPoints.map((point, i) => (
          <circle
            key={`selected-${i}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#ec4899"
            stroke="#be185d"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => onHoverPoint({
              x: point.x,
              y: point.y,
              label: chartData[i].label,
              total: chartData[i].total,
              selected: chartData[i].selected
            })}
            onMouseLeave={() => onHoverPoint(null)}
          />
        ))}

        {hoveredPoint && (
          <g>
            <rect
              x={hoveredPoint.x - 70}
              y={hoveredPoint.y - 75}
              width="140"
              height={hasSelectedOrg ? 70 : 55}
              rx="8"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="2"
            />
            <text x={hoveredPoint.x} y={hoveredPoint.y - 50} fill="#e2e8f0" fontSize="12" textAnchor="middle" fontWeight="bold">
              {hoveredPoint.label}
            </text>
            <text x={hoveredPoint.x} y={hoveredPoint.y - 30} fill="#06b6d4" fontSize="11" textAnchor="middle">
              Всего: {hoveredPoint.total}
            </text>
            {hasSelectedOrg && hoveredPoint.selected !== undefined && (
              <text x={hoveredPoint.x} y={hoveredPoint.y - 12} fill="#ec4899" fontSize="11" textAnchor="middle">
                Выбрано: {hoveredPoint.selected > 0 ? 'Да' : 'Нет'}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}