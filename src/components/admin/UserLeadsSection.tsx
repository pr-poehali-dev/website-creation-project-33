import React from 'react';
import Icon from '@/components/ui/icon';
import DateTabs from './DateTabs';
import LeadCard from './LeadCard';
import { Lead } from './types';
import { findDuplicatePhones, hasDuplicatePhone } from './phoneUtils';

interface UserLeadsSectionProps {
  leads: Lead[];
  isLoading: boolean;
  selectedDate: string | null;
  groupedLeads: Record<string, Lead[]>;
  onDateSelect: (date: string) => void;
  onDeleteLead: (leadId: number) => void;
}

export default function UserLeadsSection({
  leads,
  isLoading,
  selectedDate,
  groupedLeads,
  onDateSelect,
  onDeleteLead,
}: UserLeadsSectionProps) {
  if (isLoading) {
    return (
      <div className="border-2 border-[#001f54]/10 rounded-lg p-4 bg-[#001f54]/5">
        <div className="flex items-center justify-center gap-2 text-[#001f54] font-medium">
          <Icon name="Loader2" size={16} className="animate-spin" />
          Загрузка лидов...
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="border-2 border-[#001f54]/10 rounded-lg p-4 bg-[#001f54]/5">
        <div className="text-center text-[#001f54]/70">
          <Icon name="MessageSquare" size={20} className="mx-auto mb-2 opacity-60 md:w-6 md:h-6" />
          <div className="text-sm md:text-base font-medium">У этого пользователя пока нет лидов</div>
        </div>
      </div>
    );
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

  const handleDateClick = (date: string) => {
    onDateSelect(selectedDate === date ? '' : date);
  };

  return (
    <div className="space-y-3">
      <DateTabs 
        dates={sortedDates}
        selectedDate={selectedDate}
        leadsCounts={leadsCounts}
        onDateSelect={handleDateClick}
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
  );
}