import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

export default function Index() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            IMPERIA PROMO
          </h1>
        </div>

        <div className="grid gap-6">
          {/* Блокнот */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon name="NotebookPen" size={20} className="text-primary" />
                Блокнот
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Введите ваши заметки здесь..."
                className="min-h-[150px] border-0 bg-gray-50/50 resize-none focus:bg-white transition-colors"
                maxLength={4096}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {notes.length}/4096 символов
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Аудиозапись */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon name="Mic" size={20} className="text-primary" />
                Аудиозапись
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white rounded-full p-4"
                    >
                      <Icon name="Mic" size={24} />
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                      className="rounded-full p-4 animate-pulse"
                    >
                      <Icon name="Square" size={24} />
                    </Button>
                  )}
                </div>
                
                {isRecording && (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Идет запись...</span>
                  </div>
                )}

                {audioBlob && !isRecording && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Icon name="CheckCircle" size={16} />
                    <span className="text-sm">Аудио записано</span>
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
            className="bg-primary hover:bg-primary/90 text-white h-14 text-lg font-medium shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Отправка...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Icon name="Send" size={20} />
                Отправить в Telegram
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}