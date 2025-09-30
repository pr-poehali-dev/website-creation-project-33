import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoscowTime, formatChatListTime } from '@/utils/timeFormat';

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

interface UserChat {
  id: number;
  name: string;
  email: string;
  unread_count: number;
  last_message_time: string | null;
  total_messages: number;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!newMessage.trim() && !selectedFile) || !user || !selectedUser) return;

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
          user_id: selectedUser.id,
          media_data,
          media_type,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setSelectedFile(null);
        setPreviewUrl(null);
        await loadMessages(selectedUser.id);
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Send failed:', response.status, errorData);
        alert(`Ошибка отправки: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert(`Ошибка: ${error}`);
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

    // Ограничение 1 МБ для base64 (чтобы влезло в JSON)
    if (file.size > 1 * 1024 * 1024) {
      alert('Максимальный размер файла 1 МБ (ограничение base64)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const clearChat = async () => {
    if (!user || !selectedUser) return;
    
    if (!confirm(`Удалить всю историю чата с ${selectedUser.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${CHAT_API_URL}?user_id=${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (response.ok) {
        setMessages([]);
        await loadUsers();
      }
    } catch (error) {
      console.error('Clear chat error:', error);
    } finally {
      setIsDeleting(false);
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
                        {userChat.last_message_time ? (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatChatListTime(userChat.last_message_time)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            Нет сообщений
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon name="MessageCircle" size={20} />
              {selectedUser ? `Чат с ${selectedUser.name}` : 'Выберите диалог'}
            </CardTitle>
            {selectedUser && messages.length > 0 && (
              <Button
                onClick={clearChat}
                disabled={isDeleting}
                variant="destructive"
                size="sm"
              >
                {isDeleting ? (
                  <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                ) : (
                  <Icon name="Trash2" size={16} className="mr-2" />
                )}
                Очистить чат
              </Button>
            )}
          </div>
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
                              msg.is_from_admin ? 'text-white/70' : 'text-gray-500'
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
                          <Icon name="Mic" size={20} className="text-blue-600" />
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
                <p className="text-xs text-gray-500">
                  {newMessage.length}/1000 символов {selectedFile && `• ${selectedFile.name}`}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}