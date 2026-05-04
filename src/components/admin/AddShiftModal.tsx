import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/lib/toast';
interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: Array<{ name: string; id: number }>;
  onShiftAdded?: () => void;
}

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

const selectClass = "w-full border border-gray-200 bg-white text-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors";
const labelClass = "text-xs font-medium text-gray-500 mb-1.5 block";

export default function AddShiftModal({ isOpen, onClose, userStats, onShiftAdded }: AddShiftModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [shiftDate, setShiftDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('12:00-16:00');
  const [adding, setAdding] = useState(false);

  const handleSubmit = async () => {
    if (!selectedUserId || !shiftDate || !timeSlot) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    setAdding(true);
    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
        body: JSON.stringify({
          action: 'add_schedule_slot',
          user_id: selectedUserId,
          work_date: shiftDate,
          time_slot: timeSlot,
        }),
      });
      if (response.ok) {
        toast({ title: 'Успешно', description: 'Смена добавлена' });
        resetForm();
        onShiftAdded?.();
        onClose();
      } else {
        const error = await response.json();
        toast({ title: 'Ошибка', description: error.error || 'Не удалось добавить смену', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось добавить смену', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setSelectedUserId(null);
    setShiftDate('');
    setTimeSlot('12:00-16:00');
  };

  const handleClose = () => { resetForm(); onClose(); };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-gray-200 text-gray-800 max-w-md rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Icon name="CalendarPlus" size={16} className="text-blue-500" />
            </div>
            Добавить смену
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className={labelClass}>Промоутер</label>
            <select value={selectedUserId || ''} onChange={e => setSelectedUserId(Number(e.target.value))} className={selectClass}>
              <option value="">Выберите промоутера</option>
              {userStats.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Дата смены</label>
            <input
              type="date"
              value={shiftDate}
              onChange={e => setShiftDate(e.target.value)}
              className={selectClass}
            />
          </div>

          <div>
            <label className={labelClass}>Время смены</label>
            <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className={selectClass}>
              {['12:00-16:00', '16:00-20:00', '09:00-12:00', '09:00-13:00', '13:00-17:00'].map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={adding}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {adding
                ? <Icon name="Loader2" size={16} className="animate-spin" />
                : <><Icon name="Plus" size={16} />Добавить</>
              }
            </button>
            <button
              onClick={handleClose}
              disabled={adding}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}