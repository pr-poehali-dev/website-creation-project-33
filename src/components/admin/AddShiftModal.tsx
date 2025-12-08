import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useOrganizations } from '@/hooks/useAdminData';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: Array<{ name: string; id: number }>;
  onShiftAdded?: () => void;
}

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

export default function AddShiftModal({
  isOpen,
  onClose,
  userStats,
  onShiftAdded
}: AddShiftModalProps) {
  const { data: organizations = [] } = useOrganizations(isOpen);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [shiftDate, setShiftDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('12:00-16:00');
  const [adding, setAdding] = useState(false);

  const getSessionToken = () => localStorage.getItem('session_token');

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedOrgId || !shiftDate || !timeSlot) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'add_schedule_slot',
          user_id: selectedUserId,
          organization_id: selectedOrgId,
          work_date: shiftDate,
          time_slot: timeSlot,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Смена добавлена',
        });
        resetForm();
        onShiftAdded?.();
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось добавить смену',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding shift:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить смену',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setSelectedUserId(null);
    setSelectedOrgId(null);
    setShiftDate('');
    setTimeSlot('12:00-16:00');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <Icon name="CalendarPlus" size={20} className="text-cyan-400" />
            Добавить смену
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Промоутер</label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full border-2 border-slate-700 bg-slate-800 text-slate-100 rounded-md px-3 py-2 text-sm focus:border-cyan-600 focus:ring-cyan-600"
            >
              <option value="">Выберите промоутера</option>
              {userStats.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">Организация</label>
            <select
              value={selectedOrgId || ''}
              onChange={(e) => setSelectedOrgId(Number(e.target.value))}
              className="w-full border-2 border-slate-700 bg-slate-800 text-slate-100 rounded-md px-3 py-2 text-sm focus:border-cyan-600 focus:ring-cyan-600"
            >
              <option value="">Выберите организацию</option>
              {organizations.map((org: any) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">Дата смены</label>
            <Input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="border-2 border-slate-700 bg-slate-800 text-slate-100 focus:border-cyan-600 focus:ring-cyan-600"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">Время смены</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full border-2 border-slate-700 bg-slate-800 text-slate-100 rounded-md px-3 py-2 text-sm focus:border-cyan-600 focus:ring-cyan-600"
            >
              <option value="12:00-16:00">12:00-16:00</option>
              <option value="16:00-20:00">16:00-20:00</option>
              <option value="09:00-12:00">09:00-12:00</option>
              <option value="09:00-13:00">09:00-13:00</option>
              <option value="13:00-17:00">13:00-17:00</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={adding}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {adding ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить
                </>
              )}
            </Button>
            <Button
              onClick={handleClose}
              disabled={adding}
              variant="outline"
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}