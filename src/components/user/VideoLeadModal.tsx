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
  isRecording?: boolean;
  onStopRecording?: () => void;
}

export default function VideoLeadModal({ open, onClose, videoBlob, isRecording = false, onStopRecording }: VideoLeadModalProps) {
  const { user } = useAuth();
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendClick = async () => {
    if (isRecording && onStopRecording) {
      onStopRecording();
      return;
    }
    await sendLead();
  };

  const sendLead = async () => {
    if (!parentName || !childName || !childAge || !phone) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    if (!videoBlob) {
      toast({ title: 'Нет видео для отправки', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const reader = new FileReader();
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(videoBlob);
      });

      const response = await fetch('https://functions.poehali.dev/3698e100-6084-4fbd-aaca-c2be1dc6e458', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || '',
        },
        body: JSON.stringify({ video: videoBase64, parentName, childName, childAge, phone }),
      });

      if (response.ok) {
        toast({ title: 'Лид отправлен в Telegram!' });
        resetForm();
        onClose();
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch {
      toast({ title: 'Не удалось отправить лид', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setParentName('');
    setChildName('');
    setChildAge('');
    setPhone('');
  };

  const handleCancel = () => {
    if (isRecording && onStopRecording) onStopRecording();
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
            />
          </div>

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
              ) : isRecording ? (
                <>
                  <Icon name="Send" size={18} className="mr-2" />
                  Отправить в Telegram
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