import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

interface ContactsStats {
  total_contacts: number;
  today_contacts: number;
}

export default function ContactsCounter() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ContactsStats>({ total_contacts: 0, today_contacts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(
          `https://functions.poehali.dev/78eb7cbb-8b7c-4a62-aaa3-74d7b1e8f257?user_id=${user.id}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading) {
    return null;
  }

  return (
    <Card className="bg-white border-[#001f54]/20 shadow-xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-[#001f54]">
          <div className="p-1.5 md:p-2 rounded-lg bg-[#001f54]/10">
            <Icon name="TrendingUp" size={18} className="text-[#001f54] md:w-5 md:h-5" />
          </div>
          Статистика контактов
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#001f54]/5 to-[#001f54]/10 p-4 rounded-lg">
            <div className="text-2xl md:text-3xl font-bold text-[#001f54] mb-1">
              {stats.today_contacts}
            </div>
            <div className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
              <Icon name="Calendar" size={14} />
              Сегодня
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#001f54]/5 to-[#001f54]/10 p-4 rounded-lg">
            <div className="text-2xl md:text-3xl font-bold text-[#001f54] mb-1">
              {stats.total_contacts}
            </div>
            <div className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
              <Icon name="Clock" size={14} />
              Всего
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
