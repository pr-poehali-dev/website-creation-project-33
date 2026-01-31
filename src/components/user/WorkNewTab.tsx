import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface WorkNewTabProps {
  selectedOrganizationId: number | null;
}

export default function WorkNewTab({ selectedOrganizationId }: WorkNewTabProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      });

      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setShowForm(true);
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      alert('Не удалось получить доступ к камере. Проверьте разрешения.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCancel = () => {
    stopRecording();
    setShowForm(false);
    setParentName('');
    setChildName('');
    setChildAge('');
    setVideoBlob(null);
  };

  const handleSendToTelegram = async () => {
    if (!parentName || !childName || !childAge || !videoBlob) {
      alert('Заполните все поля и запишите видео');
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('parentName', parentName);
      formData.append('childName', childName);
      formData.append('childAge', childAge);
      formData.append('video', videoBlob, 'lead-video.webm');
      formData.append('organizationId', String(selectedOrganizationId || ''));

      const response = await fetch('/api/send-lead-telegram', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки');
      }

      alert('✅ Лид успешно отправлен в Telegram!');
      handleCancel();
    } catch (error) {
      console.error('Ошибка отправки в Telegram:', error);
      alert('Не удалось отправить данные. Попробуйте снова.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(var(--color-primary-start))] to-[rgb(var(--color-primary-end))] p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {!showForm ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <button
              onClick={startRecording}
              className="w-24 h-24 rounded-full bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 transition-all shadow-2xl flex items-center justify-center"
            >
              <Icon name="Video" size={40} className="text-white" />
            </button>
            <p className="text-white text-center text-lg font-medium">
              Нажмите для начала записи видео
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Новый лид</h2>
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-500 font-medium">Запись...</span>
                </div>
              )}
            </div>

            <div className="flex justify-center mb-6">
              <img 
                src="https://cdn.poehali.dev/files/de6035d0-e0d9-4549-9238-220838c9ea5d.png" 
                alt="QR Code"
                className="w-48 h-48 rounded-lg"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="parentName">Имя родителя</Label>
                <Input
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Введите имя родителя"
                  disabled={isSending}
                />
              </div>

              <div>
                <Label htmlFor="childName">Имя ребенка</Label>
                <Input
                  id="childName"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Введите имя ребенка"
                  disabled={isSending}
                />
              </div>

              <div>
                <Label htmlFor="childAge">Возраст</Label>
                <Input
                  id="childAge"
                  type="number"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  placeholder="Введите возраст"
                  disabled={isSending}
                />
              </div>
            </div>

            {isRecording && (
              <Button
                onClick={stopRecording}
                variant="outline"
                className="w-full"
              >
                <Icon name="Square" size={20} />
                Остановить запись
              </Button>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
                disabled={isSending}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSendToTelegram}
                className="flex-1 bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90"
                disabled={isSending || !videoBlob}
              >
                {isSending ? 'Отправка...' : 'Отправить в Telegram'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
