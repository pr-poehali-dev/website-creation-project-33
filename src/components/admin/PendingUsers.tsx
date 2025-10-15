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
    
    const interval = setInterval(() => {
      loadPendingUsers();
    }, 10000);
    
    return () => clearInterval(interval);
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
      <Card className="glass-panel border-white/10 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="UserCheck" size={24} />
            Заявки на регистрацию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 text-white py-8">
            <Icon name="Loader2" size={20} className="animate-spin" />
            Загрузка заявок...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-white/10 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-white flex flex-col sm:flex-row items-start sm:items-center gap-2 text-lg md:text-xl">
          <div className="flex items-center gap-2">
            <Icon name="UserCheck" size={20} className="md:w-6 md:h-6" />
            <span>Заявки на регистрацию</span>
          </div>
          {pendingUsers.length > 0 && (
            <span className="px-2 py-1 bg-red-500/80 backdrop-blur text-white text-xs md:text-sm rounded-full">
              {pendingUsers.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-white/70">
            <Icon name="Check" size={40} className="mx-auto mb-3 md:mb-4 text-green-400 md:w-12 md:h-12" />
            <p className="text-base md:text-lg font-medium text-white">Нет новых заявок</p>
            <p className="text-xs md:text-sm mt-2">Все заявки обработаны</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="glass-panel border-amber-400/30 bg-amber-500/10 backdrop-blur-xl rounded-xl p-3 md:p-4 hover:bg-amber-500/20 transition-all"
              >
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="User" size={16} className="text-white md:w-[18px] md:h-[18px]" />
                      <span className="font-bold text-white text-base md:text-lg">{user.name}</span>
                    </div>
                    <div className="space-y-1 text-xs md:text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <Icon name="Mail" size={12} className="md:w-[14px] md:h-[14px]" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="MapPin" size={12} className="md:w-[14px] md:h-[14px]" />
                        <span>IP: {user.registration_ip || 'неизвестен'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Clock" size={12} className="md:w-[14px] md:h-[14px]" />
                        <span>{formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button
                      onClick={() => handleApprove(user.id)}
                      disabled={processingUserId === user.id}
                      className="glass-button bg-green-500/20 hover:bg-green-500/30 text-white border-green-400/30 flex-1 md:flex-none text-sm md:text-base h-9 md:h-10"
                      size="sm"
                    >
                      {processingUserId === user.id ? (
                        <Icon name="Loader2" size={14} className="animate-spin md:w-4 md:h-4" />
                      ) : (
                        <>
                          <Icon name="Check" size={14} className="md:w-4 md:h-4" />
                          <span className="ml-1 md:ml-2">Одобрить</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(user.id)}
                      disabled={processingUserId === user.id}
                      className="glass-button bg-red-500/20 hover:bg-red-500/30 text-white border-red-400/30 flex-1 md:flex-none text-sm md:text-base h-9 md:h-10"
                      size="sm"
                    >
                      {processingUserId === user.id ? (
                        <Icon name="Loader2" size={14} className="animate-spin md:w-4 md:h-4" />
                      ) : (
                        <>
                          <Icon name="X" size={14} className="md:w-4 md:h-4" />
                          <span className="ml-1 md:ml-2">Отклонить</span>
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