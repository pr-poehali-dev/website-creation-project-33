import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { formatMoscowTime } from '@/utils/timeFormat';

interface Message {
  id: number;
  user_id: number;
  message: string;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
  user_name?: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHAT_API_URL = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';

export default function ChatDialog({ open, onOpenChange }: ChatDialogProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (markAsRead = false) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const url = markAsRead ? `${CHAT_API_URL}?mark_read=true` : CHAT_API_URL;
      const response = await fetch(url, {
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
    if (!newMessage.trim() || !user) return;

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
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages();
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        toast({
          title: 'Ошибка отправки',
          description: 'Не удалось отправить сообщение',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: 'Ошибка отправки',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (open) {
      // При первой загрузке помечаем сообщения как прочитанные
      loadMessages(true);
      // При автообновлении НЕ помечаем как прочитанные
      const interval = setInterval(() => loadMessages(false), 5000);
      return () => clearInterval(interval);
    }
  }, [open, user]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-[#001f54]">
            <div className="p-2 rounded-lg bg-[#001f54]/10">
              <Icon name="MessageCircle" size={20} className="text-[#001f54]" />
            </div>
            Чат с администратором
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Icon name="Loader2" size={24} className="animate-spin text-[#001f54]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="p-4 rounded-full bg-[#001f54]/10 mb-4">
                <Icon name="MessageCircle" size={32} className="text-[#001f54]" />
              </div>
              <p className="text-gray-500 text-sm">
                Начните диалог с администратором
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.is_from_admin ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.is_from_admin
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-[#001f54] text-white'
                    }`}
                  >
                    {msg.is_from_admin && (
                      <p className="text-xs font-semibold mb-1 text-[#001f54]">
                        Администратор
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.is_from_admin ? 'text-gray-500' : 'text-white/70'
                      }`}
                    >
                      {formatMoscowTime(msg.created_at)}
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
              className="bg-[#001f54] hover:bg-[#002b6b] text-white self-end"
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
      </DialogContent>
    </Dialog>
  );
}