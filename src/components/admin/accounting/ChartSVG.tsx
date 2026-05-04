import React from 'react';

interface ChartData {
  label: string;
  revenue: number;
  date: string;
  startDate?: string;
  endDate?: string;
}

interface ChartSVGProps {
  chartData: ChartData[];
  maxRevenue: number;
  minRevenue: number;
  revenueRange: number;
  zoom: number;
  onHoverPoint: (point: {x: number; y: number; label: string; value: number} | null) => void;
  hoveredPoint: {x: number; y: number; label: string; value: number} | null;
  formatCurrency: (value: number) => string;
  movingAverageData?: {date: string; avgRevenue: number}[];
}

export default function ChartSVG({ 
  chartData, 
  maxRevenue, 
  minRevenue, 
  revenueRange, 
  zoom,
  onHoverPoint,
  hoveredPoint,
  formatCurrency,
  movingAverageData = []
}: ChartSVGProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const points = chartData.map((item, i) => {
    const x = 60 + (i / (chartData.length - 1 || 1)) * 920;
    const normalizedValue = revenueRange > 0 ? (item.revenue - minRevenue) / revenueRange : 0.5;
    const y = 350 - normalizedValue * 280;
    return { x, y, label: item.label, value: item.revenue };
  });

  const createSmoothPath = (pts: typeof points) => {
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

  const smoothPath = createSmoothPath(points);
  const areaPath = `${smoothPath} L ${points[points.length - 1]?.x || 0} 370 L 60 370 Z`;
  
  // Вычисляем координаты для линии среднего
  const avgPoints = movingAverageData.map((item, i) => {
    const x = 60 + (i / (movingAverageData.length - 1 || 1)) * 920;
    const normalizedValue = revenueRange > 0 ? (item.avgRevenue - minRevenue) / revenueRange : 0.5;
    const y = 350 - normalizedValue * 280;
    return { x, y };
  });
  
  const avgPath = avgPoints.length > 0 
    ? `M ${avgPoints.map(p => `${p.x} ${p.y}`).join(' L ')}` 
    : '';

  const yAxisValues = [
    maxRevenue,
    maxRevenue * 0.75,
    maxRevenue * 0.5,
    maxRevenue * 0.25,
    0
  ];

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '450px', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 420"
        className="w-full h-full"
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease-out'
        }}
      >
        <defs>
          <linearGradient id="modernGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="dropShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.3" floodColor="#3b82f6"/>
          </filter>
        </defs>

        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1="60"
            y1={70 + i * 70}
            x2="980"
            y2={70 + i * 70}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeOpacity="0.8"
            strokeDasharray="4 4"
          />
        ))}

        {yAxisValues.map((value, idx) => {
          const yPos = 70 + idx * 70;
          
          return (
            <text
              key={idx}
              x="45"
              y={yPos + 4}
              textAnchor="end"
              fontSize="11"
              fill="#64748b"
              fontWeight="400"
            >
              {formatCurrency(value)}
            </text>
          );
        })}

        {chartData.length > 0 && (
          <>
            <path
              d={areaPath}
              fill="url(#modernGradient)"
            />
            
            <path
              d={smoothPath}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            
            {avgPath && (
              <path
                d={avgPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="5 5"
                opacity="0.8"
              />
            )}
            
            {points.map((point, idx) => {
              const isHovered = hoveredPoint?.x === point.x && hoveredPoint?.y === point.y;
              
              return (
                <g 
                  key={idx}
                  onMouseEnter={() => onHoverPoint(point)}
                  onMouseLeave={() => onHoverPoint(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="20"
                    fill="transparent"
                  />
                  {isHovered && (() => {
                    const label = `${formatCurrency(point.value)} ₽`;
                    const charWidth = 9;
                    const boxW = label.length * charWidth + 20;
                    const boxH = 28;
                    const rawX = point.x - boxW / 2;
                    const clampedX = Math.max(60, Math.min(rawX, 980 - boxW));
                    const boxY = Math.max(10, point.y - boxH - 12);
                    return (
                      <>
                        <circle cx={point.x} cy={point.y} r="6" fill="#2563eb" />
                        <circle cx={point.x} cy={point.y} r="3.5" fill="white" />
                        <rect
                          x={clampedX}
                          y={boxY}
                          width={boxW}
                          height={boxH}
                          rx="6"
                          ry="6"
                          fill="white"
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          filter="url(#dropShadow)"
                        />
                        <text
                          x={clampedX + boxW / 2}
                          y={boxY + 18}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="600"
                          fill="#1e293b"
                        >
                          {label}
                        </text>
                      </>
                    );
                  })()}
                </g>
              );
            })}
          </>
        )}

        {chartData.filter((_, i) => {
          if (chartData.length <= 7) return true;
          if (i === 0) return false;
          const step = Math.ceil(chartData.length / 7);
          const isStepMatch = i % step === 0;
          const isLast = i === chartData.length - 1;
          
          if (isLast && chartData.length > 7) {
            const prevStepIndex = Math.floor((chartData.length - 1) / step) * step;
            if (chartData.length - 1 - prevStepIndex < step / 2) {
              return false;
            }
          }
          
          return isStepMatch || isLast;
        }).map((item, idx, arr) => {
          const index = chartData.indexOf(item);
          const x = 60 + (index / (chartData.length - 1 || 1)) * 920;
          const isLast = idx === arr.length - 1;
          const textAnchor = isLast && chartData.length > 7 ? 'end' : 'middle';
          
          return (
            <g key={`x-label-${idx}`}>
              <text
                x={x}
                y="405"
                textAnchor={textAnchor}
                fontSize="11"
                fill="#64748b"
                fontWeight="400"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      

    </div>
  );
}