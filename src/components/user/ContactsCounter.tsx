import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ContactsStats {
  total_contacts: number;
  today_contacts: number;
}

interface ContactsCounterProps {
  onStatsChange?: (stats: ContactsStats) => void;
}

export interface ContactsCounterRef {
  refresh: () => void;
}

const ContactsCounter = forwardRef<ContactsCounterRef, ContactsCounterProps>(({ onStatsChange }, ref) => {
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
          onStatsChange?.(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      const fetchStats = async () => {
        if (!user?.id) return;
        
        try {
          const response = await fetch(
            `https://functions.poehali.dev/78eb7cbb-8b7c-4a62-aaa3-74d7b1e8f257?user_id=${user.id}`
          );
          
          if (response.ok) {
            const data = await response.json();
            setStats(data);
            onStatsChange?.(data);
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      };
      fetchStats();
    }
  }), [user?.id, onStatsChange]);

  if (loading) {
    return null;
  }

  return (
    <span className="text-sm text-[#001f54]/70 font-medium">
      {stats.today_contacts}/{stats.total_contacts}
    </span>
  );
});

ContactsCounter.displayName = 'ContactsCounter';

export default ContactsCounter;