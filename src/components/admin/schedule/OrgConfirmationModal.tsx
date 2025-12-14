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
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setChartMode('selected')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                chartMode === 'selected'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Выбор
            </button>
            <button
              onClick={() => setChartMode('top3')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                chartMode === 'top3'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              ТОП-3
            </button>
          </div>
          
          {chartMode === 'top3' ? (
            <div className="space-y-4">
              {topThree.map((org) => {
                const orgData = recentContactsTop3[org.name] || [];
                const orgMaxContacts = Math.max(...orgData.map(r => r.contacts), 1);
                
                return (
                  <div key={org.name} className="border-t border-slate-700 pt-3 first:border-t-0 first:pt-0">
                    <p className="text-[10px] text-slate-400 mb-2 font-medium">{org.name}</p>
                    {orgData.length === 0 ? (
                      <p className="text-[9px] text-slate-500 italic text-center py-4">Нет данных</p>
                    ) : (
                      <div className="relative bg-slate-900/50 rounded-lg p-3">
                        <svg 
                          className="w-full" 
                          viewBox="0 0 400 100" 
                          preserveAspectRatio="none"
                          style={{ height: '100px' }}
                        >
                          <defs>
                            <linearGradient id={`gradient-${org.name.replace(/[\s()]/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          
                          {/* Заливка под графиком */}
                          <polygon
                            fill={`url(#gradient-${org.name.replace(/[\s()]/g, '-')})`}
                            points={`
                              0,90
                              ${orgData.map((shift, idx) => {
                                const x = (idx / Math.max(orgData.length - 1, 1)) * 400;
                                const y = 90 - ((shift.contacts / orgMaxContacts) * 80);
                                return `${x},${y}`;
                              }).join(' ')}
                              400,90
                            `}
                          />
                          
                          {/* Линия графика */}
                          <polyline
                            fill="none"
                            stroke="rgb(34, 211, 238)"
                            strokeWidth="2.5"
                            points={orgData.map((shift, idx) => {
                              const x = (idx / Math.max(orgData.length - 1, 1)) * 400;
                              const y = 90 - ((shift.contacts / orgMaxContacts) * 80);
                              return `${x},${y}`;
                            }).join(' ')}
                          />
                          
                          {/* Точки на графике */}
                          {orgData.map((shift, idx) => {
                            const x = (idx / Math.max(orgData.length - 1, 1)) * 400;
                            const y = 90 - ((shift.contacts / orgMaxContacts) * 80);
                            const isGrowth = idx > 0 && shift.contacts > orgData[idx - 1].contacts;
                            const isDecline = idx > 0 && shift.contacts < orgData[idx - 1].contacts;
                            const dotColor = isGrowth ? 'rgb(16, 185, 129)' : isDecline ? 'rgb(239, 68, 68)' : 'rgb(34, 211, 238)';
                            
                            return (
                              <circle
                                key={idx}
                                cx={x}
                                cy={y}
                                r="4"
                                fill={dotColor}
                                stroke="white"
                                strokeWidth="2"
                              />
                            );
                          })}
                        </svg>
                        
                        {/* Подписи дат и значений */}
                        <div className="flex justify-between mt-2">
                          {orgData.map((shift, idx) => (
                            <div key={idx} className="flex flex-col items-center" style={{ width: `${100 / orgData.length}%` }}>
                              <span className="text-[10px] text-cyan-400 font-bold">{shift.contacts}</span>
                              <span className="text-[9px] text-slate-500">
                                {new Date(shift.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : currentData.length > 0 ? (
            <div className="relative h-40 bg-slate-900/50 rounded-lg p-3">
              <svg 
                className="w-full h-full" 
                viewBox="0 0 400 120" 
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Линия графика */}
                <polyline
                  fill="none"
                  stroke="rgb(34, 211, 238)"
                  strokeWidth="2.5"
                  points={currentData.map((shift, idx) => {
                    const x = (idx / (currentData.length - 1 || 1)) * 400;
                    const y = 100 - ((shift.contacts / maxContacts) * 90);
                    return `${x},${y}`;
                  }).join(' ')}
                />
                
                {/* Заливка под графиком */}
                <polygon
                  fill="url(#chart-gradient)"
                  points={`
                    0,100
                    ${currentData.map((shift, idx) => {
                      const x = (idx / (currentData.length - 1 || 1)) * 400;
                      const y = 100 - ((shift.contacts / maxContacts) * 90);
                      return `${x},${y}`;
                    }).join(' ')}
                    400,100
                  `}
                />
                
                {/* Точки на графике */}
                {currentData.map((shift, idx) => {
                  const x = (idx / (currentData.length - 1 || 1)) * 400;
                  const y = 100 - ((shift.contacts / maxContacts) * 90);
                  const isGrowth = idx > 0 && shift.contacts > currentData[idx - 1].contacts;
                  const isDecline = idx > 0 && shift.contacts < currentData[idx - 1].contacts;
                  const dotColor = isGrowth ? 'rgb(16, 185, 129)' : isDecline ? 'rgb(239, 68, 68)' : 'rgb(34, 211, 238)';
                  
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={dotColor}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
              
              {/* Подписи дат и значений */}
              <div className="flex justify-between mt-2">
                {currentData.map((shift, idx) => (
                  <div key={idx} className="flex flex-col items-center" style={{ width: `${100 / currentData.length}%` }}>
                    <span className="text-[10px] text-cyan-400 font-bold">{shift.contacts}</span>
                    <span className="text-[9px] text-slate-500">
                      {new Date(shift.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-8">Нет данных по сменам</p>
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