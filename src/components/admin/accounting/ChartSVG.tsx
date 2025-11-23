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
}

export default function ChartSVG({ 
  chartData, 
  maxRevenue, 
  minRevenue, 
  revenueRange, 
  zoom,
  onHoverPoint,
  hoveredPoint,
  formatCurrency
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

  const yAxisValues = [
    maxRevenue,
    maxRevenue * 0.75,
    maxRevenue * 0.5,
    maxRevenue * 0.25,
    0
  ];

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '450px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
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
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </linearGradient>
          
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="dropShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.4"/>
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
            strokeOpacity="0.3"
            strokeDasharray="5 5"
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
              fontWeight="500"
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
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            
            {points.map((point, idx) => (
              <g key={idx}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  fill="#1e293b"
                  onMouseEnter={() => onHoverPoint(point)}
                  onMouseLeave={() => onHoverPoint(null)}
                  style={{ cursor: 'pointer' }}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="white"
                  onMouseEnter={() => onHoverPoint(point)}
                  onMouseLeave={() => onHoverPoint(null)}
                  style={{ cursor: 'pointer' }}
                  filter="url(#dropShadow)"
                />
              </g>
            ))}
          </>
        )}

        {chartData.filter((_, i) => {
          if (chartData.length <= 7) return true;
          if (i === 0) return false;
          const step = Math.ceil(chartData.length / 7);
          return i % step === 0 || i === chartData.length - 1;
        }).map((item, idx) => {
          const index = chartData.indexOf(item);
          const x = 60 + (index / (chartData.length - 1 || 1)) * 920;
          
          return (
            <g key={`x-label-${idx}`}>
              <text
                x={x}
                y="405"
                textAnchor="middle"
                fontSize="11"
                fill="#94a3b8"
                fontWeight="500"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      
      {hoveredPoint && (
        <div 
          className="absolute pointer-events-none rounded-lg shadow-2xl px-4 py-3 text-sm font-medium"
          style={{
            left: `${(hoveredPoint.x / 1000) * 100}%`,
            top: `${(hoveredPoint.y / 420) * 100}%`,
            transform: 'translate(-50%, -130%)',
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <div className="text-xs opacity-90 mb-1">{hoveredPoint.label}</div>
          <div className="text-lg font-bold">
            {formatCurrency(hoveredPoint.value)}
          </div>
        </div>
      )}
    </div>
  );
}
