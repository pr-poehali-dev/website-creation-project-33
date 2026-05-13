import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ChartVisualizationProps {
  filteredChartData: Record<string, unknown>[];
  groupBy: 'day' | 'week' | 'month' | 'year';
  showTotal: boolean;
  filterType: 'contacts' | 'approaches';
  selectedUsers: string[];
  userColorMap: Record<string, string>;
  handleChartClick: (data: Record<string, unknown>) => void;
  CustomDot: React.ComponentType<Record<string, unknown>>;
}

export default function ChartVisualization({
  filteredChartData,
  groupBy,
  showTotal,
  filterType,
  selectedUsers,
  userColorMap,
  handleChartClick,
  CustomDot
}: ChartVisualizationProps) {
  return (
    <div className="h-64 md:h-80 rounded-2xl overflow-hidden p-4 bg-gray-50 border border-gray-100">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={filteredChartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 55 }}
          onClick={(data) => {
            if (data && data.activePayload && data.activePayload[0]) {
              handleChartClick(data as Record<string, unknown>);
            }
          }}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e5e7eb" strokeOpacity={0.8} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
            angle={-40}
            textAnchor="end"
            height={55}
            stroke="#e5e7eb"
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tickFormatter={(value) => {
              if (groupBy === 'day') {
                return new Date(value as string).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
              }
              const item = filteredChartData.find(d => d.date === value);
              return (item?.displayDate as string) || (value as string);
            }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
            stroke="#e5e7eb"
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tickCount={Math.ceil((Math.max(...filteredChartData.map(d => (d.contacts as number) || 0)) || 25) / 5) + 1}
            domain={[0, (dataMax: number) => Math.ceil(dataMax / 5) * 5]}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              color: '#374151',
              fontSize: '13px',
            }}
            cursor={{ stroke: '#3b82f6', strokeWidth: 1.5, strokeDasharray: '4 4' }}
            labelFormatter={(value) => {
              if (groupBy === 'day') {
                return new Date(value as string).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
              }
              const item = filteredChartData.find(d => d.date === value);
              return (item?.displayDate as string) || (value as string);
            }}
            formatter={(value, name) => {
              if (name === 'contacts' || name === 'approaches') return null;
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
            iconType="circle"
            formatter={(value) => <span style={{ color: '#6b7280', fontWeight: 500 }}>{value}</span>}
          />

          {showTotal && filterType === 'contacts' && (
            <Area type="monotone" dataKey="contacts" fill="url(#areaGrad)" strokeWidth={0} legendType="none" />
          )}
          {showTotal && filterType === 'approaches' && (
            <Area type="monotone" dataKey="approaches" fill="url(#areaGrad)" strokeWidth={0} legendType="none" />
          )}
          {showTotal && filterType === 'contacts' && (
            <Line
              type="monotone" dataKey="contacts"
              stroke="#3b82f6" strokeWidth={2.5}
              dot={<CustomDot fill="#3b82f6" r={4} />}
              activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              name="Все контакты" connectNulls strokeLinecap="round"
            />
          )}
          {showTotal && filterType === 'approaches' && (
            <Line
              type="monotone" dataKey="approaches"
              stroke="#f59e0b" strokeWidth={2.5}
              dot={<CustomDot fill="#f59e0b" r={4} />}
              activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
              name="Все подходы" connectNulls strokeLinecap="round"
            />
          )}

          {selectedUsers.map(userName => {
            const dataKey = filterType === 'contacts' ? `${userName}_contacts` : `${userName}_approaches`;
            return (
              <Line
                key={dataKey} type="monotone" dataKey={dataKey}
                stroke={userColorMap[userName]} strokeWidth={2}
                dot={<CustomDot fill={userColorMap[userName]} r={4} stroke="#fff" strokeWidth={1.5} />}
                activeDot={{ r: 6, fill: userColorMap[userName], stroke: '#fff', strokeWidth: 2 }}
                name={userName} connectNulls
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}