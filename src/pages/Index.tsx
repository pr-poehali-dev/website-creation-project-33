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
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">
              IMPERIA PROMO
            </h1>
            <p className="text-gray-600 text-lg">Добро пожаловать, {user?.name}</p>
          </div>
          <Button 
            onClick={logout} 
            className="bg-gray-100 hover:bg-gray-200 text-black border border-gray-200 transition-all duration-300"
            variant="ghost"
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Блокнот */}
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-black">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Icon name="NotebookPen" size={20} className="text-gray-600" />
                </div>
                Блокнот
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Введите ваши заметки здесь..."
                className="min-h-[150px] bg-white border-gray-200 text-black placeholder:text-gray-400 resize-none focus:border-black focus:ring-black/30 transition-all duration-300"
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
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-black">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Icon name="Mic" size={20} className="text-gray-600" />
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
                      className="bg-black hover:bg-gray-800 text-white rounded-full w-20 h-20 p-0 transition-all duration-300 hover:scale-110 shadow-lg"
                    >
                      <Icon name="Mic" size={32} />
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      className="bg-gray-800 hover:bg-gray-700 text-white rounded-full w-20 h-20 p-0 animate-pulse transition-all duration-300 shadow-lg"
                    >
                      <Icon name="Square" size={32} />
                    </Button>
                  )}
                </div>
                
                {isRecording && (
                  <div className="flex items-center gap-3 text-black bg-gray-50 border border-gray-200 px-4 py-2 rounded-full">
                    <div className="w-3 h-3 bg-black rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Идет запись...</span>
                  </div>
                )}

                {audioBlob && !isRecording && (
                  <div className="flex items-center gap-3 text-black bg-gray-50 border border-gray-200 px-4 py-2 rounded-full">
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
            className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white h-16 text-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105"
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