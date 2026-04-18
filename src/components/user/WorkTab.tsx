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
  totalContactsCount?: number;
  onContactAdded?: () => void;
  onShiftEnd?: () => void;
  onBack?: () => void;
}

export default function WorkTab({ selectedOrganizationId, organizationName, onChangeOrganization, todayContactsCount, totalContactsCount = 0, onContactAdded, onShiftEnd, onBack }: WorkTabProps) {
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
    <div className="flex flex-col gap-5">

      {/* Stats card */}
      <div className="bg-[#001f54] rounded-2xl px-4 py-3 flex items-center gap-2">
        {/* Back icon */}
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all flex-shrink-0"
          title="Назад"
        >
          <Icon name="ArrowLeft" size={14} className="text-white" />
        </button>

        <div className="w-px h-6 bg-white/20 flex-shrink-0" />

        {/* Org */}
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <Icon name="MapPin" size={12} className="text-blue-300 flex-shrink-0" />
          <span className="text-blue-200 text-xs font-medium truncate">{organizationName}</span>
        </div>

        {/* Counters */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-blue-300 text-[9px] leading-none mb-0.5">Сегодня</p>
            <p className="text-white text-base font-bold leading-none">{todayContactsCount}</p>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="text-right">
            <p className="text-blue-300 text-[9px] leading-none mb-0.5">Всего</p>
            <p className="text-white text-base font-bold leading-none">{totalContactsCount}</p>
          </div>
          <div className="w-px h-6 bg-white/20" />
          {/* End shift icon */}
          <button
            onClick={() => setEndShiftPhotoOpen(true)}
            className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center transition-all"
            title="Завершить смену"
          >
            <Icon name="LogOut" size={13} className="text-white" />
          </button>
        </div>
      </div>

      {/* Record button */}
      <div className="flex flex-col items-center gap-3 py-6">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
        >

          <div className="flex items-end gap-1 h-10">
            {[18, 28, 22, 34, 20, 30, 16].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-white rounded-full"
                style={{
                  height: `${h}px`,
                  animation: 'waveBar 1s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </button>

      </div>

      <style>{`
        @keyframes waveBar {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }
      `}</style>

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

      {selectedOrganizationId && (
        <EndShiftSection
          endShiftPhotoOpen={endShiftPhotoOpen}
          setEndShiftPhotoOpen={setEndShiftPhotoOpen}
          onShiftEnd={onShiftEnd}
          organizationId={selectedOrganizationId}
          hideButton
        />
      )}

      <BlockedUserModal
        open={blockedUserModalOpen}
        onOpenChange={setBlockedUserModalOpen}
      />
    </div>
  );
}