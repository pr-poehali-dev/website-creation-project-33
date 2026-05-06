import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

export default function TelegramBotTab() {
  const [botInfo, setBotInfo] = useState<Record<string, string> | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    loadBotInfo();
    loadWebhookInfo();
    loadUsers();
  }, []);

  const loadBotInfo = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/147d0398-6403-42c1-ba20-e559ce30ff28?action=get_me');
      const data = await response.json();
      if (data.ok) setBotInfo(data.result);
    } catch (error) {
      console.error('Error loading bot info:', error);
    }
  };

  const loadWebhookInfo = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/147d0398-6403-42c1-ba20-e559ce30ff28?action=get_webhook');
      const data = await response.json();
      if (data.ok) setWebhookInfo(data.result);
    } catch (error) {
      console.error('Error loading webhook info:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/3866e45c-8059-4370-ba27-042c0eac094d?action=get_users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Удалить этого подписчика?')) return;
    try {
      const response = await fetch(`https://functions.poehali.dev/3866e45c-8059-4370-ba27-042c0eac094d?action=delete_user&user_id=${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const formatMoscowTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const setupWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/147d0398-6403-42c1-ba20-e559ce30ff28?action=set_webhook');
      const data = await response.json();
      if (data.ok) {
        alert('✅ Webhook успешно установлен!');
        loadWebhookInfo();
      } else {
        alert('❌ Ошибка: ' + data.description);
      }
    } catch (error) {
      alert('❌ Ошибка: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Информация о боте */}
      <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-gray-800 text-lg">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
              <Icon name="Bot" size={18} className="text-blue-600" />
            </div>
            Информация о боте
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {botInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">Имя:</span>
                <span className="text-gray-800 font-medium">{botInfo.first_name}</span>
                <Badge className="bg-green-50 text-green-600 border border-green-200">
                  Активен
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">Username:</span>
                <a
                  href={`https://t.me/${botInfo.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  @{botInfo.username}
                </a>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Загрузка...</div>
          )}
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-gray-800 text-lg">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
              <Icon name="Webhook" size={18} className="text-blue-600" />
            </div>
            Статус Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {webhookInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">URL:</span>
                {webhookInfo.url ? (
                  <Badge className="bg-green-50 text-green-600 border border-green-200">Настроен</Badge>
                ) : (
                  <Badge className="bg-red-50 text-red-500 border border-red-200">Не настроен</Badge>
                )}
              </div>
              {webhookInfo.url && (
                <div className="text-xs text-gray-400 break-all bg-gray-50 rounded-lg p-2 border border-gray-100">
                  {webhookInfo.url}
                </div>
              )}
              {webhookInfo.last_error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-600 text-sm">{webhookInfo.last_error_message}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Загрузка...</div>
          )}

          <Button
            onClick={setupWebhook}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Настройка...
              </>
            ) : (
              <>
                <Icon name="Zap" size={16} className="mr-2" />
                Настроить Webhook
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Подписчики */}
      <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-gray-800 text-lg">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
              <Icon name="Users" size={18} className="text-blue-600" />
            </div>
            Подписчики ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="text-gray-800 font-medium">
                        {user.first_name} {user.last_name || ''}
                      </div>
                      {user.username && (
                        <div className="text-gray-500 text-sm">@{user.username}</div>
                      )}
                      {user.phone_number && (
                        <div className="text-gray-600 text-sm mt-1">
                          📱 {user.phone_number}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        {formatMoscowTime(user.created_at)}
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteUser(user.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Icon name="Users" size={48} className="mx-auto mb-3 opacity-20" />
              <div className="font-medium text-gray-500">Пока нет подписчиков</div>
              <div className="text-sm mt-1">Поделитесь ссылкой на бота</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}