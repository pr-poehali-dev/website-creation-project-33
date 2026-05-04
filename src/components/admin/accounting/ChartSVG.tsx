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
  const padL = 70;
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
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="70%"  stopColor="#60a5fa" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#06b6d4" />
            <stop offset="50%"  stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <filter id="tipShadow" x="-10%" y="-30%" width="120%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#93c5fd" floodOpacity="0.35" />
          </filter>

          <clipPath id="chartArea">
            <rect x={padL} y={padT - 10} width={chartW} height={chartH + 10} />
          </clipPath>
        </defs>

        {/* Сетка */}
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

        {/* Ось Y */}
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
          <>
            {/* Заливка и линия — внутри clipPath */}
            <g clipPath="url(#chartArea)">
              <path d={areaPath} fill="url(#areaFill)" />
              <path
                d={linePath}
                fill="none"
                stroke="url(#lineColor)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Точки и тултипы — вне clipPath, чтобы не обрезались */}
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
                    const charWidth = 7.5;
                    const boxW = Math.ceil(label.length * charWidth) + 28;
                    const boxH = 30;
                    const rawX = point.x - boxW / 2;
                    // Ограничиваем строго внутри SVG с запасом 4px
                    const clampedX = Math.max(4, Math.min(rawX, W - boxW - 4));
                    const rawY = point.y - boxH - 14;
                    const clampedY = Math.max(4, rawY);
                    return (
                      <>
                        <circle cx={point.x} cy={point.y} r="5"   fill="#3b82f6" />
                        <circle cx={point.x} cy={point.y} r="2.5" fill="white" />
                        <rect
                          x={clampedX} y={clampedY}
                          width={boxW} height={boxH}
                          rx="7" ry="7"
                          fill="white"
                          stroke="#dbeafe"
                          strokeWidth="1.5"
                          filter="url(#tipShadow)"
                        />
                        <text
                          x={clampedX + boxW / 2}
                          y={clampedY + 20}
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
          </>
        )}

        {/* Ось X */}
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