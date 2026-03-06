import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const VIDEO_UPLOAD_URL = 'https://functions.poehali.dev/3698e100-6084-4fbd-aaca-c2be1dc6e458';

interface VideoLeadModalProps {
  open: boolean;
  onClose: () => void;
  videoBlob: Blob | null;
  mimeType?: string;
  isRecording?: boolean;
  onStopRecording?: () => Promise<Blob>;
  recordedSize?: number;
  maxSize?: number;
}

export default function VideoLeadModal({ open, onClose, videoBlob, mimeType = 'video/webm', isRecording = false, onStopRecording, recordedSize = 0, maxSize = 9.99 * 1024 * 1024 }: VideoLeadModalProps) {
  const { user } = useAuth();
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleSendClick = async () => {
    if (!parentName || !childName || !childAge || !phone) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    setSending(true);
    setStatusText('Останавливаю запись...');
    try {
      let finalBlob = videoBlob;
      if (isRecording && onStopRecording) {
        finalBlob = await onStopRecording();
      }

      if (!finalBlob || finalBlob.size === 0) {
        toast({ title: 'Нет видео для отправки', variant: 'destructive' });
        setSending(false);
        setStatusText('');
        return;
      }

      await sendLead(finalBlob);
    } catch (e) {
      console.error('Send error:', e);
      toast({ title: 'Не удалось отправить лид', variant: 'destructive' });
      setSending(false);
      setStatusText('');
    }
  };

  const sendLead = async (blob: Blob) => {
    // Шаг 1: конвертируем blob в base64
    setStatusText(`Подготавливаю видео (${(blob.size / 1024 / 1024).toFixed(1)} МБ)...`);
    const videoBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const marker = ';base64,';
        const idx = result.indexOf(marker);
        resolve(idx !== -1 ? result.slice(idx + marker.length) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Шаг 2: загружаем на сервер → S3
    setStatusText('Загружаю видео на сервер...');
    const uploadResp = await fetch('https://functions.poehali.dev/80ebc7f0-e4d8-4018-b8a8-477db92ac225', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video: videoBase64, mimeType }),
    });

    if (!uploadResp.ok) throw new Error('Не удалось загрузить видео');
    const { s3_key } = await uploadResp.json();

    // Шаг 3: отправляем ключ + данные формы в video-lead
    setStatusText('Отправляю в Telegram...');
    const response = await fetch(VIDEO_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user?.id?.toString() || '',
      },
      body: JSON.stringify({ s3_key, parentName, childName, childAge, phone, mimeType }),
    });

    if (response.ok) {
      toast({ title: 'Лид отправлен в Telegram!' });
      resetForm();
      onClose();
    } else {
      throw new Error('Ошибка отправки в Telegram');
    }
    setSending(false);
    setStatusText('');
  };

  const resetForm = () => {
    setParentName('');
    setChildName('');
    setChildAge('');
    setPhone('');
  };

  const handleCancel = () => {
    if (sending) return;
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            {isRecording && (
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse inline-block" />
            )}
            {isRecording ? 'Идёт запись...' : 'Новый лид'}
          </DialogTitle>
        </DialogHeader>

        {isRecording && (
          <div className="px-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Размер записи</span>
              <span className={recordedSize / maxSize > 0.85 ? 'text-orange-500 font-semibold' : ''}>
                {(recordedSize / 1024 / 1024).toFixed(1)} / 7 МБ
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${recordedSize / maxSize > 0.85 ? 'bg-orange-400' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((recordedSize / maxSize) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-center py-2">
          <img
            src="https://cdn.poehali.dev/files/460db08f-157a-4530-859d-b667980d60a1.png"
            alt="QR Code"
            className="w-36 h-36 object-contain"
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="parent" className="text-gray-700 text-sm">Имя родителя</Label>
            <Input
              id="parent"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Введите имя родителя"
              className="mt-1"
              disabled={sending}
            />
          </div>

          <div>
            <Label htmlFor="child" className="text-gray-700 text-sm">Имя ребёнка</Label>
            <Input
              id="child"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Введите имя ребёнка"
              className="mt-1"
              disabled={sending}
            />
          </div>

          <div>
            <Label htmlFor="age" className="text-gray-700 text-sm">Возраст ребёнка</Label>
            <Input
              id="age"
              type="number"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              placeholder="Введите возраст"
              className="mt-1"
              disabled={sending}
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-gray-700 text-sm">Телефон</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (___) ___-__-__"
              className="mt-1"
              disabled={sending}
            />
          </div>

          {statusText && (
            <p className="text-sm text-blue-600 text-center animate-pulse">{statusText}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSendClick}
              disabled={sending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sending ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" size={18} className="mr-2" />
                  Отправить в Telegram
                </>
              )}
            </Button>

            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={sending}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}