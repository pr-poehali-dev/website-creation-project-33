import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface VideoLeadModalProps {
  open: boolean;
  onClose: () => void;
  videoBlob: Blob | null;
}

export default function VideoLeadModal({ open, onClose, videoBlob }: VideoLeadModalProps) {
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!parentName || !childName || !childAge || !videoBlob) {
      alert('Заполните все поля');
      return;
    }

    setSending(true);
    try {
      // Конвертируем Blob в base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Убираем "data:video/mp4;base64,"
        };
        reader.onerror = reject;
        reader.readAsDataURL(videoBlob);
      });

      const videoBase64 = await base64Promise;

      const response = await fetch('https://functions.poehali.dev/video-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video: videoBase64,
          parentName,
          childName,
          childAge,
        }),
      });

      if (response.ok) {
        alert('✅ Лид успешно отправлен в Telegram!');
        setParentName('');
        setChildName('');
        setChildAge('');
        onClose();
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch (error) {
      console.error('Ошибка отправки лида:', error);
      alert('❌ Не удалось отправить лид. Попробуйте еще раз.');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    setParentName('');
    setChildName('');
    setChildAge('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Новый лид</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <img
            src="https://cdn.poehali.dev/files/460db08f-157a-4530-859d-b667980d60a1.png"
            alt="QR Code"
            className="w-48 h-48 object-contain"
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="parent" className="text-gray-700">Имя родителя</Label>
            <Input
              id="parent"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Введите имя родителя"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="child" className="text-gray-700">Имя ребенка</Label>
            <Input
              id="child"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Введите имя ребенка"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="age" className="text-gray-700">Возраст ребенка</Label>
            <Input
              id="age"
              type="number"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              placeholder="Введите возраст"
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sending ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" size={20} className="mr-2" />
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