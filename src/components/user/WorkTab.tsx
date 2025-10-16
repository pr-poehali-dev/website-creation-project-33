import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface WorkTabProps {
  selectedOrganizationId: number | null;
  organizationName: string;
  onChangeOrganization: () => void;
}

export default function WorkTab({ selectedOrganizationId, organizationName }: WorkTabProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('notepad_draft');
    return saved || '';
  });
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (notes) {
      localStorage.setItem('notepad_draft', notes);
    } else {
      localStorage.removeItem('notepad_draft');
    }
  }, [notes]);

  useEffect(() => {
    console.log('🎯 audioBlob changed:', audioBlob ? `Blob (${audioBlob.size} bytes)` : 'null');
  }, [audioBlob]);

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
        console.log('🎤 Audio recorded, blob size:', blob.size);
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

    setIsLoading(true);
    
    try {
      let audioData = null;
      
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

      if (!audioData) {
        toast({
          title: 'Ошибка',
          description: 'Необходимо записать аудио перед отправкой',
          variant: 'destructive'
        });
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
          audio_data: audioData,
          organization_id: selectedOrganizationId,
          organization_name: organizationName
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
    <div className="space-y-4 md:space-y-6">
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
          />
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
                <div className="flex flex-col items-center gap-2">
                  <Button
                    key={audioBlob ? 'has-audio' : 'no-audio'}
                    onClick={startRecording}
                    size="lg"
                    style={{
                      backgroundColor: audioBlob ? '#fbbf24' : '#001f54'
                    }}
                    className="hover:opacity-90 text-white rounded-full w-16 h-16 md:w-20 md:h-20 p-0 transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl"
                  >
                    <Icon name="Star" size={24} className="md:w-8 md:h-8" />
                  </Button>
                  <span className="text-xs">DEBUG: {audioBlob ? 'ЕСТЬ' : 'НЕТ'}</span>
                </div>
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
        className="w-full bg-[#001f54] hover:bg-[#002b6b] disabled:bg-gray-300 text-white h-14 md:h-16 text-lg md:text-xl font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl slide-up"
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
  );
}