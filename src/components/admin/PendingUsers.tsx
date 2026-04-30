import React, { useEffect, useState } from 'react';
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
        { headers: { 'X-Session-Token': sessionToken } }
      );
      const data = await response.json();
      if (data.pending_users) setPendingUsers(data.pending_users);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPendingUsers(); }, [sessionToken]);

  const handleApprove = async (userId: number) => {
    setProcessingUserId(userId);
    try {
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ action: 'approve_user', user_id: userId }),
      });
      if (response.ok) await loadPendingUsers();
    } catch (error) {
      console.error('Ошибка одобрения:', error);
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm('Вы уверены? Пользователь будет удалён, а его IP заблокирован.')) return;
    setProcessingUserId(userId);
    try {
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ action: 'reject_user', user_id: userId }),
      });
      if (response.ok) await loadPendingUsers();
    } catch (error) {
      console.error('Ошибка отклонения:', error);
    } finally {
      setProcessingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try { return formatMoscowTime(dateString, 'datetime'); } catch { return dateString; }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <Icon name="UserCheck" size={18} className="text-violet-500" />
          </div>
          <h2 className="font-semibold text-gray-800 text-base">Заявки на регистрацию</h2>
        </div>
        <div className="flex items-center justify-center gap-2 text-gray-400 py-8">
          <Icon name="Loader2" size={18} className="animate-spin text-violet-400" />
          <span className="text-sm">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <Icon name="UserCheck" size={18} className="text-violet-500" />
          </div>
          <h2 className="font-semibold text-gray-800 text-base">Заявки на регистрацию</h2>
        </div>
        {pendingUsers.length > 0 && (
          <span className="px-2.5 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
            {pendingUsers.length}
          </span>
        )}
      </div>

      <div className="p-5">
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <Icon name="CheckCircle2" size={24} className="text-emerald-500" />
            </div>
            <p className="font-semibold text-gray-700 text-sm">Нет новых заявок</p>
            <p className="text-gray-400 text-xs mt-1">Все заявки обработаны</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div key={user.id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 hover:bg-amber-50 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="User" size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                    <div className="mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Icon name="Mail" size={11} className="text-gray-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Icon name="MapPin" size={11} className="text-gray-400" />
                        <span>IP: {user.registration_ip || 'неизвестен'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Icon name="Clock" size={11} className="text-gray-400" />
                        <span>{formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={processingUserId === user.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {processingUserId === user.id
                      ? <Icon name="Loader2" size={13} className="animate-spin" />
                      : <><Icon name="Check" size={13} /><span>Одобрить</span></>
                    }
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={processingUserId === user.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold border border-red-100 transition-colors disabled:opacity-50"
                  >
                    {processingUserId === user.id
                      ? <Icon name="Loader2" size={13} className="animate-spin" />
                      : <><Icon name="X" size={13} /><span>Отклонить</span></>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
