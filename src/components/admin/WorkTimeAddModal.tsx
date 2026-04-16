import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface WorkTimeAddModalProps {
  users: User[];
  selectedUser: number | null;
  selectedDate: string;
  startTime: string;
  endTime: string;
  isSubmitting: boolean;
  onSelectUser: (id: number) => void;
  onSelectDate: (date: string) => void;
  onStartTime: (time: string) => void;
  onEndTime: (time: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function WorkTimeAddModal({
  users,
  selectedUser,
  selectedDate,
  startTime,
  endTime,
  isSubmitting,
  onSelectUser,
  onSelectDate,
  onStartTime,
  onEndTime,
  onSubmit,
  onClose,
}: WorkTimeAddModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <Card className="w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg text-slate-100">Добавить смену</CardTitle>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
              Промоутер
            </label>
            <select
              value={selectedUser || ''}
              onChange={(e) => onSelectUser(Number(e.target.value))}
              className="w-full p-2.5 sm:p-2 text-sm border-2 border-slate-600 bg-slate-800 text-slate-100 rounded-lg focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Выберите промоутера</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
              Дата
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="w-full p-2.5 sm:p-2 text-sm border-2 border-slate-600 bg-slate-800 text-slate-100 rounded-lg focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                Время открытия
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => onStartTime(e.target.value)}
                className="w-full p-2.5 sm:p-2 text-sm border-2 border-slate-600 bg-slate-800 text-slate-100 rounded-lg focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                Время закрытия
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => onEndTime(e.target.value)}
                className="w-full p-2.5 sm:p-2 text-sm border-2 border-slate-600 bg-slate-800 text-slate-100 rounded-lg focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || !selectedUser || !selectedDate || !startTime || !endTime}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm py-2.5 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                'Добавить'
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
              className="sm:flex-none text-sm py-2.5 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
            >
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
