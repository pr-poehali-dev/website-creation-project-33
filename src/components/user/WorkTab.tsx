import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [parentName, setParentName] = useState(() => localStorage.getItem('parent_name_draft') || '');
  const [childName, setChildName] = useState(() => localStorage.getItem('child_name_draft') || '');
  const [childAge, setChildAge] = useState(() => localStorage.getItem('child_age_draft') || '');
  const [phone, setPhone] = useState(() => localStorage.getItem('phone_draft') || '');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [endShiftPhotoOpen, setEndShiftPhotoOpen] = useState(false);
  const [dayResultsOpen, setDayResultsOpen] = useState(false);
  const [notebookModalOpen, setNotebookModalOpen] = useState(false);
  const [blockedUserModalOpen, setBlockedUserModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    localStorage.setItem('parent_name_draft', parentName);
    localStorage.setItem('child_name_draft', childName);
    localStorage.setItem('child_age_draft', childAge);
    localStorage.setItem('phone_draft', phone);
  }, [parentName, childName, childAge, phone]);

  useEffect(() => {
    console.log('🎯 audioBlob changed:', audioBlob ? `Blob (${audioBlob.size} bytes)` : 'null');
  }, [audioBlob]);

  useEffect(() => {
    console.log('🔴 endShiftPhotoOpen changed:', endShiftPhotoOpen);
  }, [endShiftPhotoOpen]);

  const startRecording = async () => {
    console.log('🎤 startRecording called, user.id:', user?.id);
    
    // Блокировка для Анны Королевой (user_id = 6853)
    if (user?.id === 6853) {
      console.log('🚫 User blocked, showing modal');
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
    setParentName('');
    setChildName('');
    setChildAge('');
    setPhone('');
    localStorage.removeItem('parent_name_draft');
    localStorage.removeItem('child_name_draft');
    localStorage.removeItem('child_age_draft');
    localStorage.removeItem('phone_draft');
    
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

      const response = await fetch('https://functions.poehali.dev/ecd9eaa3-7399-4f8b-8219-529b81f87b6a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || '',
        },
        body: JSON.stringify({
          notes: `${parentName.trim()} ${childName.trim()} ${childAge.trim()} +7${phone.trim()}`,
          audio_data: audioData,
          organization_id: selectedOrganizationId,
          organization_name: organizationName
        })
      });

      // Проверка на блокировку пользователя
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ error: 'Свяжитесь с Максимом' }));
        setNotebookModalOpen(false);
        setBlockedUserModalOpen(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to send');
      }

      toast({ 
        title: 'Отправлено!',
        description: 'Ваши данные отправляются в Telegram'
      });
      
      onContactAdded?.();
      setParentName('');
      setChildName('');
      setChildAge('');
      setPhone('');
      setAudioBlob(null);
      setNotebookModalOpen(false);
      localStorage.removeItem('parent_name_draft');
      localStorage.removeItem('child_name_draft');
      localStorage.removeItem('child_age_draft');
      localStorage.removeItem('phone_draft');
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
        <DialogContent className="max-w-4xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto bg-white !border-0 shadow-2xl rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Левая часть - форма */}
            <div className="flex-1 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500 shadow-lg">
                  <Icon name="NotebookPen" size={20} className="text-white sm:w-[22px] sm:h-[22px]" />
                </div>
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 rounded-full">
                      <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: '14px', animationDelay: '0ms', animationDuration: '800ms' }}></div>
                      <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: '22px', animationDelay: '150ms', animationDuration: '800ms' }}></div>
                      <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: '18px', animationDelay: '300ms', animationDuration: '800ms' }}></div>
                      <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: '26px', animationDelay: '450ms', animationDuration: '800ms' }}></div>
                      <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: '16px', animationDelay: '600ms', animationDuration: '800ms' }}></div>
                    </div>
                  )}
                  <button
                    onClick={cancelNotebook}
                    disabled={isLoading}
                    className="p-2 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50"
                    title="Отменить"
                  >
                    <Icon name="X" size={20} />
                  </button>
                  <button
                    onClick={handleSendToTelegram}
                    disabled={isLoading}
                    className="p-2 rounded-xl bg-[#0088cc] hover:bg-[#006699] text-white transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
                    title="Отправить в Telegram"
                  >
                    {isLoading ? (
                      <Icon name="Loader2" size={20} className="animate-spin" />
                    ) : (
                      <Icon name="Send" size={20} />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Имя родителя
                </label>
                <Input
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Иван"
                  className="bg-white !border-2 !border-blue-500 text-gray-900 placeholder:text-gray-400 focus:!border-blue-500 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none !outline-none transition-all duration-300 text-sm sm:text-base rounded-xl h-11 sm:h-12"
                  style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Имя ребёнка
                </label>
                <Input
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Мария"
                  className="bg-white !border-2 !border-blue-500 text-gray-900 placeholder:text-gray-400 focus:!border-blue-500 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none !outline-none transition-all duration-300 text-sm sm:text-base rounded-xl h-11 sm:h-12"
                  style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Возраст
                  </label>
                  <Input
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    placeholder="5 лет"
                    className="bg-white !border-2 !border-blue-500 text-gray-900 placeholder:text-gray-400 focus:!border-blue-500 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none !outline-none transition-all duration-300 text-sm sm:text-base rounded-xl h-11 sm:h-12"
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Телефон
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 font-medium text-sm sm:text-base pointer-events-none">
                      +7
                    </span>
                    <Input
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 10) {
                          setPhone(value);
                        }
                      }}
                      placeholder="9001234567"
                      className="bg-white !border-2 !border-blue-500 text-gray-900 placeholder:text-gray-400 focus:!border-blue-500 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none !outline-none transition-all duration-300 text-sm sm:text-base rounded-xl h-11 sm:h-12 pl-9"
                      style={{ outline: 'none', boxShadow: 'none' }}
                      type="tel"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Правая часть - QR-код (десктоп и мобильный) */}
            <div className="flex flex-col items-center justify-center lg:min-w-[200px]">
              <div
                onClick={() => setQrModalOpen(true)}
                className="cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 p-3 bg-gray-50 rounded-2xl shadow-lg hover:shadow-xl"
              >
                <img 
                  src="https://cdn.poehali.dev/files/image-fotor-20260117124937.jpg"
                  alt="QR Code"
                  className="w-32 h-32 sm:w-40 sm:h-40"
                />
              </div>
            </div>
          </div>


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

      {/* Модальное окно с увеличенным QR-кодом */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] bg-transparent border-0 shadow-none p-0">
          <div 
            className="flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setQrModalOpen(false)}
          >
            <img 
              src="https://cdn.poehali.dev/files/image-fotor-20260117124937.jpg"
              alt="QR Code"
              className="w-full max-w-lg h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}