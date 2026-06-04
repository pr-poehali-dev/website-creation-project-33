import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import DateTabs from './DateTabs';
import LeadCard from './LeadCard';
import { Lead } from './types';
import { findDuplicatePhones, hasDuplicatePhone } from './phoneUtils';

interface UserLeadsModalProps {
  userName: string | null;
  leads: Lead[];
  isLoading: boolean;
  selectedDate: string | null;
  groupedLeads: Record<string, Lead[]>;
  onDateSelect: (date: string) => void;
  onDeleteLead: (leadId: number) => void;
  onDeleteDate?: (date: string) => void;
  onAddContact?: (date: string) => void;
  onClose: () => void;
}

function getTodayMoscow(): string {
  const now = new Date();
  const moscow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const d = String(moscow.getDate()).padStart(2, '0');
  const m = String(moscow.getMonth() + 1).padStart(2, '0');
  const y = moscow.getFullYear();
  return `${d}.${m}.${y}`;
}

function isoToDot(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function dotToIso(dot: string): string {
  const [d, m, y] = dot.split('.');
  return `${y}-${m}-${d}`;
}

export default function UserLeadsModal({
  userName,
  leads,
  isLoading,
  selectedDate,
  groupedLeads,
  onDateSelect,
  onDeleteLead,
  onDeleteDate,
  onAddContact,
  onClose,
}: UserLeadsModalProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  if (!userName) return null;

  const contactsGrouped = Object.keys(groupedLeads).reduce((acc, date) => {
    const filtered = groupedLeads[date];
    if (filtered.length > 0) acc[date] = filtered;
    return acc;
  }, {} as Record<string, Lead[]>);

  const sortedDates = Object.keys(contactsGrouped).sort((a, b) => {
    const dateA = a.split('.').reverse().join('-');
    const dateB = b.split('.').reverse().join('-');
    return dateB.localeCompare(dateA);
  });

  const leadsCounts = Object.keys(contactsGrouped).reduce((acc, date) => {
    acc[date] = contactsGrouped[date].length;
    return acc;
  }, {} as Record<string, number>);

  const datesWithDuplicates = Object.keys(contactsGrouped).reduce((acc, date) => {
    const duplicatePhones = findDuplicatePhones(contactsGrouped[date]);
    acc[date] = duplicatePhones.size > 0;
    return acc;
  }, {} as Record<string, boolean>);

  const handleDateClick = (date: string) => {
    onDateSelect(selectedDate === date ? '' : date);
  };

  const handleDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value || !onAddContact) return;
    onAddContact(isoToDot(e.target.value));
    e.target.value = '';
  };

  const currentDateLeads = selectedDate && contactsGrouped[selectedDate]
    ? contactsGrouped[selectedDate]
    : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                Контакты — {userName}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Контактов: {leads.length}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onAddContact && (
                <>
                  <input
                    ref={dateInputRef}
                    type="date"
                    max={dotToIso(getTodayMoscow())}
                    onChange={handleDatePick}
                    className="sr-only"
                    tabIndex={-1}
                  />
                  <button
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-500 transition-colors"
                    title="Добавить контакты за выбранную дату"
                  >
                    <Icon name="Plus" size={13} />
                    Добавить за дату
                  </button>
                </>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 text-gray-400"
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-gray-50">
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
                <Icon name="Phone" size={20} className="mx-auto mb-2 text-gray-300" />
                <div className="text-sm font-medium mb-3">Нет контактов</div>
                {onAddContact && (
                  <button
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 transition-colors"
                  >
                    <Icon name="Plus" size={14} />
                    Добавить контакты
                  </button>
                )}
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
                onDeleteDate={onDeleteDate}
                onAddContact={onAddContact}
              />

              {selectedDate && currentDateLeads && (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
