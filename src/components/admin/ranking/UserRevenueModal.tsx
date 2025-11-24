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
            <Icon name="DollarSign" size={24} className="text-cyan-400" />
            Доход промоутера: {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {orgRevenues.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Icon name="Info" size={32} className="mx-auto mb-2 opacity-50 text-slate-500" />
              <div className="text-sm">Нет данных по доходу</div>
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
                        <div className={`text-xs px-2 py-0.5 rounded-full ${
                          org.payment_type === 'cash' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {org.payment_type === 'cash' ? '💵 Наличка' : '💳 Безнал'}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        Контактов: {org.contacts} × Ставка: {org.rate}₽
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-cyan-400">
                        {org.revenue_after_tax.toFixed(2)}₽
                      </div>
                      <div className="text-xs text-slate-400">
                        {org.payment_type === 'cash' ? 'на руки' : 'после налога'}
                      </div>
                    </div>
                  </div>

                  {org.payment_type === 'cashless' && (
                    <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3 border-slate-700">
                      <div className="text-center">
                        <div className="text-slate-400 mb-1">До налога</div>
                        <div className="font-semibold text-slate-300">
                          {org.revenue_before_tax.toFixed(2)}₽
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400 mb-1">Налог 7%</div>
                        <div className="font-semibold text-red-400">
                          -{org.tax.toFixed(2)}₽
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400 mb-1">На руки</div>
                        <div className="font-semibold text-green-400">
                          {org.revenue_after_tax.toFixed(2)}₽
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t-2 border-slate-700 pt-4 mt-6">
                <div className="flex items-center justify-between bg-cyan-500/10 rounded-xl p-4 border-2 border-cyan-500/30">
                  <div className="flex items-center gap-2">
                    <Icon name="Wallet" size={24} className="text-cyan-400" />
                    <span className="font-bold text-slate-100 text-lg">
                      Итого доход:
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {totalRevenue.toFixed(2)}₽
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