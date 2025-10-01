import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyStats {
  date: string;
  contacts: number;
}

export default function LeadsChart() {
  const [data, setData] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=stats', {
        headers: { 'X-Session-Token': sessionToken || '' }
      });
      const result = await response.json();
      
      if (result.daily_stats) {
        const chartData = result.daily_stats
          .map((day: any) => ({
            date: new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
            contacts: day.contacts
          }))
          .reverse();
        
        setData(chartData);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-xl">
        <CardContent className="p-6 flex items-center justify-center min-h-[300px]">
          <Icon name="Loader2" size={32} className="animate-spin text-[#001f54]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#001f54]">
          <div className="p-2 rounded-lg bg-[#001f54]/10">
            <Icon name="TrendingUp" size={20} className="text-[#001f54]" />
          </div>
          Динамика контактов по дням
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '8px'
              }}
              labelStyle={{ color: '#001f54', fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="contacts" 
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ fill: '#16a34a', r: 5 }}
              activeDot={{ r: 7 }}
              name="Контакты"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
