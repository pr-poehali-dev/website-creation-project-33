import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { formatMoscowTime } from '@/utils/timeFormat';

interface PendingUser {
  id: number;
  email: string;
  name: string;
  registration_ip: string;
  created_at: string;
}

interface PendingUsersProps {
  sessionToken: string;
}

export default function PendingUsers({ sessionToken }: PendingUsersProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);

  const loadPendingUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=pending_users',
        {
          headers: {
            'X-Session-Token': sessionToken,
          },
        }
      );
      const data = await response.json();
      if (data.pending_users) {
        setPendingUsers(data.pending_users);
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, [sessionToken]);

  const handleApprove = async (userId: number) => {
    setProcessingUserId(userId);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
          body: JSON.stringify({
            action: 'approve_user',
            user_id: userId,
          }),
        }
      );
      
      if (response.ok) {
        await loadPendingUsers();
      }
    } catch (error) {
      console.error('Ошибка одобрения пользователя:', error);
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm('Вы уверены? Пользователь будет удалён, а его IP заблокирован.')) {
      return;
    }
    
    setProcessingUserId(userId);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
          body: JSON.stringify({
            action: 'reject_user',
            user_id: userId,
          }),
        }
      );
      
      if (response.ok) {
        await loadPendingUsers();
      }
    } catch (error) {
      console.error('Ошибка отклонения заявки:', error);
    } finally {
      setProcessingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatMoscowTime(dateString, 'datetime');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-[#001f54]/10">
        <CardHeader>
          <CardTitle className="text-[#001f54] flex items-center gap-2">
            <Icon name="UserCheck" size={24} />
            Заявки на регистрацию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 text-[#001f54] py-8">
            <Icon name="Loader2" size={20} className="animate-spin" />
            Загрузка заявок...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#001f54]/10">
      <CardHeader>
        <CardTitle className="text-[#001f54] flex items-center gap-2">
          <Icon name="UserCheck" size={24} />
          Заявки на регистрацию
          {pendingUsers.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-sm rounded-full">
              {pendingUsers.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon name="Check" size={48} className="mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">Нет новых заявок</p>
            <p className="text-sm mt-2">Все заявки обработаны</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="border-2 border-amber-500 bg-amber-50 rounded-xl p-4 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="User" size={18} className="text-[#001f54]" />
                      <span className="font-bold text-[#001f54] text-lg">{user.name}</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Icon name="Mail" size={14} />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="MapPin" size={14} />
                        <span>IP: {user.registration_ip || 'неизвестен'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Clock" size={14} />
                        <span>{formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(user.id)}
                      disabled={processingUserId === user.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processingUserId === user.id ? (
                        <Icon name="Loader2" size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Icon name="Check" size={16} />
                          Одобрить
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(user.id)}
                      disabled={processingUserId === user.id}
                      variant="destructive"
                    >
                      {processingUserId === user.id ? (
                        <Icon name="Loader2" size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Icon name="X" size={16} />
                          Отклонить
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}