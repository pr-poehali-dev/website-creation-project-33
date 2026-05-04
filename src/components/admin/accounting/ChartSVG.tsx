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

  const W = 1000;
  const H = 400;
  const padL = 62;
  const padR = 20;
  const padT = 30;
  const padB = 50;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const points = chartData.map((item, i) => {
    const x = padL + (i / Math.max(chartData.length - 1, 1)) * chartW;
    const norm = revenueRange > 0 ? (item.revenue - minRevenue) / revenueRange : 0.5;
    const y = padT + chartH - norm * chartH;
    return { x, y, label: item.label, value: item.revenue };
  });

  const cubicPath = (pts: {x: number; y: number}[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) * 0.45;
      const cp2x = p1.x - (p1.x - p0.x) * 0.45;
      d += ` C ${cp1x} ${p0.y} ${cp2x} ${p1.y} ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const linePath = cubicPath(points);
  const bottomY = padT + chartH;
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
    : '';

  const yTicks = 5;
  const yAxisValues = Array.from({ length: yTicks }, (_, i) =>
    minRevenue + (revenueRange * (yTicks - 1 - i)) / (yTicks - 1)
  );

  const xLabels = chartData.filter((_, i) => {
    if (chartData.length <= 7) return true;
    if (i === 0) return false;
    const step = Math.ceil(chartData.length / 6);
    return i % step === 0 || i === chartData.length - 1;
  });

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ height: '400px', background: '#ffffff' }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="65%"  stopColor="#60a5fa" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#06b6d4" />
            <stop offset="50%"  stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <filter id="lineGlow" x="-20%" y="-150%" width="140%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="tipShadow" x="-10%" y="-30%" width="120%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#93c5fd" floodOpacity="0.4" />
          </filter>

          <clipPath id="chartArea">
            <rect x={padL} y={padT - 10} width={chartW} height={chartH + 10} />
          </clipPath>
        </defs>

        {/* Горизонтальные линии сетки */}
        {yAxisValues.map((_, idx) => {
          const y = padT + (idx / (yTicks - 1)) * chartH;
          return (
            <line
              key={idx}
              x1={padL} y1={y}
              x2={W - padR} y2={y}
              stroke="#f1f5f9"
              strokeWidth="1"
            />
          );
        })}

        {/* Подписи оси Y */}
        {yAxisValues.map((val, idx) => (
          <text
            key={idx}
            x={padL - 8}
            y={padT + (idx / (yTicks - 1)) * chartH + 4}
            textAnchor="end"
            fontSize="11"
            fill="#cbd5e1"
          >
            {formatCurrency(val)}
          </text>
        ))}

        {chartData.length > 0 && (
          <g clipPath="url(#chartArea)">
            {/* Заливка */}
            <path d={areaPath} fill="url(#areaFill)" />

            {/* Широкий glow-слой линии */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#lineColor)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.12"
            />

            {/* Средний glow */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#lineColor)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.22"
            />

            {/* Основная линия */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#lineColor)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#lineGlow)"
            />

            {/* Интерактивные точки */}
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
                    const boxW = label.length * 8.5 + 28;
                    const boxH = 32;
                    const rawX = point.x - boxW / 2;
                    const clampedX = Math.max(padL, Math.min(rawX, W - padR - boxW));
                    const boxY = Math.max(4, point.y - boxH - 16);
                    return (
                      <>
                        <circle cx={point.x} cy={point.y} r="14" fill="#3b82f6" opacity="0.1" />
                        <circle cx={point.x} cy={point.y} r="8"  fill="#3b82f6" opacity="0.2" filter="url(#dotGlow)" />
                        <circle cx={point.x} cy={point.y} r="5"  fill="#3b82f6" />
                        <circle cx={point.x} cy={point.y} r="2.5" fill="white" />

                        <rect
                          x={clampedX} y={boxY}
                          width={boxW} height={boxH}
                          rx="8" ry="8"
                          fill="white"
                          stroke="#dbeafe"
                          strokeWidth="1.5"
                          filter="url(#tipShadow)"
                        />
                        <text
                          x={clampedX + boxW / 2}
                          y={boxY + 21}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="700"
                          fill="#1d4ed8"
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

        {/* Подписи оси X */}
        {xLabels.map((item, idx, arr) => {
          const index = chartData.indexOf(item);
          const x = padL + (index / Math.max(chartData.length - 1, 1)) * chartW;
          const isLast = idx === arr.length - 1;
          return (
            <text
              key={`xl-${idx}`}
              x={x}
              y={H - 10}
              textAnchor={isLast && chartData.length > 7 ? 'end' : 'middle'}
              fontSize="11"
              fill="#94a3b8"
            >
              {item.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
