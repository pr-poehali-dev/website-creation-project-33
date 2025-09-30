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
  media_type?: 'audio' | 'image' | 'video' | null;
  media_url?: string | null;
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
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!newMessage.trim() && !selectedFile) || !user) return;

    setIsSending(true);
    try {
      let media_data = null;
      let media_type = null;

      if (selectedFile) {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(selectedFile);
        media_data = await base64Promise;

        // Determine media type
        if (selectedFile.type.startsWith('audio/')) {
          media_type = 'audio';
        } else if (selectedFile.type.startsWith('image/')) {
          media_type = 'image';
        } else if (selectedFile.type.startsWith('video/')) {
          media_type = 'video';
        }
      }

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          media_data,
          media_type,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setSelectedFile(null);
        setPreviewUrl(null);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
        setSelectedFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: 'Ошибка записи',
        description: 'Не удалось начать запись. Разрешите доступ к микрофону.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Файл слишком большой',
        description: 'Максимальный размер файла 10 МБ',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const cancelFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                    {msg.media_type === 'audio' && msg.media_url && (
                      <audio controls className="max-w-full mb-2">
                        <source src={msg.media_url} type="audio/webm" />
                      </audio>
                    )}
                    {msg.media_type === 'image' && msg.media_url && (
                      <img 
                        src={msg.media_url} 
                        alt="Изображение" 
                        className="max-w-full rounded mb-2 cursor-pointer"
                        onClick={() => window.open(msg.media_url, '_blank')}
                      />
                    )}
                    {msg.media_type === 'video' && msg.media_url && (
                      <video controls className="max-w-full rounded mb-2">
                        <source src={msg.media_url} type="video/mp4" />
                      </video>
                    )}
                    {msg.message && <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>}
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
          {(selectedFile || previewUrl) && (
            <div className="mb-3 p-3 bg-white rounded-lg border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {previewUrl && selectedFile?.type.startsWith('image/') && (
                  <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded" />
                )}
                {previewUrl && selectedFile?.type.startsWith('video/') && (
                  <video src={previewUrl} className="w-16 h-16 object-cover rounded" />
                )}
                {selectedFile?.type.startsWith('audio/') && (
                  <div className="flex items-center gap-2">
                    <Icon name="Mic" size={20} className="text-[#001f54]" />
                    <span className="text-sm">Голосовое сообщение</span>
                  </div>
                )}
                <span className="text-sm text-gray-600">
                  {(selectedFile.size / 1024).toFixed(0)} КБ
                </span>
              </div>
              <Button onClick={cancelFile} variant="ghost" size="sm">
                <Icon name="X" size={16} />
              </Button>
            </div>
          )}
          <div className="flex gap-2 mb-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
              disabled={isSending || isRecording || selectedFile !== null}
              className="shrink-0"
            >
              <Icon name="Paperclip" size={20} />
            </Button>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant="outline"
              size="icon"
              disabled={isSending || selectedFile !== null}
              className={`shrink-0 ${isRecording ? 'bg-red-100 border-red-300' : ''}`}
            >
              <Icon name="Mic" size={20} className={isRecording ? 'text-red-500' : ''} />
            </Button>
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
              disabled={(!newMessage.trim() && !selectedFile) || isSending}
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
          <p className="text-xs text-gray-500">
            {newMessage.length}/1000 символов {selectedFile && `• ${selectedFile.name}`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}