import React from 'react';
import { Input } from '@/components/ui/input';
import { User, Organization, NewShiftData } from './types';

interface AddShiftModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: () => void;
  newShift: NewShiftData;
  setNewShift: (shift: NewShiftData) => void;
  users: User[];
  organizations: Organization[];
}

export default function AddShiftModal({
  show,
  onClose,
  onAdd,
  newShift,
  setNewShift,
  users,
  organizations
}: AddShiftModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Добавить смену</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Пользователь</label>
            <select
              value={newShift.user_id}
              onChange={(e) => setNewShift({ ...newShift, user_id: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value={0}>Выберите пользователя</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Организация</label>
            <select
              value={newShift.organization_id}
              onChange={(e) => setNewShift({ ...newShift, organization_id: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value={0}>Выберите организацию</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Дата</label>
            <Input
              type="date"
              value={newShift.shift_date}
              onChange={(e) => setNewShift({ ...newShift, shift_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Начало</label>
              <Input
                type="time"
                value={newShift.start_time}
                onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Конец</label>
              <Input
                type="time"
                value={newShift.end_time}
                onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Количество контактов</label>
            <Input
              type="number"
              value={newShift.contacts_count}
              onChange={(e) => setNewShift({ ...newShift, contacts_count: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onAdd}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
