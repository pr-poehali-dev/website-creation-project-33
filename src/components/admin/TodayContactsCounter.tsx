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
    const urlsModule = await import('../../../backend/func2url.json');
    const functionUrl = urlsModule['user-stats'];
    
    const response = await fetch(`${functionUrl}?user_id=all`, {
      headers: {
        'X-Session-Token': sessionToken
      }
    });

    if (response.ok) {
      const data = await response.json();
      setTodayContacts(data.today_contacts || 0);
    }
    
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  return <FlipCounter value={todayContacts} />;
}
