import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint } from './types';

interface ChartVisualizationProps {
  filteredChartData: any[];
  groupBy: 'day' | 'week' | 'month' | 'year';
  showTotal: boolean;
  filterType: 'contacts' | 'approaches';
  selectedUsers: string[];
  userColorMap: Record<string, string>;
  handleChartClick: (data: any) => void;
  CustomDot: React.ComponentType<any>;
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
    <div className="h-64 md:h-96 rounded-lg overflow-hidden p-4" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={filteredChartData} 
          margin={{ 
            top: 20, 
            right: 20, 
            left: 10, 
            bottom: 60 
          }}
          className="md:!ml-5"
          onClick={(data) => {
            console.log('ComposedChart onClick:', data);
            if (data && data.activePayload && data.activePayload[0]) {
              handleChartClick(data);
            }
          }}
        >
          <defs>
            <linearGradient id="greenLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="orangeLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            
            <linearGradient id="greenAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="orangeAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#334155" strokeOpacity={0.25} vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
            angle={-45}
            textAnchor="end"
            height={60}
            stroke="#475569"
            axisLine={{ stroke: '#475569', strokeWidth: 1 }}
            tickLine={false}
            className="md:text-xs"
            tickFormatter={(value) => {
              if (groupBy === 'day') {
                return new Date(value).toLocaleDateString('ru-RU', { 
                  day: 'numeric', 
                  month: 'short' 
                });
              }
              const item = filteredChartData.find((d: any) => d.date === value);
              return item?.displayDate || value;
            }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
            stroke="#475569"
            axisLine={{ stroke: '#475569', strokeWidth: 1 }}
            tickLine={false}
            className="md:text-xs"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              border: '2px solid rgba(34, 211, 238, 0.3)',
              backdropFilter: 'blur(16px)',
              color: '#e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(34, 211, 238, 0.2)',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
            cursor={{ stroke: '#22d3ee', strokeWidth: 2, strokeDasharray: '5 5' }}
            wrapperStyle={{ pointerEvents: 'auto' }}
            labelFormatter={(value) => {
              if (groupBy === 'day') {
                return new Date(value).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });
              }
              const item = filteredChartData.find((d: any) => d.date === value);
              return item?.displayDate || value;
            }}
            itemSorter={(item) => {
              if (item.name === 'Контакты' || item.name === 'Подходы') {
                return -1;
              }
              return 0;
            }}
            formatter={(value, name, props) => {
              if (name === 'contacts' || name === 'approaches') {
                return null;
              }
              return [value, name];
            }}
          />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '13px'
            }}
            iconType="circle"
            formatter={(value) => <span style={{ color: '#94a3b8', fontWeight: '600' }}>{value}</span>}
          />
          
          {showTotal && filterType === 'contacts' && (
            <Area
              type="monotone"
              dataKey="contacts"
              fill="url(#greenAreaGradient)"
              strokeWidth={0}
              legendType="none"
            />
          )}
          
          {showTotal && filterType === 'approaches' && (
            <Area
              type="monotone"
              dataKey="approaches"
              fill="url(#orangeAreaGradient)"
              strokeWidth={0}
              legendType="none"
            />
          )}
          
          {showTotal && filterType === 'contacts' && (
            <Line 
              type="monotone"
              dataKey="contacts" 
              stroke="url(#greenLineGradient)" 
              strokeWidth={4}
              dot={<CustomDot fill="#22d3ee" r={4} />}
              activeDot={{ r: 7, fill: 'white', stroke: '#22d3ee', strokeWidth: 3 }}
              name="Все контакты"
              connectNulls={true}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          
          {showTotal && filterType === 'approaches' && (
            <Line 
              type="monotone"
              dataKey="approaches" 
              stroke="url(#orangeLineGradient)" 
              strokeWidth={4}
              dot={<CustomDot fill="#22d3ee" r={4} />}
              activeDot={{ r: 7, fill: 'white', stroke: '#22d3ee', strokeWidth: 3 }}
              name="Все подходы"
              connectNulls={true}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {selectedUsers.length > 0 && selectedUsers.map((userName) => {
            const dataKey = filterType === 'contacts'
              ? `${userName}_contacts`
              : `${userName}_approaches`;
            
            return (
              <Line
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={userColorMap[userName]}
                strokeWidth={3}
                dot={<CustomDot fill={userColorMap[userName]} r={5} stroke="#0f172a" strokeWidth={2} />}
                activeDot={{ r: 7, fill: userColorMap[userName], stroke: '#22d3ee', strokeWidth: 2 }}
                name={userName}
                connectNulls={true}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
