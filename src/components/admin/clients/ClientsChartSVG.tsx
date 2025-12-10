import React from 'react';

interface ChartData {
  label: string;
  all: number;
  top: number;
  kiberone: number;
  date: string;
}

interface ClientsChartSVGProps {
  chartData: ChartData[];
  maxValue: number;
  minValue: number;
  valueRange: number;
  onHoverPoint: (point: {x: number; y: number; label: string; all: number; top: number; kiberone: number} | null) => void;
  hoveredPoint: {x: number; y: number; label: string; all: number; top: number; kiberone: number} | null;
}

export default function ClientsChartSVG({ 
  chartData, 
  maxValue, 
  minValue, 
  valueRange,
  onHoverPoint,
  hoveredPoint
}: ClientsChartSVGProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const createPoints = (dataKey: 'all' | 'top' | 'kiberone') => {
    return chartData.map((item, i) => {
      const x = 60 + (i / (chartData.length - 1 || 1)) * 920;
      const normalizedValue = valueRange > 0 ? (item[dataKey] - minValue) / valueRange : 0.5;
      const y = 350 - normalizedValue * 280;
      return { x, y, label: item.label, value: item[dataKey] };
    });
  };

  const allPoints = createPoints('all');
  const topPoints = createPoints('top');
  const kiberonePoints = createPoints('kiberone');

  const createSmoothPath = (pts: typeof allPoints) => {
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

  const allPath = createSmoothPath(allPoints);
  const topPath = createSmoothPath(topPoints);
  const kiberonePath = createSmoothPath(kiberonePoints);

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
          <linearGradient id="allGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05"/>
          </linearGradient>
          <linearGradient id="topGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
          </linearGradient>
          <linearGradient id="kiberoneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Сетка */}
        {yAxisValues.map((val, i) => (
          <g key={i}>
            <line
              x1="60"
              y1={70 + i * 70}
              x2="980"
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

        {/* X-axis labels */}
        {chartData.map((item, i) => {
          const x = 60 + (i / (chartData.length - 1 || 1)) * 920;
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

        {/* Линия ВСЕ (cyan) */}
        <path
          d={allPath}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="3"
          filter="url(#glow)"
        />
        
        {/* Линия ТОП (blue) */}
        <path
          d={topPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          filter="url(#glow)"
        />
        
        {/* Линия KIBERONE (indigo) */}
        <path
          d={kiberonePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="3"
          filter="url(#glow)"
        />

        {/* Точки на графике */}
        {allPoints.map((point, i) => (
          <circle
            key={`all-${i}`}
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
              all: chartData[i].all,
              top: chartData[i].top,
              kiberone: chartData[i].kiberone
            })}
            onMouseLeave={() => onHoverPoint(null)}
          />
        ))}
        
        {topPoints.map((point, i) => (
          <circle
            key={`top-${i}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#3b82f6"
            stroke="#1e40af"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => onHoverPoint({
              x: point.x,
              y: point.y,
              label: chartData[i].label,
              all: chartData[i].all,
              top: chartData[i].top,
              kiberone: chartData[i].kiberone
            })}
            onMouseLeave={() => onHoverPoint(null)}
          />
        ))}
        
        {kiberonePoints.map((point, i) => (
          <circle
            key={`kiberone-${i}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#6366f1"
            stroke="#4338ca"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => onHoverPoint({
              x: point.x,
              y: point.y,
              label: chartData[i].label,
              all: chartData[i].all,
              top: chartData[i].top,
              kiberone: chartData[i].kiberone
            })}
            onMouseLeave={() => onHoverPoint(null)}
          />
        ))}

        {/* Tooltip при hover */}
        {hoveredPoint && (
          <g>
            <rect
              x={hoveredPoint.x - 80}
              y={hoveredPoint.y - 90}
              width="160"
              height="80"
              rx="8"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="2"
            />
            <text x={hoveredPoint.x} y={hoveredPoint.y - 65} fill="#e2e8f0" fontSize="12" textAnchor="middle" fontWeight="bold">
              {hoveredPoint.label}
            </text>
            <text x={hoveredPoint.x} y={hoveredPoint.y - 45} fill="#06b6d4" fontSize="11" textAnchor="middle">
              ВСЕ: {hoveredPoint.all}
            </text>
            <text x={hoveredPoint.x} y={hoveredPoint.y - 30} fill="#3b82f6" fontSize="11" textAnchor="middle">
              ТОП: {hoveredPoint.top}
            </text>
            <text x={hoveredPoint.x} y={hoveredPoint.y - 15} fill="#6366f1" fontSize="11" textAnchor="middle">
              KIBERONE: {hoveredPoint.kiberone}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
