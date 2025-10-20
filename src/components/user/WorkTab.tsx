import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      console.log('🎯 sendToTelegram: audioBlob =', audioBlob);
      
      console.log('🎯 Reading audioBlob, size:', audioBlob.size);
      const reader = new FileReader();
      const audioData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          console.log('🎯 FileReader result length:', result?.length);
          const base64 = result.split(',')[1];
          console.log('🎯 Base64 length:', base64?.length);
          resolve(base64);
        };
        reader.onerror = () => {
          console.error('🎯 FileReader error');
          reject(new Error('Failed to read audio'));
        };
        reader.readAsDataURL(audioBlob);
      });

      console.log('🎯 audioData result:', audioData ? `${audioData.length} chars` : 'null');

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
        
        onContactAdded?.();
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
      <Card className="bg-white border-blue-500/20 shadow-xl slide-up hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-black">
            <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/10">
              <Icon name="NotebookPen" size={18} className="text-blue-500 md:w-5 md:h-5" />
            </div>
            Блокнот
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Имя родителя, телефон, класс"
            className="min-h-[120px] md:min-h-[150px] bg-white border-gray-200 text-black placeholder:text-gray-400 resize-none focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 text-sm md:text-base"
          />
        </CardContent>
      </Card>

      {/* Аудиозапись */}
      <Card className="bg-white border-blue-500/20 shadow-xl slide-up hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-black">
            <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/10">
              <Icon name="Star" size={18} className="text-blue-500 md:w-5 md:h-5" />
            </div>
            Контроль качества
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center gap-4 md:gap-6">
            <div className="flex items-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="audio-record-button"
                  style={{
                    width: '53px',
                    height: '53px',
                    borderRadius: '50%',
                    backgroundColor: audioBlob ? '#fbbf24' : '#001f54',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg 
                    width="21" 
                    height="21" 
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
                      from {
                        transform: rotate(0deg);
                      }
                      to {
                        transform: rotate(360deg);
                      }
                    }
                    .rotate-animation {
                      animation: rotate 2s linear infinite;
                    }
                  `}</style>
                  <button
                    onClick={stopRecording}
                    className="audio-record-button"
                    style={{
                      width: '53px',
                      height: '53px',
                      borderRadius: '50%',
                      backgroundColor: '#001f54',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div className="rotate-animation">
                      <svg 
                        width="21" 
                        height="21" 
                        viewBox="0 0 24 24" 
                        fill="white"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Кнопка Telegram */}
      <button
        type="button"
        onClick={sendToTelegram}
        disabled={isLoading || !audioBlob}
        style={{
          width: '100%',
          height: '60px',
          backgroundColor: (!audioBlob || isLoading) ? '#d1d5db' : '#3b82f6',
          color: 'black',
          fontSize: '20px',
          fontWeight: '600',
          borderRadius: '8px',
          border: 'none',
          cursor: (!audioBlob || isLoading) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
        onMouseDown={(e) => {
          if (!audioBlob || isLoading) return;
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onTouchStart={(e) => {
          if (!audioBlob || isLoading) return;
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isLoading ? (
          <>
            <Icon name="Loader2" size={24} className="animate-spin" />
            <span>Отправка...</span>
          </>
        ) : (
          <>
            <Icon name="Send" size={24} />
            <span>Telegram</span>
          </>
        )}
      </button>

      {/* Кнопка завершения смены */}
      <button
        type="button"
        onClick={async () => {
          console.log('🔴 Кнопка завершения смены нажата');
          console.log('🔄 Обновляем статистику лидов перед закрытием смены...');
          await queryClient.invalidateQueries({ queryKey: ['leadsStats', user?.id] });
          console.log('✅ Статистика обновлена, открываем PhotoCapture');
          setEndShiftPhotoOpen(true);
        }}
        style={{
          width: '100%',
          height: '60px',
          backgroundColor: 'white',
          color: 'black',
          fontSize: '20px',
          fontWeight: '600',
          borderRadius: '8px',
          border: '2px solid #e5e7eb',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          transition: 'background-color 0.2s',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <Icon name="LogOut" size={24} />
        <span>Завершить смену</span>
      </button>

      {selectedOrganizationId && (
        <PhotoCapture
          open={endShiftPhotoOpen}
          onOpenChange={setEndShiftPhotoOpen}
          onSuccess={(contactsCount) => {
            if (contactsCount !== undefined) {
              setDayResultsOpen(true);
            } else {
              toast({
                title: 'Смена закрыта',
                description: 'Фото окончания смены отправлено'
              });
            }
          }}
          type="end"
          organizationId={selectedOrganizationId}
        />
      )}

      <DayResultsDialog
        open={dayResultsOpen}
        contactsCount={todayContactsCount}
        onClose={() => {
          setDayResultsOpen(false);
          onChangeOrganization();
        }}
      />
    </div>
  );
}