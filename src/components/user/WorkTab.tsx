import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import PhotoCapture from './PhotoCapture';
import DayResultsDialog from './DayResultsDialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';

interface WorkTabProps {
  selectedOrganizationId: number | null;
  organizationName: string;
  onChangeOrganization: () => void;
  todayContactsCount: number;
  onContactAdded?: () => void;
}

export default function WorkTab({ selectedOrganizationId, organizationName, onChangeOrganization, todayContactsCount, onContactAdded }: WorkTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('notepad_draft');
    return saved || '';
  });
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [endShiftPhotoOpen, setEndShiftPhotoOpen] = useState(false);
  const [dayResultsOpen, setDayResultsOpen] = useState(false);
  const [notebookModalOpen, setNotebookModalOpen] = useState(false);
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

  useEffect(() => {
    console.log('🔴 endShiftPhotoOpen changed:', endShiftPhotoOpen);
  }, [endShiftPhotoOpen]);

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
      setNotebookModalOpen(true);
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

  const cancelNotebook = () => {
    stopRecording();
    setNotebookModalOpen(false);
    setAudioBlob(null);
    setNotes('');
    localStorage.removeItem('notepad_draft');
  };

  const handleSendToTelegram = async () => {
    setIsLoading(true);

    try {
      let finalAudioBlob = audioBlob;

      // Если запись ещё идёт, останавливаем и ждём результат
      if (isRecording && mediaRecorderRef.current) {
        console.log('🎤 Stopping recording...');
        
        // Создаём промис который разрешится когда получим blob
        const audioBlobPromise = new Promise<Blob>((resolve, reject) => {
          const originalOnstop = mediaRecorderRef.current!.onstop;
          
          mediaRecorderRef.current!.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            console.log('🎤 Audio recorded in handleSend, blob size:', blob.size);
            
            const stream = mediaRecorderRef.current?.stream;
            stream?.getTracks().forEach(track => track.stop());
            
            resolve(blob);
          };

          // Таймаут на 5 секунд
          setTimeout(() => reject(new Error('Recording timeout')), 5000);
        });

        mediaRecorderRef.current.stop();
        setIsRecording(false);
        
        finalAudioBlob = await audioBlobPromise;
        setAudioBlob(finalAudioBlob);
      }

      if (!finalAudioBlob) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось записать аудио. Попробуйте снова.',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      console.log('📤 Sending audio blob, size:', finalAudioBlob.size);
      
      const reader = new FileReader();
      const audioData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read audio'));
        reader.readAsDataURL(finalAudioBlob);
      });

      fetch('https://functions.poehali.dev/ecd9eaa3-7399-4f8b-8219-529b81f87b6a', {
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
      }).catch(err => console.error('Background send error:', err));

      toast({ 
        title: 'Отправлено!',
        description: 'Ваши данные отправляются в Telegram'
      });
      
      onContactAdded?.();
      setNotes('');
      setAudioBlob(null);
      setNotebookModalOpen(false);
      localStorage.removeItem('notepad_draft');
    } catch (error) {
      console.error('Send error:', error);
      toast({ 
        title: 'Ошибка',
        description: 'Не удалось записать аудио. Попробуйте снова.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Кнопка записи звука */}
      <Card className="bg-white border-blue-500/20 shadow-xl slide-up hover:shadow-2xl transition-all duration-300 p-8">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold text-black">Контроль качества</h2>
          <button
            onClick={startRecording}
            disabled={isRecording}
            className="audio-record-button"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#001f54',
              border: 'none',
              cursor: isRecording ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              opacity: isRecording ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isRecording) {
                e.currentTarget.style.backgroundColor = '#003580';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isRecording) {
                e.currentTarget.style.backgroundColor = '#001f54';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </button>
        </div>
      </Card>

      {/* Модальное окно с блокнотом */}
      <Dialog open={notebookModalOpen} onOpenChange={(open) => {
        if (!open) {
          cancelNotebook();
        }
      }}>
        <DialogContent className="max-w-2xl bg-white">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Icon name="NotebookPen" size={20} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-black">Блокнот</h2>
              {isRecording && (
                <div className="flex items-center gap-2 ml-auto">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-600 font-medium">Идёт запись...</span>
                </div>
              )}
            </div>
            
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Имя родителя, имя ребенка, возраст ребенка"
              className="min-h-[250px] bg-white border-gray-200 text-black placeholder:text-gray-400 resize-none focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
            />
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              onClick={cancelNotebook}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={isLoading}
            >
              <Icon name="X" size={18} />
              Отменить
            </Button>
            <Button
              onClick={handleSendToTelegram}
              disabled={isLoading}
              className="bg-[#0088cc] hover:bg-[#006699] text-white flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={18} className="animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" size={18} />
                  Отправить в Telegram
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Кнопка завершить смену */}
      <Button 
        onClick={() => setEndShiftPhotoOpen(true)}
        size="lg"
        variant="outline"
        className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300 text-base md:text-lg h-12 md:h-14 font-semibold"
      >
        <Icon name="LogOut" size={20} className="md:w-6 md:h-6" />
        Завершить смену
      </Button>

      <PhotoCapture
        open={endShiftPhotoOpen}
        onClose={() => {
          console.log('🔵 PhotoCapture onClose called');
          setEndShiftPhotoOpen(false);
        }}
        onPhotoTaken={async (photoFile) => {
          console.log('📸 Photo taken, size:', photoFile.size);
          
          try {
            const formData = new FormData();
            formData.append('photo', photoFile);
            formData.append('user_id', user?.id?.toString() || '');
            formData.append('organization_id', selectedOrganizationId?.toString() || '');

            const response = await fetch('https://functions.poehali.dev/b0be5279-ea87-4088-b93c-8d93cd0c49cb', {
              method: 'POST',
              body: formData
            });

            if (!response.ok) {
              throw new Error('Network response was not ok');
            }

            toast({
              title: 'Смена завершена',
              description: 'Фото отправлено успешно'
            });

            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            
            console.log('✅ Photo sent successfully, closing modal');
            setEndShiftPhotoOpen(false);
            
            // Показываем результаты за день после успешной отправки фото
            setTimeout(() => {
              setDayResultsOpen(true);
            }, 300);
          } catch (error) {
            console.error('❌ Error sending photo:', error);
            toast({
              title: 'Ошибка',
              description: 'Не удалось отправить фото',
              variant: 'destructive'
            });
          }
        }}
      />

      <DayResultsDialog
        open={dayResultsOpen}
        onClose={() => setDayResultsOpen(false)}
      />
    </div>
  );
}