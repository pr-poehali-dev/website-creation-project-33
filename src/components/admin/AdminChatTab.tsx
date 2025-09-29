import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: number;
  user_id: number;
  message: string;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
  user_name?: string;
}

interface UserChat {
  id: number;
  name: string;
  email: string;
  unread_count: number;
  last_message_time: string | null;
}

const CHAT_API_URL = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';

export default function AdminChatTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserChat[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadUsers = async () => {
    if (!user) return;

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'GET',
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  const loadMessages = async (userId: number) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${CHAT_API_URL}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedUser) return;

    setIsSending(true);
    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          user_id: selectedUser.id,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages(selectedUser.id);
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
      const interval = setInterval(() => loadMessages(selectedUser.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, user]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Список пользователей */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Users" size={20} />
            Диалоги ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-300px)]">
            {users.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Icon name="MessageCircle" size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет активных диалогов</p>
              </div>
            ) : (
              <div className="space-y-1">
                {users.map((userChat) => (
                  <button
                    key={userChat.id}
                    onClick={() => setSelectedUser(userChat)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b ${
                      selectedUser?.id === userChat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{userChat.name}</p>
                        <p className="text-xs text-gray-500 truncate">{userChat.email}</p>
                        {userChat.last_message_time && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(userChat.last_message_time).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                      {userChat.unread_count > 0 && (
                        <Badge className="ml-2 bg-red-500 hover:bg-red-600">
                          {userChat.unread_count}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Окно чата */}
      <Card className="md:col-span-2 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Icon name="MessageCircle" size={20} />
            {selectedUser ? `Чат с ${selectedUser.name}` : 'Выберите диалог'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Icon name="MessageCircleOff" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Выберите пользователя для начала общения</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-6">
                {isLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Icon name="Loader2" size={24} className="animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p className="text-sm">Нет сообщений</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_from_admin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.is_from_admin
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {!msg.is_from_admin && (
                            <p className="text-xs font-semibold mb-1 text-blue-600">
                              {selectedUser.name}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.is_from_admin ? 'text-white/70' : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Напишите сообщение..."
                    className="min-h-[60px] max-h-[120px] resize-none bg-white"
                    maxLength={1000}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="self-end"
                    size="icon"
                  >
                    {isSending ? (
                      <Icon name="Loader2" size={20} className="animate-spin" />
                    ) : (
                      <Icon name="Send" size={20} />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {newMessage.length}/1000 символов
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}