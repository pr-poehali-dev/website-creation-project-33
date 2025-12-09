import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface ChatTabsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: number | null;
}

const CHAT_API_URL = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';

export default function ChatTabs({ open, onOpenChange, organizationId }: ChatTabsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  
  // Personal chat state
  const [personalMessages, setPersonalMessages] = useState<Message[]>([]);
  const [personalNewMessage, setPersonalNewMessage] = useState('');
  const [personalIsLoading, setPersonalIsLoading] = useState(false);
  const [personalIsSending, setPersonalIsSending] = useState(false);
  const [personalAdminTyping, setPersonalAdminTyping] = useState(false);
  const [personalSelectedFile, setPersonalSelectedFile] = useState<File | null>(null);
  const [personalPreviewUrl, setPersonalPreviewUrl] = useState<string | null>(null);
  const personalScrollRef = useRef<HTMLDivElement>(null);
  const personalFileInputRef = useRef<HTMLInputElement>(null);
  const personalTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Group chat state
  const [groupMessages, setGroupMessages] = useState<Message[]>([]);
  const [groupNewMessage, setGroupNewMessage] = useState('');
  const [groupIsLoading, setGroupIsLoading] = useState(false);
  const [groupIsSending, setGroupIsSending] = useState(false);
  const [groupSelectedFile, setGroupSelectedFile] = useState<File | null>(null);
  const [groupPreviewUrl, setGroupPreviewUrl] = useState<string | null>(null);
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);
  const groupScrollRef = useRef<HTMLDivElement>(null);
  const groupFileInputRef = useRef<HTMLInputElement>(null);
  const groupTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Recording state (shared)
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Personal chat functions
  const loadPersonalMessages = async (markAsRead = false) => {
    if (!user) return;

    setPersonalIsLoading(true);
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
        setPersonalMessages(data.messages || []);
        setPersonalAdminTyping(data.is_typing || false);
      }
    } catch (error) {
      console.error('Load personal messages error:', error);
    } finally {
      setPersonalIsLoading(false);
    }
  };

  const updatePersonalTypingStatus = async (isTyping: boolean) => {
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

  const handlePersonalTyping = () => {
    updatePersonalTypingStatus(true);
    if (personalTypingTimeoutRef.current) {
      clearTimeout(personalTypingTimeoutRef.current);
    }
    personalTypingTimeoutRef.current = setTimeout(() => {
      updatePersonalTypingStatus(false);
    }, 3000);
  };

  const sendPersonalMessage = async () => {
    if ((!personalNewMessage.trim() && !personalSelectedFile) || !user) return;

    updatePersonalTypingStatus(false);
    if (personalTypingTimeoutRef.current) {
      clearTimeout(personalTypingTimeoutRef.current);
    }

    setPersonalIsSending(true);
    try {
      let media_data = null;
      let media_type = null;

      if (personalSelectedFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(personalSelectedFile);
        media_data = await base64Promise;

        if (personalSelectedFile.type.startsWith('audio/')) {
          media_type = 'audio';
        } else if (personalSelectedFile.type.startsWith('image/')) {
          media_type = 'image';
        } else if (personalSelectedFile.type.startsWith('video/')) {
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
          message: personalNewMessage.trim(),
          media_data,
          media_type,
        }),
      });

      if (response.ok) {
        setPersonalNewMessage('');
        setPersonalSelectedFile(null);
        setPersonalPreviewUrl(null);
        await loadPersonalMessages();
        setTimeout(() => {
          personalScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      setPersonalIsSending(false);
    }
  };

  // Group chat functions
  const loadGroupMessages = async (markAsRead = false) => {
    if (!user) return;

    setGroupIsLoading(true);
    try {
      const url = markAsRead 
        ? `${CHAT_API_URL}?is_group=true&mark_read=true` 
        : `${CHAT_API_URL}?is_group=true`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroupMessages(data.messages || []);
        setGroupUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Load group messages error:', error);
    } finally {
      setGroupIsLoading(false);
    }
  };

  const updateGroupTypingStatus = async (isTyping: boolean) => {
    if (!user) return;
    try {
      await fetch(CHAT_API_URL, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify({ is_typing: isTyping, is_group: true }),
      });
    } catch (error) {
      console.error('Update group typing status error:', error);
    }
  };

  const handleGroupTyping = () => {
    updateGroupTypingStatus(true);
    if (groupTypingTimeoutRef.current) {
      clearTimeout(groupTypingTimeoutRef.current);
    }
    groupTypingTimeoutRef.current = setTimeout(() => {
      updateGroupTypingStatus(false);
    }, 3000);
  };

  const sendGroupMessage = async () => {
    if ((!groupNewMessage.trim() && !groupSelectedFile) || !user) return;

    updateGroupTypingStatus(false);
    if (groupTypingTimeoutRef.current) {
      clearTimeout(groupTypingTimeoutRef.current);
    }

    setGroupIsSending(true);
    try {
      let media_data = null;
      let media_type = null;

      if (groupSelectedFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(groupSelectedFile);
        media_data = await base64Promise;

        if (groupSelectedFile.type.startsWith('audio/')) {
          media_type = 'audio';
        } else if (groupSelectedFile.type.startsWith('image/')) {
          media_type = 'image';
        } else if (groupSelectedFile.type.startsWith('video/')) {
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
          message: groupNewMessage.trim(),
          media_data,
          media_type,
          is_group: true,
        }),
      });

      if (response.ok) {
        setGroupNewMessage('');
        setGroupSelectedFile(null);
        setGroupPreviewUrl(null);
        await loadGroupMessages();
        setTimeout(() => {
          groupScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось отправить сообщение',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Send group message error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setGroupIsSending(false);
    }
  };

  // Shared recording functions
  const startRecording = async (isGroup: boolean) => {
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
        
        if (isGroup) {
          setGroupSelectedFile(file);
        } else {
          setPersonalSelectedFile(file);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось записать аудио',
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

  // File handling functions
  const handlePersonalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: 'Максимальный размер файла 1 МБ',
        variant: 'destructive',
      });
      if (personalFileInputRef.current) {
        personalFileInputRef.current.value = '';
      }
      return;
    }

    setPersonalSelectedFile(file);
    
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPersonalPreviewUrl(url);
    }
  };

  const cancelPersonalFile = () => {
    setPersonalSelectedFile(null);
    setPersonalPreviewUrl(null);
    if (personalFileInputRef.current) {
      personalFileInputRef.current.value = '';
    }
  };

  const handleGroupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: 'Максимальный размер файла 1 МБ',
        variant: 'destructive',
      });
      if (groupFileInputRef.current) {
        groupFileInputRef.current.value = '';
      }
      return;
    }

    setGroupSelectedFile(file);
    
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setGroupPreviewUrl(url);
    }
  };

  const cancelGroupFile = () => {
    setGroupSelectedFile(null);
    setGroupPreviewUrl(null);
    if (groupFileInputRef.current) {
      groupFileInputRef.current.value = '';
    }
  };

  // Effects
  useEffect(() => {
    if (open && activeTab === 'personal') {
      loadPersonalMessages(true);
    }
  }, [open, activeTab, user]);

  useEffect(() => {
    if (open && activeTab === 'group') {
      loadGroupMessages(true);
    }
  }, [open, activeTab, user]);

  useEffect(() => {
    if (open && activeTab === 'personal' && personalMessages.length > 0) {
      const interval = setInterval(() => {
        loadPersonalMessages(false);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [open, activeTab, personalMessages.length, user]);

  useEffect(() => {
    if (open && activeTab === 'group' && groupMessages.length > 0) {
      const interval = setInterval(() => {
        loadGroupMessages(false);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [open, activeTab, groupMessages.length, user]);

  useEffect(() => {
    if (personalScrollRef.current && activeTab === 'personal') {
      personalScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [personalMessages, activeTab]);

  useEffect(() => {
    if (groupScrollRef.current && activeTab === 'group') {
      groupScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [groupMessages, activeTab]);

  useEffect(() => {
    return () => {
      if (personalTypingTimeoutRef.current) {
        clearTimeout(personalTypingTimeoutRef.current);
      }
      if (groupTypingTimeoutRef.current) {
        clearTimeout(groupTypingTimeoutRef.current);
      }
      updatePersonalTypingStatus(false);
      updateGroupTypingStatus(false);
    };
  }, []);

  const renderMessages = (messages: Message[], scrollRef: React.RefObject<HTMLDivElement>, isLoading: boolean, isGroup: boolean) => {
    if (isLoading && messages.length === 0) {
      return (
        <div className="flex justify-center py-8">
          <Icon name="Loader2" className="animate-spin" size={24} />
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          Сообщений пока нет
        </div>
      );
    }

    return (
      <>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${msg.user_id === user?.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg p-3`}>
              {isGroup && msg.user_id !== user?.id && (
                <div className="text-xs font-semibold mb-1 opacity-70">
                  {msg.is_from_admin ? 'Администратор' : msg.user_name}
                </div>
              )}
              
              {msg.media_url && (
                <div className="mb-2">
                  {msg.media_type === 'image' && (
                    <img src={msg.media_url} alt="Image" className="max-w-full rounded" />
                  )}
                  {msg.media_type === 'video' && (
                    <video src={msg.media_url} controls className="max-w-full rounded" />
                  )}
                  {msg.media_type === 'audio' && (
                    <audio src={msg.media_url} controls className="w-full" />
                  )}
                </div>
              )}
              
              {msg.message && <div className="whitespace-pre-wrap break-words">{msg.message}</div>}
              
              <div className={`text-xs mt-1 ${msg.user_id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatMoscowTime(msg.created_at)}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </>
    );
  };

  const renderChatInput = (
    newMessage: string,
    setNewMessage: (msg: string) => void,
    handleTyping: () => void,
    sendMessage: () => void,
    isSending: boolean,
    selectedFile: File | null,
    previewUrl: string | null,
    fileInputRef: React.RefObject<HTMLInputElement>,
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void,
    cancelFile: () => void,
    isGroup: boolean
  ) => {
    return (
      <>
        {previewUrl && (
          <div className="px-4 py-2 border-t bg-gray-50">
            <div className="relative inline-block">
              {selectedFile?.type.startsWith('image/') && (
                <img src={previewUrl} alt="Preview" className="max-h-20 rounded" />
              )}
              {selectedFile?.type.startsWith('video/') && (
                <video src={previewUrl} className="max-h-20 rounded" />
              )}
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2"
                onClick={cancelFile}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          </div>
        )}

        {selectedFile && selectedFile.type.startsWith('audio/') && (
          <div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-2">
            <Icon name="Mic" size={16} />
            <span className="text-sm">Голосовое сообщение готово</span>
            <Button size="sm" variant="ghost" onClick={cancelFile}>
              <Icon name="X" size={16} />
            </Button>
          </div>
        )}

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            
            <Button
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || selectedFile !== null}
            >
              <Icon name="Paperclip" size={20} />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={isRecording ? stopRecording : () => startRecording(isGroup)}
              disabled={isSending || selectedFile !== null}
              className={isRecording ? 'text-red-500' : ''}
            >
              <Icon name="Mic" size={20} />
            </Button>

            <Textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Написать сообщение..."
              className="min-h-[40px] max-h-[120px] resize-none"
              disabled={isSending}
            />

            <Button
              onClick={sendMessage}
              disabled={isSending || (!newMessage.trim() && !selectedFile)}
            >
              {isSending ? (
                <Icon name="Loader2" className="animate-spin" size={20} />
              ) : (
                <Icon name="Send" size={20} />
              )}
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[650px] flex flex-col p-0">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-50 w-7 h-7 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-all duration-200 focus:outline-none md:hidden"
        >
          <Icon name="X" size={16} className="text-white" />
          <span className="sr-only">Закрыть</span>
        </button>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="personal" className="gap-2">
              <Icon name="User" size={16} />
              Личный чат
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-2 relative">
              <Icon name="Users" size={16} />
              Группа
              {groupUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {groupUnreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="flex-1 m-0 flex flex-col data-[state=inactive]:hidden">
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 py-4">
                {renderMessages(personalMessages, personalScrollRef, personalIsLoading, false)}
                {personalAdminTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-600">
                      Администратор печатает...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {renderChatInput(
              personalNewMessage,
              setPersonalNewMessage,
              handlePersonalTyping,
              sendPersonalMessage,
              personalIsSending,
              personalSelectedFile,
              personalPreviewUrl,
              personalFileInputRef,
              handlePersonalFileSelect,
              cancelPersonalFile,
              false
            )}
          </TabsContent>

          <TabsContent value="group" className="flex-1 m-0 flex flex-col data-[state=inactive]:hidden">
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 py-4">
                {renderMessages(groupMessages, groupScrollRef, groupIsLoading, true)}
              </div>
            </ScrollArea>

            {renderChatInput(
              groupNewMessage,
              setGroupNewMessage,
              handleGroupTyping,
              sendGroupMessage,
              groupIsSending,
              groupSelectedFile,
              groupPreviewUrl,
              groupFileInputRef,
              handleGroupFileSelect,
              cancelGroupFile,
              true
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}