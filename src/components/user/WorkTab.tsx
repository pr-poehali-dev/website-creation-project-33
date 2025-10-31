import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import PhotoCapture from './PhotoCapture';
import DayResultsDialog from './DayResultsDialog';

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
  const [showNotepad, setShowNotepad] = useState(false);
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
      setShowNotepad(true);
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

  const restartRecording = async () => {
    setAudioBlob(null);
    setShowNotepad(false);
    await startRecording();
  };

  const sendToTelegram = async () => {
    if (!audioBlob) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо записать аудио перед отправкой',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      const audioData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read audio'));
        reader.readAsDataURL(audioBlob);
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
      setShowNotepad(false);
      localStorage.removeItem('notepad_draft');
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

  const handleEndShift = async (photo: string) => {
    console.log('🚀 handleEndShift called with photo length:', photo.length);
    
    try {
      const response = await fetch('https://functions.poehali.dev/4ab2d3fa-5a5a-462a-9a6a-5a97e5bfbbd8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || '',
        },
        body: JSON.stringify({
          organization_id: selectedOrganizationId,
          photo_data: photo.split(',')[1]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to end shift');
      }

      await queryClient.invalidateQueries({ queryKey: ['todayWork', user?.id] });

      console.log('✅ Shift ended, opening dialog');
      setEndShiftPhotoOpen(false);
      setDayResultsOpen(true);

    } catch (error) {
      console.error('❌ End shift error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось завершить смену',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      {/* Современный блок с записью лида */}
      <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Запись лида
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              {organizationName || 'Выберите организацию'}
            </p>
          </div>

          {!showNotepad ? (
            <div className="flex flex-col items-center gap-6">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="group relative"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(59, 130, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.3)';
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
              ) : (
                <div className="relative">
                  <style>{`
                    @keyframes rotate {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                    @keyframes pulse-ring {
                      0% { transform: scale(1); opacity: 0.8; }
                      50% { transform: scale(1.1); opacity: 0.4; }
                      100% { transform: scale(1); opacity: 0.8; }
                    }
                    .rotate-animation {
                      animation: rotate 2s linear infinite;
                    }
                    .pulse-ring {
                      animation: pulse-ring 2s ease-in-out infinite;
                    }
                  `}</style>
                  <div 
                    className="pulse-ring absolute inset-0 rounded-full bg-red-500"
                    style={{
                      width: '100px',
                      height: '100px',
                      left: '-10px',
                      top: '-10px'
                    }}
                  />
                  <button
                    onClick={stopRecording}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      border: '4px solid white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 10,
                      boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    <svg 
                      width="32" 
                      height="32" 
                      viewBox="0 0 24 24" 
                      fill="white"
                      xmlns="http://www.w3.org/2000/svg"
                      className="rotate-animation"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </button>
                </div>
              )}
              
              <p className="text-gray-700 font-medium">
                {isRecording ? 'Идет запись...' : 'Нажмите для начала записи'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-inner border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="NotebookPen" size={20} className="text-blue-600" />
                  <span className="font-semibold text-gray-900">Блокнот</span>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Имя родителя, телефон, класс"
                  className="min-h-[150px] bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 resize-none focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={restartRecording}
                  variant="outline"
                  className="w-full py-6 text-base font-semibold border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Icon name="RefreshCw" className="mr-2" size={20} />
                  Начать заново
                </Button>

                <Button
                  onClick={sendToTelegram}
                  disabled={isLoading}
                  className="w-full py-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" className="mr-2" size={20} />
                      Отправить в Telegram
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Кнопка завершить смену */}
      <Button
        onClick={() => setEndShiftPhotoOpen(true)}
        className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-xl"
      >
        <Icon name="LogOut" className="mr-2" size={24} />
        Завершить смену
      </Button>

      <PhotoCapture
        isOpen={endShiftPhotoOpen}
        onClose={() => setEndShiftPhotoOpen(false)}
        onCapture={handleEndShift}
        title="Завершение смены"
        description="Сфотографируйте себя для подтверждения завершения смены"
      />

      <DayResultsDialog
        open={dayResultsOpen}
        onOpenChange={setDayResultsOpen}
        organizationName={organizationName}
        contactsCount={todayContactsCount}
      />
    </div>
  );
}