import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ChatDialog from '@/components/chat/ChatDialog';
import { useChatUnread } from '@/hooks/useChatUnread';

export default function Index() {
  const { user, logout } = useAuth();
  const unreadCount = useChatUnread();
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('notepad_draft');
    return saved || '';
  });
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (notes) {
      localStorage.setItem('notepad_draft', notes);
    } else {
      localStorage.removeItem('notepad_draft');
    }
  }, [notes]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({ 
        title: 'Ошибка доступа к микрофону',
        description: 'Разрешите доступ к микрофону для записи аудио',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendToTelegram = async () => {
    if (!notes.trim() && !audioBlob) {
      toast({ 
        title: 'Нет данных для отправки',
        description: 'Добавьте заметку или запишите аудио',
        variant: 'destructive'
      });
      return;
    }

    // ОБЯЗАТЕЛЬНО проверяем наличие российского номера телефона в блокноте
    if (!notes.trim()) {
      toast({
        title: 'Введите номер клиента',
        description: 'Укажите российский номер телефона в блокноте',
        variant: 'destructive'
      });
      return;
    }

    const phoneRegex = /(?:\+7|8|7)[\s\-\(\)]?\d{3}[\s\-\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|9\d{9}/;
    const hasRussianPhone = phoneRegex.test(notes.trim());

    if (!hasRussianPhone) {
      toast({
        title: 'Введите номер клиента',
        description: 'Укажите российский номер телефона в блокноте',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      let audioData = null;
      
      // Конвертируем аудио в base64 если есть
      if (audioBlob) {
        const reader = new FileReader();
        audioData = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(audioBlob);
        });
      }

      // Запрещаем отправку в Telegram без аудиозаписи
      if (!audioData) {
        toast({
          title: 'Ошибка',
          description: 'Необходимо записать аудио перед отправкой',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch('https://functions.poehali.dev/ecd9eaa3-7399-4f8b-8219-529b81f87b6a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || '',
        },
        body: JSON.stringify({
          notes: notes.trim(),
          audio_data: audioData
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка сети');
      }

      const result = await response.json();
      
      if (result.success) {
        // Отправляем данные в Google Sheets
        try {
            const now = new Date();
            const timestamp = now.toLocaleString('ru-RU', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            const sheetsResponse = await fetch('https://functions.poehali.dev/ce92c4be-1721-49f2-95bb-4bafa6f05fc4', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                promoter_name: user?.name || 'Неизвестный',
                notes: notes.trim(),
                timestamp: timestamp
              })
            });

            if (!sheetsResponse.ok) {
              console.error('Ошибка отправки в Google Sheets:', await sheetsResponse.text());
            } else {
              const sheetsResult = await sheetsResponse.json();
              console.log('Успешно отправлено в Google Sheets:', sheetsResult);
            }
          } catch (error) {
            console.error('Ошибка отправки в Google Sheets:', error);
          }

        toast({ 
          title: 'Отправлено!',
          description: 'Ваши данные успешно отправлены в Telegram'
        });
        
        // Очищаем форму и localStorage после отправки
        setNotes('');
        setAudioBlob(null);
        localStorage.removeItem('notepad_draft');
      } else {
        throw new Error(result.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.error('Send error:', error);
      toast({ 
        title: 'Ошибка отправки',
        description: 'Не удалось отправить данные. Попробуйте снова.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e8eef5] p-4 md:p-6">
      <div className="max-w-2xl mx-auto pt-4 md:pt-8">
        {/* Мобильная версия заголовка */}
        <div className="md:hidden mb-6 slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-[#001f54] overflow-hidden flex items-center justify-center p-2 shadow-lg">
                <img 
                  src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg" 
                  alt="IMPERIA PROMO"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-bold text-[#001f54]">
                IMPERIA PROMO
              </h1>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setChatOpen(true)} 
                className="bg-[#001f54] hover:bg-[#002b6b] text-white transition-all duration-300 px-3 py-2 shadow-lg hover:scale-105 relative"
                size="sm"
              >
                <Icon name="MessageCircle" size={16} />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center bg-red-500 hover:bg-red-500 text-white text-xs px-1">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <Button 
                onClick={logout} 
                className="bg-[#001f54] hover:bg-[#002b6b] text-white transition-all duration-300 px-3 py-2 shadow-lg hover:scale-105"
                size="sm"
              >
                <Icon name="LogOut" size={16} />
              </Button>
            </div>
          </div>
          <p className="text-[#001f54]/70 text-sm font-medium">Добро пожаловать, {user?.name}</p>
        </div>

        {/* Десктопная версия заголовка */}
        <div className="hidden md:flex justify-between items-center mb-8 slide-up">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white border-4 border-[#001f54] overflow-hidden flex items-center justify-center p-3 shadow-xl">
              <img 
                src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg" 
                alt="IMPERIA PROMO"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#001f54] mb-2">
                IMPERIA PROMO
              </h1>
              <p className="text-[#001f54]/70 text-lg font-medium">Добро пожаловать, {user?.name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setChatOpen(true)} 
              className="bg-[#001f54] hover:bg-[#002b6b] text-white transition-all duration-300 shadow-lg hover:scale-105 relative"
            >
              <Icon name="MessageCircle" size={16} className="mr-2" />
              Чат
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-500 hover:bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button 
              onClick={logout} 
              className="bg-[#001f54] hover:bg-[#002b6b] text-white transition-all duration-300 shadow-lg hover:scale-105"
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6">
          {/* Блокнот */}
          <Card className="bg-white border-[#001f54]/20 shadow-xl slide-up hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-[#001f54]">
                <div className="p-1.5 md:p-2 rounded-lg bg-[#001f54]/10">
                  <Icon name="NotebookPen" size={18} className="text-[#001f54] md:w-5 md:h-5" />
                </div>
                Блокнот
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Введите ваши заметки здесь..."
                className="min-h-[120px] md:min-h-[150px] bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 resize-none focus:border-[#001f54] focus:ring-[#001f54]/20 transition-all duration-300 text-sm md:text-base"
                maxLength={4096}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-600">
                  {notes.length}/4096 символов
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Аудиозапись */}
          <Card className="bg-white border-[#001f54]/20 shadow-xl slide-up hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-[#001f54]">
                <div className="p-1.5 md:p-2 rounded-lg bg-[#001f54]/10">
                  <Icon name="Star" size={18} className="text-[#001f54] md:w-5 md:h-5" />
                </div>
                Контроль качества
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center gap-4 md:gap-6">
                <div className="flex items-center gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      style={audioBlob ? { backgroundColor: '#fbbf24', borderColor: '#fbbf24' } : undefined}
                      className={`${audioBlob ? 'hover:bg-yellow-500' : 'bg-[#001f54] hover:bg-[#002b6b]'} text-white rounded-full w-16 h-16 md:w-20 md:h-20 p-0 transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl`}
                    >
                      <Icon name="Star" size={24} className="md:w-8 md:h-8" />
                    </Button>
                  ) : (
                    <div className="relative">
                      <style>{`
                        @keyframes breathing {
                          0%, 100% {
                            opacity: 0.6;
                            transform: scale(1);
                          }
                          50% {
                            opacity: 1;
                            transform: scale(1.05);
                          }
                        }
                        @keyframes squareFade {
                          0%, 100% {
                            opacity: 0.3;
                            transform: scale(0.8);
                          }
                          50% {
                            opacity: 1;
                            transform: scale(1.1);
                          }
                        }
                        .breathing-animation {
                          animation: breathing 3s ease-in-out infinite;
                        }
                        .square-fade-animation {
                          animation: squareFade 3s ease-in-out infinite;
                        }
                      `}</style>
                      <Button
                        onClick={stopRecording}
                        size="lg"
                        className="bg-[#002b6b] hover:bg-[#003d8f] text-white rounded-full w-16 h-16 md:w-20 md:h-20 p-0 shadow-xl breathing-animation"
                      >
                        <div className="square-fade-animation">
                          <Icon name="Square" size={24} className="md:w-8 md:h-8" />
                        </div>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Кнопка отправки */}
          <Button
            onClick={sendToTelegram}
            disabled={isLoading || (!notes.trim() && !audioBlob)}
            size="lg"
            className="bg-[#001f54] hover:bg-[#002b6b] disabled:bg-gray-300 text-white h-14 md:h-16 text-lg md:text-xl font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl slide-up"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 md:gap-3">
                <Icon name="Loader2" size={20} className="animate-spin md:w-6 md:h-6" />
                <span className="text-base md:text-xl">Отправка...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 md:gap-3">
                <Icon name="Send" size={20} className="md:w-6 md:h-6" />
                <span className="text-base md:text-xl">Отправить в Telegram</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      <ChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}