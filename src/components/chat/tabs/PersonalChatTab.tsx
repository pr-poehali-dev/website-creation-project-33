import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { EmojiClickData } from 'emoji-picker-react';
import ChatMessagesList from './ChatMessagesList';
import ChatInput from './ChatInput';

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

interface PersonalChatTabProps {
  isActive: boolean;
  chatApiUrl: string;
  maxFileSize: number;
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: (onComplete: (file: File) => void) => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
}

export default function PersonalChatTab({
  isActive,
  chatApiUrl,
  maxFileSize,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
}: PersonalChatTabProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (markAsRead = false) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const url = markAsRead ? `${chatApiUrl}?mark_read=true` : chatApiUrl;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setAdminTyping(data.is_typing || false);
      }
    } catch (error) {
      console.error('Load personal messages error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user) return;
    try {
      await fetch(chatApiUrl, {
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
    if ((!newMessage.trim() && !selectedFile) || !user) return;

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

      const response = await fetch(chatApiUrl, {
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
          title: 'Ошибка',
          description: 'Не удалось отправить сообщение',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Send personal message error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      toast({
        title: 'Ошибка',
        description: 'Файл слишком большой. Максимальный размер 5 МБ',
        variant: 'destructive',
      });
      return;
    }

    const allowedTypes = ['image/', 'video/', 'audio/'];
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      toast({
        title: 'Ошибка',
        description: 'Неподдерживаемый тип файла',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleRecordingComplete = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  useEffect(() => {
    if (isActive) {
      loadMessages(true);
      const interval = setInterval(() => loadMessages(false), 3000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  return (
    <>
      <ScrollArea className="flex-1 p-4">
        <ChatMessagesList
          messages={messages}
          isLoading={isLoading}
          adminTyping={adminTyping}
          userId={user?.id}
        />
        <div ref={scrollRef} />
      </ScrollArea>

      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        isSending={isSending}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        isRecording={isRecording}
        recordingTime={recordingTime}
        onSendMessage={sendMessage}
        onFileSelect={handleFileSelect}
        onRemoveFile={handleRemoveFile}
        onEmojiClick={handleEmojiClick}
        onTyping={handleTyping}
        onStartRecording={() => onStartRecording(handleRecordingComplete)}
        onStopRecording={onStopRecording}
        onCancelRecording={onCancelRecording}
        fileInputRef={fileInputRef}
        emojiPickerRef={emojiPickerRef}
      />
    </>
  );
}
