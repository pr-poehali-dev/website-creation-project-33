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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Icon name="DollarSign" size={24} className="text-yellow-600" />
            Доход промоутера: {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {orgRevenues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Info" size={32} className="mx-auto mb-2 opacity-50" />
              <div className="text-sm">Нет данных по доходу</div>
            </div>
          ) : (
            <>
              {orgRevenues.map((org, index) => (
                <div 
                  key={index}
                  className="border-2 border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-base mb-1">
                        {org.organization_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        Контактов: {org.contacts} × Ставка: {org.rate}₽
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-600">
                        {org.revenue_after_tax.toFixed(2)}₽
                      </div>
                      <div className="text-xs text-gray-500">после налога</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3 border-gray-100">
                    <div className="text-center">
                      <div className="text-gray-500 mb-1">До налога</div>
                      <div className="font-semibold text-gray-700">
                        {org.revenue_before_tax.toFixed(2)}₽
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 mb-1">Налог 7%</div>
                      <div className="font-semibold text-red-600">
                        -{org.tax.toFixed(2)}₽
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 mb-1">На руки</div>
                      <div className="font-semibold text-green-600">
                        {org.revenue_after_tax.toFixed(2)}₽
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t-2 border-gray-300 pt-4 mt-6">
                <div className="flex items-center justify-between bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Icon name="Wallet" size={24} className="text-yellow-600" />
                    <span className="font-bold text-gray-900 text-lg">
                      Итого доход:
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
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
