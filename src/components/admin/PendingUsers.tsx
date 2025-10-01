import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface PendingUser {
  id: number;
  email: string;
  name: string;
  registration_ip: string;
  created_at: string;
}

export default function PendingUsers() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=pending_users',
        {
          headers: { 'X-Session-Token': sessionToken || '' }
        }
      );
      const data = await response.json();
      if (data.pending_users) {
        setPendingUsers(data.pending_users);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: number) => {
    setProcessingId(userId);
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({ action: 'approve_user', user_id: userId })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Пользователь одобрен'
        });
        fetchPendingUsers();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось одобрить пользователя',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const rejectUser = async (userId: number) => {
    setProcessingId(userId);
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({ action: 'reject_user', user_id: userId })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Заявка отклонена'
        });
        fetchPendingUsers();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отклонить заявку',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-xl">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Icon name="Loader2" size={32} className="animate-spin text-[#001f54]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <Card className="bg-white shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-[#001f54]">
            <div className="p-2 rounded-lg bg-[#001f54]/10">
              <Icon name="UserCheck" size={20} className="text-[#001f54]" />
            </div>
            Заявки на регистрацию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="CheckCircle" size={64} className="text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Нет новых заявок</h3>
            <p className="text-gray-600">Все заявки обработаны</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#001f54]">
          <div className="p-2 rounded-lg bg-[#001f54]/10">
            <Icon name="UserCheck" size={20} className="text-[#001f54]" />
          </div>
          Заявки на регистрацию
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-blue-50 to-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#001f54] mb-1">{user.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    IP: {user.registration_ip} • {new Date(user.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    onClick={() => approveUser(user.id)}
                    disabled={processingId === user.id}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Icon name="Check" size={16} />
                  </Button>
                  <Button
                    onClick={() => rejectUser(user.id)}
                    disabled={processingId === user.id}
                    size="sm"
                    variant="destructive"
                  >
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
