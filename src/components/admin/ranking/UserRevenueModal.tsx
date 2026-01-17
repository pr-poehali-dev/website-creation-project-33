import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

export interface OrgRevenue {
  organization_name: string;
  contacts: number;
  shifts: number;
  rate: number;
  payment_type: string;
  revenue_before_tax: number;
  tax: number;
  revenue_after_tax: number;
}

interface UserRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  orgRevenues: OrgRevenue[];
  totalRevenue: number;
}

export default function UserRevenueModal({
  isOpen,
  onClose,
  userName,
  orgRevenues,
  totalRevenue
}: UserRevenueModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-2 border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-100">
            <Icon name="Wallet" size={24} className="text-cyan-400" />
            Зарплата промоутера: {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {orgRevenues.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Icon name="Info" size={32} className="mx-auto mb-2 opacity-50 text-slate-500" />
              <div className="text-sm">Нет данных по зарплате</div>
            </div>
          ) : (
            <>
              {orgRevenues.map((org, index) => (
                <div 
                  key={index}
                  className="border-2 border-slate-700 rounded-xl p-4 bg-slate-800/50 hover:bg-slate-800 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-slate-100 text-base">
                          {org.organization_name}
                        </div>
                        <div className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          💰 Зарплата
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>Контактов: {org.contacts} за {org.shifts} {org.shifts === 1 ? 'смену' : org.shifts < 5 ? 'смены' : 'смен'}</div>
                        <div>Средняя ставка: {org.rate}₽ за контакт</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-cyan-400">
                        {org.revenue_after_tax.toFixed(0)}₽
                      </div>
                      <div className="text-xs text-slate-400">
                        зарплата
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3 border-slate-700">
                    <div className="text-center">
                      <div className="text-slate-400 mb-1">Смены</div>
                      <div className="font-semibold text-slate-300">
                        {org.shifts}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 mb-1">Контакты</div>
                      <div className="font-semibold text-blue-400">
                        {org.contacts}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 mb-1">Ср./смена</div>
                      <div className="font-semibold text-green-400">
                        {org.shifts > 0 ? Math.round(org.contacts / org.shifts) : 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t-2 border-slate-700 pt-4 mt-6">
                <div className="flex items-center justify-between bg-cyan-500/10 rounded-xl p-4 border-2 border-cyan-500/30">
                  <div className="flex items-center gap-2">
                    <Icon name="Wallet" size={24} className="text-cyan-400" />
                    <span className="font-bold text-slate-100 text-lg">
                      Итого зарплата:
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {totalRevenue.toFixed(0)}₽
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}