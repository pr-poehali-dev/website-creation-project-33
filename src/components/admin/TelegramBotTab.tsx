import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

export default function TelegramBotTab() {
  const [botInfo, setBotInfo] = useState<any>(null);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadBotInfo();
    loadWebhookInfo();
    loadUsers();
  }, []);

  const loadBotInfo = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/147d0398-6403-42c1-ba20-e559ce30ff28?action=get_me');
      const data = await response.json();
      if (data.ok) {
        setBotInfo(data.result);
      }
    } catch (error) {
      console.error('Error loading bot info:', error);
    }
  };

  const loadWebhookInfo = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/147d0398-6403-42c1-ba20-e559ce30ff28?action=get_webhook');
      const data = await response.json();
      if (data.ok) {
        setWebhookInfo(data.result);
      }
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
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-100">
            <div className="p-2 rounded-lg bg-slate-800">
              <Icon name="Bot" size={20} className="text-blue-400" />
            </div>
            Информация о боте
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {botInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Имя:</span>
                <span className="text-slate-100 font-medium">{botInfo.first_name}</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Активен
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Username:</span>
                <a 
                  href={`https://t.me/${botInfo.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  @{botInfo.username}
                </a>
              </div>
            </div>
          ) : (
            <div className="text-slate-400">Загрузка...</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-100">
            <div className="p-2 rounded-lg bg-slate-800">
              <Icon name="Webhook" size={20} className="text-cyan-400" />
            </div>
            Статус Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhookInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">URL:</span>
                {webhookInfo.url ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Настроен
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    Не настроен
                  </Badge>
                )}
              </div>
              {webhookInfo.url && (
                <div className="text-xs text-slate-500 break-all">
                  {webhookInfo.url}
                </div>
              )}
              {webhookInfo.last_error_message && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="text-red-400 text-sm">{webhookInfo.last_error_message}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400">Загрузка...</div>
          )}
          
          <Button
            onClick={setupWebhook}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
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

      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-100">
            <div className="p-2 rounded-lg bg-slate-800">
              <Icon name="Users" size={20} className="text-purple-400" />
            </div>
            Подписчики ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-slate-100 font-medium">
                        {user.first_name} {user.last_name || ''}
                      </div>
                      {user.username && (
                        <div className="text-slate-400 text-sm">@{user.username}</div>
                      )}
                      {user.phone_number && (
                        <div className="text-slate-300 text-sm mt-1">
                          📱 {user.phone_number}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Icon name="Users" size={48} className="mx-auto mb-3 opacity-50" />
              <div>Пока нет подписчиков</div>
              <div className="text-sm mt-1">Поделитесь ссылкой на бота</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
