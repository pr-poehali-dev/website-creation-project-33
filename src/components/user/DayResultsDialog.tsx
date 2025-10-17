import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface DayResultsDialogProps {
  open: boolean;
  contactsCount: number;
  onClose: () => void;
}

export default function DayResultsDialog({ open, contactsCount, onClose }: DayResultsDialogProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (open) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [open, onClose]);

  const getMessage = () => {
    if (contactsCount < 10) {
      return {
        text: 'Ты можешь лучше!',
        icon: 'ThumbsUp',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        emoji: '💪'
      };
    }
    if (contactsCount <= 15) {
      return {
        text: 'Ты молодец!',
        icon: 'Award',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        emoji: '🎯'
      };
    }
    return {
      text: 'Ты чемпион!',
      icon: 'Trophy',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      emoji: '🏆'
    };
  };

  const result = getMessage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className={`w-24 h-24 rounded-full ${result.bgColor} flex items-center justify-center`}>
            <Icon name={result.icon as any} size={48} className={result.color} />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#001f54]">
              {result.emoji} {result.text}
            </h2>
            <p className="text-gray-600">
              Результаты за сегодня
            </p>
          </div>

          <div className={`${result.bgColor} rounded-2xl p-6 w-full`}>
            <div className="flex items-center justify-center gap-3">
              <Icon name="Users" size={32} className={result.color} />
              <div className="text-left">
                <div className={`text-5xl font-bold ${result.color}`}>
                  {contactsCount}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {contactsCount === 1 ? 'контакт' : contactsCount < 5 ? 'контакта' : 'контактов'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Icon name="Clock" size={16} />
            <span>Переход через {countdown} сек</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
