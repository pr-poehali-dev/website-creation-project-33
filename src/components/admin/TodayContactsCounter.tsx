import { useEffect, useState } from 'react';
import FlipCounter from './FlipCounter';

interface TodayContactsCounterProps {
  sessionToken: string;
}

export default function TodayContactsCounter({ sessionToken }: TodayContactsCounterProps) {
  const [todayContacts, setTodayContacts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayContacts();
    
    const interval = setInterval(() => {
      loadTodayContacts();
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionToken]);

  const loadTodayContacts = async () => {
    try {
      const functionUrl = 'https://functions.poehali.dev/78eb7cbb-8b7c-4a62-aaa3-74d7b1e8f257';
      
      const response = await fetch(`${functionUrl}?user_id=all`, {
        headers: {
          'X-Session-Token': sessionToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTodayContacts(data.today_contacts || 0);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
    
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  return <FlipCounter value={todayContacts} />;
}