import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Logo from '@/components/ui/logo';
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
      toast({ title: 'Запись начата', description: 'Говорите четко в микрофон' });
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
      toast({ title: 'Запись завершена', description: 'Аудио сохранено' });
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    toast({ title: 'Аудио удалено' });
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
          title: 'Успешно отправлено!',
          description: 'Ваши данные переданы в систему'
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Пользователь</p>
              </div>
              <Button 
                onClick={logout} 
                variant="outline"
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border"
              >
                <Icon name="LogOut" size={16} className="mr-2" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Рабочая панель
          </h1>
          <p className="text-muted-foreground">
            Создавайте заметки и записывайте аудио для отправки в систему
          </p>
        </div>

        <div className="grid gap-6">
          {/* Блокнот */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon name="NotebookPen" size={20} className="text-primary" />
                </div>
                Текстовые заметки
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Введите информацию или комментарии
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Введите ваши заметки здесь..."
                className="min-h-[120px] md:min-h-[150px] bg-background border-input text-foreground placeholder:text-muted-foreground resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                maxLength={4096}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-muted-foreground">
                  {notes.length}/4096 символов
                </span>
                {notes.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setNotes('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Icon name="X" size={14} className="mr-1" />
                    Очистить
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Аудиозапись */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon name="Mic" size={20} className="text-primary" />
                </div>
                Аудио запись
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Записывайте голосовые заметки для дополнительной информации
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-16 h-16 md:w-20 md:h-20 p-0 transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <Icon name="Mic" size={28} />
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full w-16 h-16 md:w-20 md:h-20 p-0 animate-pulse transition-all duration-200 shadow-lg"
                    >
                      <Icon name="Square" size={28} />
                    </Button>
                  )}
                </div>
                
                {isRecording && (
                  <div className="flex items-center gap-3 text-foreground bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Запись в процессе...</span>
                  </div>
                )}

                {audioBlob && !isRecording && (
                  <div className="flex items-center gap-4 text-foreground bg-secondary px-4 py-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <Icon name="CheckCircle" size={16} className="text-green-600" />
                      <span className="text-sm font-medium">Аудио записано</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAudio}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Icon name="Trash2" size={14} className="mr-1" />
                      Удалить
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center max-w-md">
                  Нажмите на кнопку микрофона для начала записи. 
                  Для остановки нажмите кнопку квадрата.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Кнопка отправки */}
          <div className="flex justify-center">
            <Button
              onClick={sendToTelegram}
              disabled={isLoading || (!notes.trim() && !audioBlob)}
              size="lg"
              className="bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground h-12 md:h-14 px-8 md:px-12 text-base md:text-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Icon name="Loader2" size={20} className="animate-spin" />
                  <span>Отправка...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Icon name="Send" size={20} />
                  <span>Отправить в систему</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 Admin Panel System. Все права защищены.
          </p>
        </footer>
      </main>
    </div>
  );
}