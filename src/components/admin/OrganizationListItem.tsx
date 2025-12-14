import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Organization {
  id: number;
  name: string;
  created_at: string;
  lead_count: number;
  contact_rate: number;
  payment_type: 'cash' | 'cashless';
}

interface OrganizationListItemProps {
  org: Organization;
  editingId: number | null;
  editingName: string;
  editingRate: string;
  editingPaymentType: 'cash' | 'cashless';
  updating: boolean;
  startEditing: (org: Organization) => void;
  cancelEditing: () => void;
  updateOrganization: (id: number) => void;
  deleteOrganization: (id: number, name: string) => void;
  setEditingName: (name: string) => void;
  setEditingRate: (rate: string) => void;
  setEditingPaymentType: (type: 'cash' | 'cashless') => void;
  onOpenPeriods: (org: { id: number; name: string }) => void;
}

export default function OrganizationListItem({
  org,
  editingId,
  editingName,
  editingRate,
  editingPaymentType,
  updating,
  startEditing,
  cancelEditing,
  updateOrganization,
  deleteOrganization,
  setEditingName,
  setEditingRate,
  setEditingPaymentType,
  onOpenPeriods
}: OrganizationListItemProps) {
  const isEditing = editingId === org.id;

  return (
    <div className="group p-3 md:p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all duration-200 border border-slate-700 hover:border-slate-600">
      {isEditing ? (
        <div className="space-y-2.5 md:space-y-3">
          <div>
            <label className="text-[10px] md:text-xs text-slate-400 mb-1 block">Название</label>
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="border-slate-700 bg-slate-900 text-slate-100 focus:border-slate-600 focus:ring-slate-600 h-8 md:h-9 text-xs md:text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] md:text-xs text-slate-400 mb-1 block">Ставка за контакт (₽)</label>
            <Input
              type="number"
              value={editingRate}
              onChange={(e) => setEditingRate(e.target.value)}
              className="border-slate-700 bg-slate-900 text-slate-100 focus:border-slate-600 focus:ring-slate-600 h-8 md:h-9 text-xs md:text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] md:text-xs text-slate-400 mb-1.5 md:mb-2 block">Тип оплаты</label>
            <div className="flex gap-1.5 md:gap-2">
              <Button
                onClick={() => setEditingPaymentType('cash')}
                variant={editingPaymentType === 'cash' ? 'default' : 'outline'}
                size="sm"
                className={`flex-1 h-8 md:h-9 text-[10px] md:text-xs ${
                  editingPaymentType === 'cash'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Icon name="Banknote" size={12} className="mr-1 md:mr-1.5 md:w-[14px] md:h-[14px]" />
                <span className="hidden xs:inline">Наличные</span>
                <span className="xs:hidden">Нал</span>
              </Button>
              <Button
                onClick={() => setEditingPaymentType('cashless')}
                variant={editingPaymentType === 'cashless' ? 'default' : 'outline'}
                size="sm"
                className={`flex-1 h-8 md:h-9 text-[10px] md:text-xs ${
                  editingPaymentType === 'cashless'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Icon name="CreditCard" size={12} className="mr-1 md:mr-1.5 md:w-[14px] md:h-[14px]" />
                Безнал
              </Button>
            </div>
          </div>
          <div className="flex gap-1.5 md:gap-2 pt-1 md:pt-2">
            <Button
              onClick={() => updateOrganization(org.id)}
              disabled={!editingName.trim() || updating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 md:h-9 text-[10px] md:text-xs"
            >
              {updating ? (
                <Icon name="Loader2" size={12} className="animate-spin md:w-[14px] md:h-[14px]" />
              ) : (
                <>
                  <Icon name="Check" size={12} className="mr-1 md:mr-1.5 md:w-[14px] md:h-[14px]" />
                  <span className="hidden xs:inline">Сохранить</span>
                  <span className="xs:hidden">Сохр.</span>
                </>
              )}
            </Button>
            <Button
              onClick={cancelEditing}
              disabled={updating}
              variant="outline"
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 h-8 md:h-9 text-[10px] md:text-xs"
            >
              <Icon name="X" size={12} className="mr-1 md:mr-1.5 md:w-[14px] md:h-[14px]" />
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 md:gap-3 mb-2.5 md:mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-100 mb-1.5 text-xs md:text-base leading-tight">
                {org.name}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                  <Icon name="Users" size={10} className="mr-0.5 md:mr-1 md:w-3 md:h-3" />
                  {org.lead_count}
                </Badge>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                  <Icon name="DollarSign" size={10} className="mr-0.5 md:mr-1 md:w-3 md:h-3" />
                  {org.contact_rate || 0}₽
                </Badge>
                <Badge
                  className={
                    org.payment_type === 'cashless'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5'
                      : 'bg-green-500/20 text-green-400 border-green-500/30 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5'
                  }
                >
                  <Icon
                    name={org.payment_type === 'cashless' ? 'CreditCard' : 'Banknote'}
                    size={10}
                    className="mr-0.5 md:mr-1 md:w-3 md:h-3"
                  />
                  <span className="hidden xs:inline">{org.payment_type === 'cashless' ? 'Безнал' : 'Нал'}</span>
                  <span className="xs:hidden">{org.payment_type === 'cashless' ? 'Б' : 'Н'}</span>
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col xs:flex-row gap-1.5 md:gap-2">
            <div className="flex gap-1.5 md:gap-2 flex-1">
              <Button
                onClick={() => onOpenPeriods({ id: org.id, name: org.name })}
                variant="outline"
                size="sm"
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 transition-all duration-200 h-7 md:h-9 text-[10px] md:text-sm"
              >
                <Icon name="Calendar" size={10} className="mr-1 md:mr-1.5 md:w-[14px] md:h-[14px]" />
                <span className="hidden sm:inline">История ставок</span>
                <span className="sm:hidden">Ставки</span>
              </Button>
              <Button
                onClick={() => startEditing(org)}
                variant="outline"
                size="sm"
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 transition-all duration-200 h-7 md:h-9 text-[10px] md:text-sm"
              >
                <Icon name="Pencil" size={10} className="mr-1 md:mr-1.5 md:w-[14px] md:h-[14px]" />
                <span className="hidden sm:inline">Изменить</span>
                <span className="sm:hidden">Ред.</span>
              </Button>
            </div>
            <Button
              onClick={() => deleteOrganization(org.id, org.name)}
              variant="outline"
              size="sm"
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 hover:border-red-500/50 transition-all duration-200 h-7 md:h-9 px-2 md:px-4 xs:w-auto w-full"
            >
              <Icon name="Trash2" size={10} className="md:w-[14px] md:h-[14px] xs:mr-0 mr-1.5" />
              <span className="xs:hidden">Удалить</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}