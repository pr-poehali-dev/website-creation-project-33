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
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '450px', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
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
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0.05" />
          </linearGradient>
          
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="dropShadow">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.5" floodColor="#22d3ee"/>
          </filter>
        </defs>

        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1="60"
            y1={70 + i * 70}
            x2="980"
            y2={70 + i * 70}
            stroke="#334155"
            strokeWidth="1"
            strokeOpacity="0.2"
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
              fill="#94a3b8"
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
                  {isHovered && (
                    <>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="10"
                        fill="#0f172a"
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="7"
                        fill="white"
                        filter="url(#dropShadow)"
                      />
                    </>
                  )}
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
                fill="#94a3b8"
                fontWeight="400"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      
      {hoveredPoint && (
        <div 
          className="absolute pointer-events-none rounded-lg shadow-2xl px-4 py-2.5 text-sm font-semibold"
          style={{
            left: `${(hoveredPoint.x / 1000) * 100}%`,
            top: `${(hoveredPoint.y / 420) * 100}%`,
            transform: 'translate(-50%, -140%)',
            background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
            color: 'white',
            boxShadow: '0 10px 25px rgba(236, 72, 153, 0.5)'
          }}
        >
          <div className="text-lg font-bold">
            {formatCurrency(hoveredPoint.value)}
          </div>
        </div>
      )}
    </div>
  );
}