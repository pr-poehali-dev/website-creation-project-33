import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface OrgConfirmationModalProps {
  selectedOrg: string;
  selectedRank: number;
  topThree: Array<{ name: string; avg: number; income: number }>;
  recentContactsAll: Array<{ date: string; contacts: number }>;
  recentContactsSelected: Array<{ date: string; contacts: number }>;
  recentContactsTop3: Record<string, Array<{ date: string; contacts: number }>>;
  onConfirm: () => void;
  onCancel: () => void;
}

type ChartMode = 'all' | 'selected' | 'top3';

export default function OrgConfirmationModal({
  selectedOrg,
  selectedRank,
  topThree,
  recentContactsAll,
  recentContactsSelected,
  recentContactsTop3,
  onConfirm,
  onCancel
}: OrgConfirmationModalProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('all');
  
  const getCurrentChartData = () => {
    if (chartMode === 'all') return recentContactsAll;
    if (chartMode === 'selected') return recentContactsSelected;
    return [];
  };
  
  const currentData = getCurrentChartData();
  const maxContacts = Math.max(...currentData.map(r => r.contacts), 1);
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-slate-900 border-2 border-amber-500/50 rounded-xl p-4 md:p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="AlertTriangle" size={24} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base md:text-lg font-bold text-slate-100 mb-1">
              Внимание: выбор вне ТОП-3
            </h3>
            <p className="text-xs md:text-sm text-slate-400">
              Выбранная организация не входит в рекомендованный список
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-slate-400">Ваш выбор:</span>
            <span className="text-xs md:text-sm font-semibold text-amber-400">
              #{selectedRank} в рейтинге
            </span>
          </div>
          <p className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
            <Icon name="Building2" size={16} className="text-amber-400" />
            {selectedOrg}
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4">
          <p className="text-xs md:text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <Icon name="TrendingUp" size={16} />
            Оптимальный выбор (ТОП-3):
          </p>
          <div className="space-y-2">
            {topThree.map((org, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-slate-300">
                  {idx + 1}. {org.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">{org.avg.toFixed(1)}</span>
                  <span className="text-emerald-400 font-semibold">~{org.income} ₽</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs md:text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Icon name="Activity" size={16} className="text-cyan-400" />
              Тренд контактов (последние 7 смен):
            </p>
          </div>
          
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setChartMode('all')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                chartMode === 'all'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setChartMode('selected')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                chartMode === 'selected'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Выбор
            </button>
            <button
              onClick={() => setChartMode('top3')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                chartMode === 'top3'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              ТОП-3
            </button>
          </div>
          
          {chartMode === 'top3' ? (
            <div className="space-y-3">
              {topThree.map((org) => {
                const orgData = recentContactsTop3[org.name] || [];
                const orgMaxContacts = Math.max(...orgData.map(r => r.contacts), 1);
                
                return (
                  <div key={org.name} className="border-t border-slate-700 pt-2">
                    <p className="text-[10px] text-slate-400 mb-2">{org.name}</p>
                    <div className="flex items-end justify-between gap-1 h-16">
                      {orgData.length === 0 ? (
                        <p className="text-[9px] text-slate-500 italic">Нет данных</p>
                      ) : (
                        orgData.map((shift, idx) => {
                          const height = (shift.contacts / orgMaxContacts) * 100;
                          const isGrowth = idx > 0 && shift.contacts > orgData[idx - 1].contacts;
                          const isDecline = idx > 0 && shift.contacts < orgData[idx - 1].contacts;
                          
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[8px] text-slate-400 font-semibold">{shift.contacts}</span>
                              <div 
                                className={`w-full rounded-t transition-all ${
                                  isGrowth ? 'bg-emerald-500' : 
                                  isDecline ? 'bg-red-500' : 
                                  'bg-cyan-500'
                                }`}
                                style={{ height: `${Math.max(height, 5)}%` }}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : currentData.length > 0 ? (
            <div className="flex items-end justify-between gap-1 h-24">
              {currentData.map((shift, idx) => {
                const height = (shift.contacts / maxContacts) * 100;
                const isGrowth = idx > 0 && shift.contacts > currentData[idx - 1].contacts;
                const isDecline = idx > 0 && shift.contacts < currentData[idx - 1].contacts;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-400 font-semibold">{shift.contacts}</span>
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isGrowth ? 'bg-emerald-500' : 
                        isDecline ? 'bg-red-500' : 
                        'bg-cyan-500'
                      }`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${new Date(shift.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}: ${shift.contacts} контактов`}
                    />
                    <span className="text-[9px] text-slate-500">
                      {new Date(shift.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-4">Нет данных по сменам</p>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-4">
          <p className="text-xs md:text-sm text-center text-slate-300 font-medium">
            Подтверждаете ли вы свой выбор данной организации<br />
            <span className="text-amber-400">(не входящей в ТОП-3)?</span>
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 border-2 border-slate-600 hover:border-slate-500"
          >
            <Icon name="X" size={16} className="mr-1" />
            Нет
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Icon name="Check" size={16} className="mr-1" />
            Да, выбрать
          </Button>
        </div>
      </div>
    </div>
  );
}

<style>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgb(30 41 59 / 0.5);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgb(71 85 105);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgb(100 116 139);
  }
`}</style>