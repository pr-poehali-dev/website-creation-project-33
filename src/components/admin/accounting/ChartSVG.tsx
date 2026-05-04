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
}: ChartSVGProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const points = chartData.map((item, i) => {
    const x = 60 + (i / (chartData.length - 1 || 1)) * 920;
    const normalizedValue = revenueRange > 0 ? (item.revenue - minRevenue) / revenueRange : 0.5;
    const y = 340 - normalizedValue * 270;
    return { x, y, label: item.label, value: item.revenue };
  });

  const createSmoothPath = (pts: {x: number; y: number}[], offsetY = 0) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y + offsetY}`;
    
    const shifted = pts.map(p => ({ x: p.x, y: p.y + offsetY }));
    let path = `M ${shifted[0].x} ${shifted[0].y}`;
    
    for (let i = 0; i < shifted.length - 1; i++) {
      const current = shifted[i];
      const next = shifted[i + 1];
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
  const lastX = points[points.length - 1]?.x || 0;
  const areaPath = `${smoothPath} L ${lastX} 370 L 60 370 Z`;

  const yAxisValues = [maxRevenue, maxRevenue * 0.75, maxRevenue * 0.5, maxRevenue * 0.25, 0];

  const waveOffsets = [-30, -18, -8, 0, 10, 22, 36];
  const waveStyles = [
    { stroke: '#22d3ee', opacity: 0.18, width: 1.5 },
    { stroke: '#38bdf8', opacity: 0.25, width: 1.5 },
    { stroke: '#60a5fa', opacity: 0.32, width: 2 },
    { stroke: '#3b82f6', opacity: 0.45, width: 2.5 },
    { stroke: '#2563eb', opacity: 0.6,  width: 3 },
    { stroke: '#1d4ed8', opacity: 0.45, width: 2 },
    { stroke: '#06b6d4', opacity: 0.28, width: 1.5 },
  ];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ height: '420px', background: 'linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)' }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1000 400"
        className="w-full h-full"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease-out'
        }}
      >
        <defs>
          <linearGradient id="waveAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.12" />
            <stop offset="60%"  stopColor="#60a5fa" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="mainLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#06b6d4" />
            <stop offset="40%"  stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          <filter id="waveGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="tooltipShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12" floodColor="#3b82f6" />
          </filter>

          <clipPath id="chartClip">
            <rect x="60" y="0" width="920" height="370" />
          </clipPath>
        </defs>

        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1="60" y1={50 + i * 65}
            x2="980" y2={50 + i * 65}
            stroke="#bfdbfe"
            strokeWidth="1"
            strokeOpacity="0.5"
            strokeDasharray="6 6"
          />
        ))}

        {yAxisValues.map((value, idx) => (
          <text
            key={idx}
            x="50"
            y={54 + idx * 65}
            textAnchor="end"
            fontSize="11"
            fill="#94a3b8"
            fontWeight="400"
          >
            {formatCurrency(value)}
          </text>
        ))}

        {chartData.length > 0 && (
          <g clipPath="url(#chartClip)">
            <path d={areaPath} fill="url(#waveAreaGrad)" />

            {waveOffsets.map((offset, i) => (
              <path
                key={i}
                d={createSmoothPath(points, offset)}
                fill="none"
                stroke={waveStyles[i].stroke}
                strokeWidth={waveStyles[i].width}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={waveStyles[i].opacity}
                filter={i === 4 ? 'url(#waveGlow)' : undefined}
              />
            ))}

            <path
              d={smoothPath}
              fill="none"
              stroke="url(#mainLineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#waveGlow)"
            />

            {points.map((point, idx) => {
              const isHovered = hoveredPoint?.x === point.x && hoveredPoint?.y === point.y;
              return (
                <g
                  key={idx}
                  onMouseEnter={() => onHoverPoint(point)}
                  onMouseLeave={() => onHoverPoint(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={point.x} cy={point.y} r="18" fill="transparent" />
                  {isHovered && (() => {
                    const label = `${formatCurrency(point.value)} ₽`;
                    const boxW = label.length * 8.5 + 24;
                    const boxH = 30;
                    const rawX = point.x - boxW / 2;
                    const clampedX = Math.max(62, Math.min(rawX, 978 - boxW));
                    const boxY = Math.max(8, point.y - boxH - 14);
                    return (
                      <>
                        <circle cx={point.x} cy={point.y} r="8" fill="white" opacity="0.7" />
                        <circle cx={point.x} cy={point.y} r="5" fill="#3b82f6" />
                        <circle cx={point.x} cy={point.y} r="2.5" fill="white" />
                        <rect
                          x={clampedX} y={boxY}
                          width={boxW} height={boxH}
                          rx="8" ry="8"
                          fill="white"
                          stroke="#bfdbfe"
                          strokeWidth="1.5"
                          filter="url(#tooltipShadow)"
                        />
                        <text
                          x={clampedX + boxW / 2}
                          y={boxY + 20}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="600"
                          fill="#1e40af"
                        >
                          {label}
                        </text>
                      </>
                    );
                  })()}
                </g>
              );
            })}
          </g>
        )}

        {chartData.filter((_, i) => {
          if (chartData.length <= 7) return true;
          if (i === 0) return false;
          const step = Math.ceil(chartData.length / 7);
          return i % step === 0 || i === chartData.length - 1;
        }).map((item, idx, arr) => {
          const index = chartData.indexOf(item);
          const x = 60 + (index / (chartData.length - 1 || 1)) * 920;
          const isLast = idx === arr.length - 1;
          return (
            <text
              key={`xl-${idx}`}
              x={x}
              y="392"
              textAnchor={isLast && chartData.length > 7 ? 'end' : 'middle'}
              fontSize="11"
              fill="#94a3b8"
              fontWeight="400"
            >
              {item.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
