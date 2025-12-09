import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface DayResultsDialogProps {
  open: boolean;
  contactsCount: number;
  onClose: () => void;
}

export default function DayResultsDialog({ open, contactsCount, onClose }: DayResultsDialogProps) {
  const [countdown, setCountdown] = useState(5);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) {
      console.log('⏱️ DayResultsDialog opened, starting 5 sec countdown');
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            console.log('✅ Countdown finished, calling onClose');
            clearInterval(interval);
            onCloseRef.current();
            return 0;
          }
          console.log(`⏱️ Countdown: ${prev - 1} seconds`);
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [open]);

  const getMessage = () => {
    if (contactsCount < 15) {
      return {
        text: 'Ты можешь лучше!',
        icon: 'ThumbsUp',
        emoji: '💪'
      };
    }
    if (contactsCount < 25) {
      return {
        text: 'Ты молодец!',
        icon: 'Award',
        emoji: '🎯'
      };
    }
    return {
      text: 'Ты чемпион!',
      icon: 'Trophy',
      emoji: '🏆'
    };
  };

  const result = getMessage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md !border-0 shadow-2xl rounded-2xl bg-white mx-4">
        <div className="flex flex-col items-center gap-6 text-center py-4">
          {/* Иконка с анимацией */}
          <div className="relative">
            <div className="w-20 h-20 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg animate-bounce">
              <Icon name={result.icon as any} size={40} className="text-white" />
            </div>
            {/* Волнистые линии вокруг иконки */}
            <div className="absolute -top-2 -left-2 w-24 h-24 border-2 border-blue-300 rounded-xl animate-ping opacity-20"></div>
          </div>

          {/* Заголовок */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#001f54]">
              {result.emoji} {result.text}
            </h2>
            <p className="text-gray-500 text-sm">
              Результаты за сегодня
            </p>
          </div>

          {/* Счетчик контактов */}
          <div className="bg-blue-50 rounded-xl p-6 w-full border-2 border-blue-200">
            <div className="flex items-center justify-center gap-4">
              <div className="p-2 rounded-lg bg-blue-500">
                <Icon name="Users" size={28} className="text-white" />
              </div>
              <div className="text-left">
                <div className="text-5xl font-bold text-blue-600 animate-pulse">
                  {contactsCount}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {contactsCount === 1 ? 'контакт' : contactsCount < 5 ? 'контакта' : 'контактов'}
                </div>
              </div>
            </div>
          </div>

          {/* Таймер */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Icon name="Clock" size={16} />
            <span>Переход через {countdown} сек</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}