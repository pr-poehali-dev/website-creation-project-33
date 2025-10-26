import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { UserSchedule, DeleteSlotState } from './types';
import { isMaximKorelsky } from './utils';

interface AddPromoterModalProps {
  date: string;
  slotTime: string;
  slotLabel: string;
  schedules: UserSchedule[];
  addingSlot: DeleteSlotState | null;
  onAddSlot: (userId: number, date: string, slotTime: string) => Promise<void>;
  onClose: () => void;
}

export default function AddPromoterModal({
  date,
  slotTime,
  slotLabel,
  schedules,
  addingSlot,
  onAddSlot,
  onClose
}: AddPromoterModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const handleAdd = async () => {
    if (selectedUserId) {
      await onAddSlot(selectedUserId, date, slotTime);
      onClose();
    }
  };

  const availableUsers = schedules.filter(user => 
    !user.schedule[date]?.[slotTime]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Добавить промоутера</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <Icon name="X" size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Дата: {date}</p>
            <p className="text-sm text-gray-600 mb-3">Время: {slotLabel}</p>
          </div>

          <Select
            value={selectedUserId?.toString() || ''}
            onValueChange={(val) => setSelectedUserId(parseInt(val))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите промоутера" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map(user => {
                const isMaxim = isMaximKorelsky(user.first_name, user.last_name);
                return (
                  <SelectItem key={user.user_id} value={user.user_id.toString()}>
                    {user.first_name} {user.last_name}{isMaxim && ' 👑'}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={!selectedUserId || (addingSlot?.date === date && addingSlot?.slot === slotTime)}
              className="flex-1"
            >
              {addingSlot?.date === date && addingSlot?.slot === slotTime ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                  Добавление...
                </>
              ) : (
                'Добавить'
              )}
            </Button>
            <Button onClick={onClose} variant="outline">
              Отмена
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
