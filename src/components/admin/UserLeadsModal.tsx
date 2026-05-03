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
  onDeleteApproach?: (id: number, leadType: string) => void;
  onDeleteApproachesByDate?: (date: string) => void;
  onAddContact?: (date: string) => void;
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
  onDeleteApproach,
  onDeleteApproachesByDate,
  onAddContact,
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                {activeTab === 'contacts' ? 'Контакты' : 'Подходы'} — {userName}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {activeTab === 'contacts'
                  ? `Контактов: ${contactLeads.length}`
                  : `Подходов: ${approaches.length}`}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 text-gray-400 flex-shrink-0"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>

          {/* Переключатель табов */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setActiveTab('contacts'); onDateSelect(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'contacts'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon name="Phone" size={14} />
              Контакты
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'contacts' ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                {contactLeads.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('approaches'); onDateSelect(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'approaches'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon name="User" size={14} />
              Подходы
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'approaches' ? 'bg-amber-50 text-amber-600' : 'bg-gray-200 text-gray-500'}`}>
                {approaches.length}
              </span>
            </button>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-160px)] bg-gray-50">
          {isLoading ? (
            <div className="border border-gray-100 rounded-xl p-4 bg-white">
              <div className="flex items-center justify-center gap-2 text-gray-400 font-medium">
                <Icon name="Loader2" size={16} className="animate-spin text-blue-400" />
                Загрузка...
              </div>
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="border border-gray-100 rounded-xl p-4 bg-white">
              <div className="text-center text-gray-400">
                <Icon name={activeTab === 'contacts' ? 'Phone' : 'User'} size={20} className="mx-auto mb-2 text-gray-300" />
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
                onDeleteDate={activeTab === 'contacts' ? onDeleteDate : onDeleteApproachesByDate}
                onAddContact={activeTab === 'contacts' ? onAddContact : undefined}
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
                  {currentDateApproaches.map((item) => {
                    const isContact = item.lead_type === 'контакт';
                    return (
                      <div key={`${item.lead_type}-${item.id}`} className="border border-gray-100 rounded-xl p-3 md:p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${isContact ? 'bg-blue-50' : 'bg-amber-50'}`}>
                              <Icon name={isContact ? 'Phone' : 'User'} size={16} className={isContact ? 'text-blue-500' : 'text-amber-500'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-700 text-sm font-medium mb-1">
                                {formatMoscowTime(item.created_at, 'datetime')}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                  isContact
                                    ? 'bg-blue-50 border border-blue-100 text-blue-600'
                                    : 'bg-amber-50 border border-amber-100 text-amber-600'
                                }`}>
                                  <Icon name={isContact ? 'Phone' : 'User'} size={12} />
                                  {item.lead_type}
                                </span>
                                {item.organization_name && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs font-medium text-gray-600">
                                    <Icon name="Building2" size={12} />
                                    {item.organization_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {onDeleteApproach && (
                            <button
                              onClick={() => onDeleteApproach(item.id, item.lead_type)}
                              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors flex-shrink-0"
                            >
                              <Icon name="Trash2" size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}