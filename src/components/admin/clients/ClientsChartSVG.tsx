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

  const createAreaPath = (pts: typeof totalPoints) => {
    if (pts.length === 0) return '';
    const linePath = createSmoothPath(pts);
    return `${linePath} L ${pts[pts.length - 1].x} 350 L ${pts[0].x} 350 Z`;
  };

  const totalPath = createSmoothPath(totalPoints);
  const totalAreaPath = createAreaPath(totalPoints);
  const selectedPath = hasSelectedOrg ? createSmoothPath(selectedPoints) : '';

  const yAxisValues = [
    maxValue,
    Math.round(maxValue * 0.75),
    Math.round(maxValue * 0.5),
    Math.round(maxValue * 0.25),
    0
  ];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2 opacity-30">📊</div>
          <p className="text-sm">Нет данных для отображения</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-gray-100 bg-gray-50" style={{ height: '450px' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 420"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="areaGradientBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="areaGradientPink" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Горизонтальные линии сетки */}
        {yAxisValues.map((val, i) => (
          <g key={i}>
            <line
              x1="60"
              y1={70 + i * 70}
              x2="940"
              y2={70 + i * 70}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <text
              x="50"
              y={70 + i * 70 + 5}
              fill="#9ca3af"
              fontSize="12"
              textAnchor="end"
            >
              {val}
            </text>
          </g>
        ))}

        {/* Подписи X */}
        {chartData.map((item, i) => {
          const x = 60 + (i / (chartData.length - 1 || 1)) * 880;
          return (
            <text
              key={i}
              x={x}
              y="390"
              fill="#9ca3af"
              fontSize="11"
              textAnchor="middle"
            >
              {item.label}
            </text>
          );
        })}

        {/* Заливка под линией */}
        {totalPoints.length > 1 && (
          <path
            d={totalAreaPath}
            fill="url(#areaGradientBlue)"
          />
        )}

        {/* Линия — все организации */}
        <path
          d={totalPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Линия — выбранная организация */}
        {hasSelectedOrg && (
          <path
            d={selectedPath}
            fill="none"
            stroke="#ec4899"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Точки — все организации */}
        {totalPoints.map((point, i) => (
          <circle
            key={`total-${i}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="white"
            stroke="#3b82f6"
            strokeWidth="2.5"
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

        {/* Точки — выбранная организация */}
        {hasSelectedOrg && selectedPoints.map((point, i) => (
          <circle
            key={`selected-${i}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="white"
            stroke="#ec4899"
            strokeWidth="2.5"
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

        {/* Тултип */}
        {hoveredPoint && (
          <g>
            <rect
              x={hoveredPoint.x - 70}
              y={hoveredPoint.y - 80}
              width="140"
              height={hasSelectedOrg ? 72 : 56}
              rx="8"
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="1.5"
              filter="drop-shadow(0 2px 8px rgba(0,0,0,0.10))"
            />
            <text x={hoveredPoint.x} y={hoveredPoint.y - 55} fill="#374151" fontSize="12" textAnchor="middle" fontWeight="bold">
              {hoveredPoint.label}
            </text>
            <text x={hoveredPoint.x} y={hoveredPoint.y - 35} fill="#3b82f6" fontSize="11" textAnchor="middle">
              Всего: {hoveredPoint.total}
            </text>
            {hasSelectedOrg && hoveredPoint.selected !== undefined && (
              <text x={hoveredPoint.x} y={hoveredPoint.y - 16} fill="#ec4899" fontSize="11" textAnchor="middle">
                Выбрано: {hoveredPoint.selected > 0 ? 'Да' : 'Нет'}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
