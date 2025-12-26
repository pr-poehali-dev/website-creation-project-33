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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-slate-100">Редактировать смену</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Пользователь</label>
              <select
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: parseInt(e.target.value) })}
                className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-slate-200"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Организация</label>
              <select
                value={formData.organization_id}
                onChange={(e) => setFormData({ ...formData, organization_id: parseInt(e.target.value) })}
                className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-slate-200"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Дата</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="border-slate-600 bg-slate-800 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Начало смены</label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="border-slate-600 bg-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Конец смены</label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="border-slate-600 bg-slate-800 text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Количество контактов</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.contacts_count?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, contacts_count: parseInt(e.target.value) || 0 })}
                className="border-slate-600 bg-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Ставка за контакт (₽)</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.contact_rate?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, contact_rate: parseInt(e.target.value) || 0 })}
                className="border-slate-600 bg-slate-800 text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Тип оплаты</label>
            <select
              value={formData.payment_type}
              onChange={(e) => setFormData({ ...formData, payment_type: e.target.value as 'cash' | 'cashless' })}
              className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-slate-200"
            >
              <option value="cash">💵 Наличные</option>
              <option value="cashless">💳 Безналичные</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Сумма расхода (₽)</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.expense_amount?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, expense_amount: parseInt(e.target.value) || 0 })}
                className="border-slate-600 bg-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Комментарий к расходу</label>
              <Input
                type="text"
                value={formData.expense_comment}
                onChange={(e) => setFormData({ ...formData, expense_comment: e.target.value })}
                placeholder="Комментарий"
                className="border-slate-600 bg-slate-800 text-slate-200 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4 mt-4">
            <h4 className="text-sm font-semibold mb-3 text-slate-200">Статусы оплат</h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paid_by_organization}
                  onChange={(e) => setFormData({ ...formData, paid_by_organization: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 accent-emerald-500"
                />
                <span className="text-sm text-slate-300">Оплачено организацией</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paid_to_worker}
                  onChange={(e) => setFormData({ ...formData, paid_to_worker: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 accent-emerald-500"
                />
                <span className="text-sm text-slate-300">Оплачено исполнителю</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paid_kvv}
                  onChange={(e) => setFormData({ ...formData, paid_kvv: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 accent-emerald-500"
                />
                <span className="text-sm text-slate-300">Оплачено КВВ</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paid_kms}
                  onChange={(e) => setFormData({ ...formData, paid_kms: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 accent-emerald-500"
                />
                <span className="text-sm text-slate-300">Оплачено КМС</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}