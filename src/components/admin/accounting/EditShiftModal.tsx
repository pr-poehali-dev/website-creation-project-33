import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ShiftRecord, User, Organization } from './types';

interface EditShiftModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (updatedShift: Partial<ShiftRecord>) => void;
  shift: ShiftRecord | null;
  users: User[];
  organizations: Organization[];
}

export default function EditShiftModal({
  show,
  onClose,
  onSave,
  shift,
  users,
  organizations
}: EditShiftModalProps) {
  const [formData, setFormData] = useState<Partial<ShiftRecord>>(shift || {});

  React.useEffect(() => {
    if (shift) {
      setFormData(shift);
    }
  }, [shift]);

  if (!show || !shift) return null;

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Редактировать смену</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Пользователь</label>
              <select
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Организация</label>
              <select
                value={formData.organization_id}
                onChange={(e) => setFormData({ ...formData, organization_id: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Дата</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Начало смены</label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Конец смены</label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Количество контактов</label>
              <Input
                type="number"
                value={formData.contacts_count}
                onChange={(e) => setFormData({ ...formData, contacts_count: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ставка за контакт (₽)</label>
              <Input
                type="number"
                value={formData.contact_rate}
                onChange={(e) => setFormData({ ...formData, contact_rate: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Тип оплаты</label>
            <select
              value={formData.payment_type}
              onChange={(e) => setFormData({ ...formData, payment_type: e.target.value as 'cash' | 'cashless' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="cash">💵 Наличные</option>
              <option value="cashless">💳 Безналичные</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Сумма расхода (₽)</label>
              <Input
                type="number"
                value={formData.expense_amount}
                onChange={(e) => setFormData({ ...formData, expense_amount: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Комментарий к расходу</label>
              <Input
                type="text"
                value={formData.expense_comment}
                onChange={(e) => setFormData({ ...formData, expense_comment: e.target.value })}
                placeholder="Комментарий"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold mb-3">Статусы оплат</h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paid_by_organization}
                  onChange={(e) => setFormData({ ...formData, paid_by_organization: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Оплачено организацией</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paid_to_worker}
                  onChange={(e) => setFormData({ ...formData, paid_to_worker: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Оплачено исполнителю</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paid_kvv}
                  onChange={(e) => setFormData({ ...formData, paid_kvv: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Оплачено КВВ</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paid_kms}
                  onChange={(e) => setFormData({ ...formData, paid_kms: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Оплачено КМС</span>
              </label>
            </div>
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
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
