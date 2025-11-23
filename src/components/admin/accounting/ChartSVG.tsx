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
    const y = 350 - normalizedValue * 300;
    return { x, y, label: item.label, value: item.revenue };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  const areaData = `${pathData} L ${points[points.length - 1]?.x || 0} 350 L 60 350 Z`;

  const yAxisValues = [
    maxRevenue,
    maxRevenue * 0.75,
    maxRevenue * 0.5,
    maxRevenue * 0.25,
    0,
    minRevenue < 0 ? minRevenue : null
  ].filter((v): v is number => v !== null);

  return (
    <div className="relative w-full" style={{ height: '400px' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 400"
        className="w-full h-full"
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out'
        }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
          </filter>
        </defs>

        <rect x="60" y="50" width="920" height="300" fill="#f9fafb" rx="8" />
        
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line
            key={i}
            x1="60"
            y1={50 + i * 60}
            x2="980"
            y2={50 + i * 60}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray={i === 5 ? "none" : "4 4"}
          />
        ))}

        {yAxisValues.map((value, idx) => {
          const yPos = value >= 0 
            ? 50 + (1 - (value / maxRevenue)) * 300
            : 350 + Math.abs(value / minRevenue) * 50;
          
          return (
            <text
              key={idx}
              x="50"
              y={yPos + 4}
              textAnchor="end"
              fontSize="10"
              fill="#6b7280"
              fontWeight="500"
            >
              {formatCurrency(value)}
            </text>
          );
        })}

        {chartData.length > 0 && (
          <>
            <path
              d={areaData}
              fill="url(#areaGradient)"
            />
            
            <path
              d={pathData}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#shadow)"
            />
            
            {points.map((point, idx) => (
              <g key={idx}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="white"
                  stroke="#10b981"
                  strokeWidth="3"
                  onMouseEnter={() => onHoverPoint(point)}
                  onMouseLeave={() => onHoverPoint(null)}
                  style={{ cursor: 'pointer' }}
                  filter="url(#shadow)"
                />
              </g>
            ))}
          </>
        )}

        {chartData.filter((_, i) => {
          if (chartData.length <= 7) return true;
          const step = Math.ceil(chartData.length / 7);
          return i % step === 0 || i === chartData.length - 1;
        }).map((item, idx) => {
          const index = chartData.indexOf(item);
          const x = 60 + (index / (chartData.length - 1 || 1)) * 920;
          const isFirst = index === 0;
          const textAnchor = isFirst && chartData.length > 7 ? 'start' : 'middle';
          
          return (
            <g key={`x-label-${idx}`}>
              <text
                x={x}
                y="395"
                textAnchor={textAnchor}
                fontSize="9"
                fill="#6b7280"
                fontWeight="500"
                className="text-[7px] sm:text-[9px] md:text-[10px]"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      
      {hoveredPoint && (
        <div 
          className="absolute pointer-events-none bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2 text-xs"
          style={{
            left: `${(hoveredPoint.x / 1000) * 100}%`,
            top: `${(hoveredPoint.y / 400) * 100}%`,
            transform: 'translate(-50%, -120%)'
          }}
        >
          <div className="font-semibold text-gray-700">{hoveredPoint.label}</div>
          <div className={`font-bold ${hoveredPoint.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(hoveredPoint.value)} ₽
          </div>
        </div>
      )}
    </div>
  );
}