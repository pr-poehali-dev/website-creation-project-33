import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message, UserChat, CHAT_API_URL } from './chat/types';
import UserList from './chat/UserList';
import ChatWindow from './chat/ChatWindow';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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
  const [userTyping, setUserTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        // Добавляем "Группа" в начало списка с количеством непрочитанных
        const groupChat: UserChat = {
          id: -1,
          name: '👥 Групповой чат',
          unread_count: data.group_unread_count || 0,
          last_message: null,
          last_message_at: null,
          is_typing: false
        };
        setUsers([groupChat, ...(data.users || [])]);
      }
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  const loadMessages = async (userId: number) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const url = userId === -1 
        ? `${CHAT_API_URL}?is_group=true` 
        : `${CHAT_API_URL}?user_id=${userId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setUserTyping(data.is_typing || false);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user) return;
    try {
      await fetch(CHAT_API_URL, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify({ is_typing: isTyping }),
      });
    } catch (error) {
      console.error('Update typing status error:', error);
    }
  };

  const handleTyping = () => {
    updateTypingStatus(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 3000);
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !user || !selectedUser) return;

    updateTypingStatus(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsSending(true);
    try {
      let media_data = null;
      let media_type = null;

      if (selectedFile) {
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

        if (selectedFile.type.startsWith('audio/')) {
          media_type = 'audio';
        } else if (selectedFile.type.startsWith('image/')) {
          media_type = 'image';
        } else if (selectedFile.type.startsWith('video/')) {
          media_type = 'video';
        }
      }

      const bodyData: any = {
        message: newMessage.trim(),
        media_data,
        media_type,
      };

      if (selectedUser.id === -1) {
        bodyData.is_group = true;
      } else {
        bodyData.user_id = selectedUser.id;
      }

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify(bodyData),
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
      
      const options: MediaRecorderOptions = {};
      const mimeTypes = [
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus'
      ];
      
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options.mimeType = mimeType;
          break;
        }
      }
      
      const recorder = new MediaRecorder(stream, options);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([audioBlob], `voice.${extension}`, { type: mimeType });
        setSelectedFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      alert('Ошибка записи аудио. Проверьте разрешения микрофона.');
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
    
    // Запретить очистку группового чата
    if (selectedUser.id === -1) {
      alert('Нельзя очистить групповой чат');
      return;
    }
    
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
    // Периодическое обновление списка пользователей для обновления счетчиков
    const interval = setInterval(() => {
      loadUsers();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
      // Периодическое обновление сообщений
      const interval = setInterval(() => {
        loadMessages(selectedUser.id);
      }, 3000);
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
    <>
      {/* Mobile: show list or chat */}
      <div className="md:hidden">
        {!selectedUser ? (
          <UserList
            users={users}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
          />
        ) : (
          <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <Button
                onClick={() => setSelectedUser(null)}
                variant="ghost"
                size="icon"
                className="shrink-0 glass-button text-gray-900"
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-gray-900">{selectedUser.name}</p>
                <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
              </div>
              {messages.length > 0 && (
                <Button
                  onClick={clearChat}
                  disabled={isDeleting}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 shrink-0"
                >
                  <Icon name="Trash2" size={18} />
                </Button>
              )}
            </div>
            <ChatWindow
              selectedUser={selectedUser}
              messages={messages}
              isLoading={isLoading}
              isDeleting={isDeleting}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              isRecording={isRecording}
              isSending={isSending}
              userTyping={userTyping}
              fileInputRef={fileInputRef}
              scrollRef={scrollRef}
              onClearChat={clearChat}
              onSendMessage={sendMessage}
              onFileSelect={handleFileSelect}
              onCancelFile={cancelFile}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onKeyPress={handleKeyPress}
              onTyping={handleTyping}
            />
          </div>
        )}
      </div>

      {/* Desktop: show both */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <UserList
          users={users}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
        <ChatWindow
          selectedUser={selectedUser}
          messages={messages}
          isLoading={isLoading}
          isDeleting={isDeleting}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          isRecording={isRecording}
          isSending={isSending}
          userTyping={userTyping}
          fileInputRef={fileInputRef}
          scrollRef={scrollRef}
          onClearChat={clearChat}
          onSendMessage={sendMessage}
          onFileSelect={handleFileSelect}
          onCancelFile={cancelFile}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onKeyPress={handleKeyPress}
          onTyping={handleTyping}
        />
      </div>
    </>
  );
}