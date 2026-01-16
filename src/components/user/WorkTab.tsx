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
  onShiftEnd?: () => void;
}

export default function WorkTab({ selectedOrganizationId, organizationName, onChangeOrganization, todayContactsCount, onContactAdded, onShiftEnd }: WorkTabProps) {
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
  const [blockedUserModalOpen, setBlockedUserModalOpen] = useState(false);
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
    // Блокировка для Анны Королевой (user_id = 6853)
    if (user?.id === 6853) {
      setBlockedUserModalOpen(true);
      return;
    }

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

  const cancelNotebook = async () => {
    stopRecording();
    setNotebookModalOpen(false);
    setAudioBlob(null);
    setNotes('');
    localStorage.removeItem('notepad_draft');
    
    if (selectedOrganizationId && user) {
      try {
        await fetch('https://functions.poehali.dev/c587029d-f424-4cf7-8816-d61ef2c6756b', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString(),
          },
          body: JSON.stringify({
            organization_id: selectedOrganizationId,
          }),
        });
      } catch (error) {
        console.error('Failed to track approach:', error);
      }
    }
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
    <div className="space-y-6 md:space-y-8 px-4 md:px-0">
      {/* Кнопка записи звука */}
      <div className="flex justify-center py-8 md:py-12">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="audio-record-button shadow-lg hover:shadow-xl"
          style={{
            width: '100px',
            height: '100px',
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
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 bg-white rounded-full animate-pulse" style={{ height: '16px', animationDelay: '0ms', animationDuration: '800ms' }}></div>
            <div className="w-1.5 bg-white rounded-full animate-pulse" style={{ height: '26px', animationDelay: '150ms', animationDuration: '800ms' }}></div>
            <div className="w-1.5 bg-white rounded-full animate-pulse" style={{ height: '20px', animationDelay: '300ms', animationDuration: '800ms' }}></div>
            <div className="w-1.5 bg-white rounded-full animate-pulse" style={{ height: '30px', animationDelay: '450ms', animationDuration: '800ms' }}></div>
            <div className="w-1.5 bg-white rounded-full animate-pulse" style={{ height: '18px', animationDelay: '600ms', animationDuration: '800ms' }}></div>
          </div>
        </button>
      </div>

      {/* Модальное окно с блокнотом */}
      <Dialog open={notebookModalOpen} onOpenChange={(open) => {
        if (!open) {
          cancelNotebook();
        }
      }}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto bg-white !border-0 shadow-2xl rounded-2xl p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500 shadow-lg">
                <Icon name="NotebookPen" size={20} className="text-white sm:w-[22px] sm:h-[22px]" />
              </div>
              {isRecording && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 rounded-full">
                  <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: '14px', animationDelay: '0ms', animationDuration: '800ms' }}></div>
                  <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: '22px', animationDelay: '150ms', animationDuration: '800ms' }}></div>
                  <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: '18px', animationDelay: '300ms', animationDuration: '800ms' }}></div>
                  <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: '26px', animationDelay: '450ms', animationDuration: '800ms' }}></div>
                  <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: '16px', animationDelay: '600ms', animationDuration: '800ms' }}></div>
                </div>
              )}
            </div>
            
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Имя родителя, имя ребенка, возраст ребенка"
              className="min-h-[180px] sm:min-h-[200px] md:min-h-[250px] bg-white !border-2 !border-blue-500 text-gray-900 placeholder:text-gray-400 resize-none focus:!border-blue-500 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none !outline-none transition-all duration-300 text-sm sm:text-base rounded-xl"
              style={{ outline: 'none', boxShadow: 'none' }}
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 mt-4">
            <Button
              onClick={cancelNotebook}
              variant="outline"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 w-full sm:w-auto rounded-xl font-medium transition-all duration-300 text-sm sm:text-base h-10 sm:h-auto"
              disabled={isLoading}
            >
              <Icon name="X" size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="ml-1">Отменить</span>
            </Button>
            <Button
              onClick={handleSendToTelegram}
              disabled={isLoading}
              className="bg-[#0088cc] hover:bg-[#006699] text-white flex items-center gap-2 w-full sm:w-auto justify-center rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base h-10 sm:h-auto"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" />
                  <span>Отправка...</span>
                </>
              ) : (
                <>
                  <Icon name="Send" size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Отправить в Telegram</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Кнопка завершить смену */}
      <div className="flex justify-center">
        <button
          onClick={() => setEndShiftPhotoOpen(true)}
          className="px-8 py-4 md:px-10 md:py-5 bg-white text-[#001f54] border-2 border-[#001f54] rounded-full font-semibold text-base md:text-lg hover:bg-[#001f54] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3"
        >
          <Icon name="LogOut" size={20} className="md:w-6 md:h-6" />
          Завершить смену
        </button>
      </div>

      <PhotoCapture
        open={endShiftPhotoOpen}
        onOpenChange={setEndShiftPhotoOpen}
        type="end"
        organizationId={selectedOrganizationId || 0}
        onSuccess={(contactsCount) => {
          console.log('✅ Photo sent successfully');
          queryClient.invalidateQueries({ queryKey: ['user-stats'] });
          
          // Показываем результаты за день после успешной отправки фото
          setTimeout(() => {
            setDayResultsOpen(true);
          }, 300);
        }}
      />

      <DayResultsDialog
        open={dayResultsOpen}
        contactsCount={todayContactsCount}
        onClose={() => {
          setDayResultsOpen(false);
          onShiftEnd?.();
        }}
      />

      {/* Модальное окно для заблокированного пользователя */}
      <Dialog open={blockedUserModalOpen} onOpenChange={setBlockedUserModalOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] bg-white !border-0 shadow-2xl rounded-2xl p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
            <div className="p-4 rounded-full bg-red-100">
              <Icon name="AlertCircle" size={48} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Свяжитесь с Максимом</h2>
            <p className="text-gray-600 text-lg">Для продолжения работы обратитесь к администратору</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setBlockedUserModalOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg"
            >
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}