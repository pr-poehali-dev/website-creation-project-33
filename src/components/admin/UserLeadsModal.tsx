import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import DateTabs from './DateTabs';
import LeadCard from './LeadCard';
import { Lead } from './types';
import { findDuplicatePhones, hasDuplicatePhone } from './phoneUtils';
import { formatMoscowTime } from '@/utils/timeFormat';

interface ApproachItem {
  id: number;
  created_at: string;
  approaches: number;
  lead_type: string;
  organization_name?: string;
}

interface UserLeadsModalProps {
  userName: string | null;
  leads: Lead[];
  approaches?: ApproachItem[];
  isLoading: boolean;
  selectedDate: string | null;
  groupedLeads: Record<string, Lead[]>;
  onDateSelect: (date: string) => void;
  onDeleteLead: (leadId: number) => void;
  onDeleteDate?: (date: string) => void;
  onClose: () => void;
}

export default function UserLeadsModal({
  userName,
  leads,
  approaches = [],
  isLoading,
  selectedDate,
  groupedLeads,
  onDateSelect,
  onDeleteLead,
  onDeleteDate,
  onClose,
}: UserLeadsModalProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'approaches'>('contacts');

  if (!userName) return null;

  const contactLeads = leads.filter(l => l.lead_type !== 'подход');

  // Группировка подходов по датам
  const approachesGrouped = approaches.reduce((acc, item) => {
    const date = formatMoscowTime(item.created_at, 'date');
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ApproachItem[]>);

  // Для контактов используем groupedLeads (только не-подходы)
  const contactsGrouped = Object.keys(groupedLeads).reduce((acc, date) => {
    const filtered = groupedLeads[date].filter(l => l.lead_type !== 'подход');
    if (filtered.length > 0) acc[date] = filtered;
    return acc;
  }, {} as Record<string, Lead[]>);

  const activeGrouped = activeTab === 'contacts' ? contactsGrouped : approachesGrouped;

  const sortedDates = Object.keys(activeGrouped).sort((a, b) => {
    const dateA = a.split('.').reverse().join('-');
    const dateB = b.split('.').reverse().join('-');
    return dateB.localeCompare(dateA);
  });

  const leadsCounts = Object.keys(activeGrouped).reduce((acc, date) => {
    acc[date] = activeGrouped[date].length;
    return acc;
  }, {} as Record<string, number>);

  const datesWithDuplicates = activeTab === 'contacts'
    ? Object.keys(contactsGrouped).reduce((acc, date) => {
        const duplicatePhones = findDuplicatePhones(contactsGrouped[date]);
        acc[date] = duplicatePhones.size > 0;
        return acc;
      }, {} as Record<string, boolean>)
    : {};

  const handleDateClick = (date: string) => {
    onDateSelect(selectedDate === date ? '' : date);
  };

  const currentDateLeads = activeTab === 'contacts' && selectedDate && contactsGrouped[selectedDate]
    ? contactsGrouped[selectedDate]
    : null;
  const currentDateApproaches = activeTab === 'approaches' && selectedDate && approachesGrouped[selectedDate]
    ? approachesGrouped[selectedDate]
    : null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-slate-900 rounded-t-2xl sm:rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 border-slate-700">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-xl md:text-2xl font-bold text-slate-100 truncate">
                {activeTab === 'contacts' ? 'Контакты' : 'Подходы'} — {userName}
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {activeTab === 'contacts'
                  ? `Контактов: ${contactLeads.length}`
                  : `Подходов: ${approaches.length}`}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-slate-700 text-slate-300 flex-shrink-0"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>

          {/* Переключатель табов */}
          <div className="flex bg-slate-900 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setActiveTab('contacts'); onDateSelect(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'contacts'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon name="Phone" size={14} />
              Контакты
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'contacts' ? 'bg-white/20' : 'bg-slate-700'}`}>
                {contactLeads.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('approaches'); onDateSelect(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'approaches'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon name="User" size={14} />
              Подходы
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'approaches' ? 'bg-white/20' : 'bg-slate-700'}`}>
                {approaches.length}
              </span>
            </button>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {isLoading ? (
            <div className="border-2 border-slate-700 rounded-lg p-4 bg-slate-800/50">
              <div className="flex items-center justify-center gap-2 text-slate-300 font-medium">
                <Icon name="Loader2" size={16} className="animate-spin" />
                Загрузка...
              </div>
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="border-2 border-slate-700 rounded-lg p-4 bg-slate-800/50">
              <div className="text-center text-slate-400">
                <Icon name={activeTab === 'contacts' ? 'Phone' : 'User'} size={20} className="mx-auto mb-2 opacity-60" />
                <div className="text-sm font-medium">
                  {activeTab === 'contacts' ? 'Нет контактов' : 'Нет подходов'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <DateTabs
                dates={sortedDates}
                selectedDate={selectedDate}
                leadsCounts={leadsCounts}
                datesWithDuplicates={datesWithDuplicates}
                onDateSelect={handleDateClick}
                onDeleteDate={activeTab === 'contacts' ? onDeleteDate : undefined}
              />

              {/* Контакты */}
              {activeTab === 'contacts' && selectedDate && currentDateLeads && (
                <div className="space-y-3">
                  {(() => {
                    const duplicatePhones = findDuplicatePhones(currentDateLeads);
                    return currentDateLeads.map((lead) => {
                      const isDuplicate = hasDuplicatePhone(lead.notes, duplicatePhones);
                      return (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          isDuplicate={isDuplicate}
                          onDeleteLead={() => onDeleteLead(lead.id)}
                        />
                      );
                    });
                  })()}
                </div>
              )}

              {/* Подходы */}
              {activeTab === 'approaches' && selectedDate && currentDateApproaches && (
                <div className="space-y-3">
                  {currentDateApproaches.map((item) => (
                    <div key={item.id} className="border-2 border-slate-700 rounded-lg p-3 md:p-4 bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500 flex-shrink-0">
                          <Icon name="User" size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-100 text-sm font-medium mb-1">
                            {formatMoscowTime(item.created_at, 'datetime')}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs font-medium text-yellow-300">
                              <Icon name="User" size={12} />
                              подход
                            </span>
                            {item.organization_name && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-900/30 border border-cyan-600/30 rounded-full text-xs font-medium text-cyan-400">
                                <Icon name="Building2" size={12} />
                                {item.organization_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}