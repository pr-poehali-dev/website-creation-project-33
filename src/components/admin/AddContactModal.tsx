import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Organization {
  id: number;
  name: string;
}

interface AddContactModalProps {
  date: string;
  userName: string;
  organizations: Organization[];
  isSubmitting: boolean;
  onConfirm: (count: number, organizationId: number | null) => void;
  onClose: () => void;
}

export default function AddContactModal({
  date,
  userName,
  organizations,
  isSubmitting,
  onConfirm,
  onClose,
}: AddContactModalProps) {
  const [count, setCount] = useState(1);
  const [orgId, setOrgId] = useState<number | null>(null);

  const handleSubmit = () => {
    if (count < 1) return;
    onConfirm(count, orgId);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
      <Card className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg text-slate-100">Добавить контакты</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">{userName} · {date}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
              <Icon name="X" size={20} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
              Организация
            </label>
            <select
              value={orgId ?? ''}
              onChange={(e) => setOrgId(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-2.5 text-sm border-2 border-slate-600 bg-slate-800 text-slate-100 rounded-lg focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Не указана</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
              Количество контактов
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCount(c => Math.max(1, c - 1))}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 flex items-center justify-center text-lg font-bold transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={999}
                value={count}
                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 p-2.5 text-center text-lg font-bold border-2 border-slate-600 bg-slate-800 text-slate-100 rounded-lg focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={() => setCount(c => Math.min(999, c + 1))}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 flex items-center justify-center text-lg font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                <>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить {count} контакт{count === 1 ? '' : count < 5 ? 'а' : 'ов'}
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
              className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
            >
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
