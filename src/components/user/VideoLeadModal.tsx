import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';


interface VideoLeadModalProps {
  open: boolean;
  onClose: () => void;
  videoBlob: Blob | null;
  mimeType?: string;
  isRecording?: boolean;
  onStopRecording?: () => Promise<Blob>;
}

export default function VideoLeadModal({ open, onClose, videoBlob, mimeType = 'video/webm', isRecording = false, onStopRecording }: VideoLeadModalProps) {
  const { user } = useAuth();
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [savingToStorage, setSavingToStorage] = useState(false);
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
    const TELEGRAM_TOKEN = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc';
    const CHAT_ID = '5215501225';

    const caption = `🎥 Новый видео-лид\n\n👤 Родитель: ${parentName}\n👶 Ребёнок: ${childName}\n🎂 Возраст: ${childAge}\n📱 Телефон: ${phone}${user?.id ? `\n\n🆔 Сотрудник ID: ${user.id}` : ''}`;

    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const filename = `lead.${ext}`;

    // Шаг 1: отправляем видео напрямую в Telegram через FormData (без base64)
    setStatusText(`Отправляю видео (${(blob.size / 1024 / 1024).toFixed(1)} МБ)...`);
    const form = new FormData();
    form.append('chat_id', CHAT_ID);
    form.append('caption', caption);
    form.append('video', blob, filename);

    let tgResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`, {
      method: 'POST',
      body: form,
    });

    // Fallback: sendDocument если sendVideo не принял
    if (!tgResp.ok) {
      const form2 = new FormData();
      form2.append('chat_id', CHAT_ID);
      form2.append('caption', caption);
      form2.append('document', blob, filename);
      tgResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
        method: 'POST',
        body: form2,
      });
    }

    if (tgResp.ok) {
      toast({ title: 'Лид отправлен в Telegram!' });
      resetForm();
      onClose();
    } else {
      const err = await tgResp.text();
      console.error('Telegram error:', err);
      throw new Error('Ошибка отправки в Telegram');
    }
    setSending(false);
    setStatusText('');
  };

  const handleStorageClick = async () => {
    if (!parentName || !childName || !childAge || !phone) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    setSavingToStorage(true);
    setStatusText('Останавливаю запись...');
    try {
      let finalBlob = videoBlob;
      if (isRecording && onStopRecording) {
        finalBlob = await onStopRecording();
      }
      if (!finalBlob || finalBlob.size === 0) {
        toast({ title: 'Нет видео для сохранения', variant: 'destructive' });
        setSavingToStorage(false);
        setStatusText('');
        return;
      }

      const UPLOAD_URL = 'https://functions.poehali.dev/80ebc7f0-e4d8-4018-b8a8-477db92ac225';
      const CHUNK_SIZE = 1 * 1024 * 1024; // 1 МБ на чанк
      const upload_id = crypto.randomUUID();
      const totalSize = finalBlob.size;
      const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

      // Загружаем видео чанками по 1 МБ через base64
      let video_key = '';
      let meta_key = '';

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalSize);
        const chunkBlob = finalBlob.slice(start, end);

        setStatusText(`Загружаю ${i + 1}/${totalChunks} (${(totalSize / 1024 / 1024).toFixed(1)} МБ)...`);

        const chunkBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const marker = ';base64,';
            const idx = result.indexOf(marker);
            resolve(idx !== -1 ? result.slice(idx + marker.length) : result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(chunkBlob);
        });

        const chunkResp = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': user?.id?.toString() || '' },
          body: JSON.stringify({
            chunk_data: chunkBase64,
            chunk_index: i,
            total_chunks: totalChunks,
            upload_id,
            mimeType,
          }),
        });
        if (!chunkResp.ok) throw new Error(`Ошибка чанка ${i}`);
        const chunkResult = await chunkResp.json();

        if (chunkResult.done) {
          video_key = chunkResult.video_key;
          meta_key = chunkResult.meta_key;
        }
      }

      // Сохраняем метаданные
      setStatusText('Сохраняю данные анкеты...');
      const metaResp = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user?.id?.toString() || '' },
        body: JSON.stringify({ save_meta: true, meta_key, video_key, mimeType, parentName, childName, childAge, phone }),
      });
      if (!metaResp.ok) throw new Error('Ошибка сохранения метаданных');

      toast({ title: 'Сохранено в хранилище!' });
      resetForm();
      onClose();
    } catch (e) {
      console.error('Storage error:', e);
      toast({ title: 'Не удалось сохранить в хранилище', variant: 'destructive' });
    } finally {
      setSavingToStorage(false);
      setStatusText('');
    }
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

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSendClick}
              disabled={sending || savingToStorage}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2"
            >
              {sending ? (
                <><Icon name="Loader2" size={16} className="mr-1 animate-spin" />Отправка...</>
              ) : (
                <><Icon name="Send" size={16} className="mr-1" />Telegram</>
              )}
            </Button>

            <Button
              onClick={handleStorageClick}
              disabled={sending || savingToStorage}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2"
            >
              {savingToStorage ? (
                <><Icon name="Loader2" size={16} className="mr-1 animate-spin" />Сохранение...</>
              ) : (
                <><Icon name="HardDrive" size={16} className="mr-1" />Хранилище</>
              )}
            </Button>

            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={sending || savingToStorage}
              className="flex-1 text-xs px-2"
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}