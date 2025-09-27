import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
      toast({ title: 'Запись начата' });
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
      toast({ title: 'Запись остановлена' });
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
        toast({ 
          title: 'Отправлено!',
          description: 'Ваши данные успешно отправлены в Telegram'
        });
        
        // Очищаем форму после отправки
        setNotes('');
        setAudioBlob(null);
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
    <div className="min-h-screen relative overflow-hidden p-4">
      {/* Анимированный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 opacity-30">
          <div className="w-2 h-2 bg-white rounded-full absolute top-20 left-20 animate-pulse"></div>
          <div className="w-1 h-1 bg-white rounded-full absolute top-40 left-60 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="w-1 h-1 bg-white rounded-full absolute top-60 left-40 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="w-2 h-2 bg-white rounded-full absolute top-80 left-80 animate-pulse" style={{animationDelay: '3s'}}></div>
        </div>
      </div>
      
      {/* Плавающие световые элементы */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation" style={{animationDelay: '2s'}}></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation" style={{animationDelay: '4s'}}></div>
      
      <div className="max-w-2xl mx-auto pt-8 relative z-10">
        <div className="flex justify-between items-center mb-8 slide-up">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              IMPERIA PROMO
            </h1>
            <p className="text-white/80 text-lg">Добро пожаловать, {user?.name}</p>
          </div>
          <Button 
            onClick={logout} 
            className="glass-effect border-white/20 text-white hover:bg-white/10 transition-all duration-300"
            variant="ghost"
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>

        <div className="grid gap-6 fade-in">
          {/* Блокнот */}
          <Card className="glass-effect border-white/20 shadow-2xl slide-up">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 pulse-glow">
                  <Icon name="NotebookPen" size={20} className="text-white" />
                </div>
                Блокнот
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Введите ваши заметки здесь..."
                className="min-h-[150px] glass-effect border-white/20 bg-white/5 text-white placeholder:text-white/50 resize-none focus:border-purple-400 focus:ring-purple-400/30 transition-all duration-300"
                maxLength={4096}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-white/60">
                  {notes.length}/4096 символов
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Аудиозапись */}
          <Card className="glass-effect border-white/20 shadow-2xl slide-up" style={{animationDelay: '0.2s'}}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 pulse-glow">
                  <Icon name="Mic" size={20} className="text-white" />
                </div>
                Контроль качества
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="glow-button text-white rounded-full w-20 h-20 p-0 transition-all duration-300 hover:scale-110"
                    >
                      <Icon name="Mic" size={32} />
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full w-20 h-20 p-0 animate-pulse transition-all duration-300"
                    >
                      <Icon name="Square" size={32} />
                    </Button>
                  )}
                </div>
                
                {isRecording && (
                  <div className="flex items-center gap-3 text-red-400 glass-effect px-4 py-2 rounded-full">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Идет запись...</span>
                  </div>
                )}

                {audioBlob && !isRecording && (
                  <div className="flex items-center gap-3 text-green-400 glass-effect px-4 py-2 rounded-full">
                    <Icon name="CheckCircle" size={16} />
                    <span className="text-sm font-medium">Аудио записано</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Кнопка отправки */}
          <Button
            onClick={sendToTelegram}
            disabled={isLoading || (!notes.trim() && !audioBlob)}
            size="lg"
            className="glow-button text-white h-16 text-xl font-semibold shadow-2xl transition-all duration-300 hover:scale-105 slide-up"
            style={{animationDelay: '0.4s'}}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Icon name="Loader2" size={24} className="animate-spin" />
                Отправка...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Icon name="Send" size={24} />
                Отправить в Telegram
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}