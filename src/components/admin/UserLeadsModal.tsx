import React from 'react';
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
  onClose: () => void;
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
  onClose,
}: UserLeadsModalProps) {
  if (!userName) {
    return null;
  }

  const sortedDates = Object.keys(groupedLeads).sort((a, b) => {
    const dateA = a.split('.').reverse().join('-');
    const dateB = b.split('.').reverse().join('-');
    return dateB.localeCompare(dateA);
  });

  const leadsCounts = Object.keys(groupedLeads).reduce((acc, date) => {
    acc[date] = groupedLeads[date].length;
    return acc;
  }, {} as Record<string, number>);

  const datesWithDuplicates = Object.keys(groupedLeads).reduce((acc, date) => {
    const leadsForDate = groupedLeads[date];
    const duplicatePhones = findDuplicatePhones(leadsForDate);
    acc[date] = duplicatePhones.size > 0;
    return acc;
  }, {} as Record<string, boolean>);

  const handleDateClick = (date: string) => {
    onDateSelect(selectedDate === date ? '' : date);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-slate-900 rounded-t-2xl sm:rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 border-slate-700">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-xl md:text-2xl font-bold text-slate-100 truncate">
                Контакты — {userName}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Всего контактов: {leads.length}
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
        </div>
        
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="border-2 border-slate-700 rounded-lg p-4 bg-slate-800/50">
              <div className="flex items-center justify-center gap-2 text-slate-300 font-medium">
                <Icon name="Loader2" size={16} className="animate-spin" />
                Загрузка контактов...
              </div>
            </div>
          ) : leads.length === 0 ? (
            <div className="border-2 border-slate-700 rounded-lg p-4 bg-slate-800/50">
              <div className="text-center text-slate-400">
                <Icon name="MessageSquare" size={20} className="mx-auto mb-2 opacity-60 md:w-6 md:h-6" />
                <div className="text-sm md:text-base font-medium">У этого пользователя пока нет контактов</div>
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
              />

              {selectedDate && groupedLeads[selectedDate] && (
                <div className="space-y-3">
                  {(() => {
                    const leadsForDate = groupedLeads[selectedDate];
                    const duplicatePhones = findDuplicatePhones(leadsForDate);
                    
                    return leadsForDate.map((lead) => {
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
