import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import NotebookModal from './NotebookModal';
import QRCodeModal from './QRCodeModal';
import EndShiftSection from './EndShiftSection';
import BlockedUserModal from './BlockedUserModal';

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

      if (isRecording && mediaRecorderRef.current) {
        console.log('🎤 Stopping recording...');
        
        const audioBlobPromise = new Promise<Blob>((resolve, reject) => {
          const originalOnstop = mediaRecorderRef.current!.onstop;
          
          mediaRecorderRef.current!.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            console.log('🎤 Audio recorded in handleSend, blob size:', blob.size);
            
            const stream = mediaRecorderRef.current?.stream;
            stream?.getTracks().forEach(track => track.stop());
            
            resolve(blob);
          };

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
        title: 'Ошибка отправки',
        description: 'Не удалось отправить данные. Попробуйте снова.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndShift = async (photoUrl: string) => {
    console.log('📸 Ending shift with photo:', photoUrl);
    
    if (!selectedOrganizationId || !user) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось определить организацию или пользователя',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/cc46a2e1-ed85-4c98-a16a-7513fa07bed2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify({
          organization_id: selectedOrganizationId,
          photo_url: photoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to end shift');
      }

      queryClient.invalidateQueries({ queryKey: ['today-contacts-count'] });

      toast({
        title: 'Смена завершена!',
        description: 'Спасибо за работу. Отдохните хорошо!'
      });

      onShiftEnd?.();
    } catch (error) {
      console.error('End shift error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось завершить смену. Попробуйте снова.',
        variant: 'destructive'
      });
    }
  };

  if (!selectedOrganizationId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        <div className="text-center space-y-4 sm:space-y-6 max-w-md">
          <div className="p-4 sm:p-6 rounded-full bg-blue-50 inline-block">
            <Icon name="Building2" size={48} className="text-blue-500 sm:w-[56px] sm:h-[56px]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Выберите организацию</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Выберите организацию из списка или создайте новую, чтобы начать работу
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex justify-center">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          style={{
            backgroundColor: isRecording ? '#064e3b' : '#047857',
          }}
          onMouseEnter={(e) => {
            if (!isRecording) {
              e.currentTarget.style.backgroundColor = '#064e3b';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRecording) {
              e.currentTarget.style.backgroundColor = '#047857';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 bg-white rounded-full animate-pulse" style={{ height: '20px', animationDelay: '0ms', animationDuration: '800ms' }}></div>
            <div className="w-2 bg-white rounded-full animate-pulse" style={{ height: '32px', animationDelay: '150ms', animationDuration: '800ms' }}></div>
            <div className="w-2 bg-white rounded-full animate-pulse" style={{ height: '24px', animationDelay: '300ms', animationDuration: '800ms' }}></div>
            <div className="w-2 bg-white rounded-full animate-pulse" style={{ height: '36px', animationDelay: '450ms', animationDuration: '800ms' }}></div>
            <div className="w-2 bg-white rounded-full animate-pulse" style={{ height: '22px', animationDelay: '600ms', animationDuration: '800ms' }}></div>
          </div>
        </button>
      </div>

      <NotebookModal
        open={notebookModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelNotebook();
          }
        }}
        isRecording={isRecording}
        isLoading={isLoading}
        parentName={parentName}
        setParentName={setParentName}
        childName={childName}
        setChildName={setChildName}
        childAge={childAge}
        setChildAge={setChildAge}
        phone={phone}
        setPhone={setPhone}
        onCancel={cancelNotebook}
        onSend={handleSendToTelegram}
        onQRClick={() => setQrModalOpen(true)}
      />

      <QRCodeModal 
        open={qrModalOpen} 
        onOpenChange={setQrModalOpen} 
      />

      <EndShiftSection
        endShiftPhotoOpen={endShiftPhotoOpen}
        setEndShiftPhotoOpen={setEndShiftPhotoOpen}
        dayResultsOpen={dayResultsOpen}
        setDayResultsOpen={setDayResultsOpen}
        onEndShift={handleEndShift}
        onShiftEnd={onShiftEnd}
        todayContactsCount={todayContactsCount}
        organizationId={selectedOrganizationId}
      />

      <BlockedUserModal
        open={blockedUserModalOpen}
        onOpenChange={setBlockedUserModalOpen}
      />
    </div>
  );
}