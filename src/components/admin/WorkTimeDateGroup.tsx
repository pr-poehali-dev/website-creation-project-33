import React from 'react';
import Icon from '@/components/ui/icon';
import WorkTimeShiftCard, { WorkTimeData } from './WorkTimeShiftCard';

interface WorkTimeDateGroupProps {
  date: string;
  shifts: WorkTimeData[];
  isExpanded: boolean;
  deletingShift: string | null;
  closingShift: string | null;
  onToggle: (date: string) => void;
  onDelete: (userId: number, workDate: string) => void;
  onClose: (userId: number, workDate: string, organizationId: number) => void;
}

export default function WorkTimeDateGroup({
  date,
  shifts,
  isExpanded,
  deletingShift,
  closingShift,
  onToggle,
  onDelete,
  onClose,
}: WorkTimeDateGroupProps) {
  const totalLeads = shifts.reduce((sum, shift) => sum + shift.leads_count, 0);

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors bg-white"
        onClick={() => onToggle(date)}
      >
        <div className="flex items-center gap-2.5">
          <Icon
            name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
            size={16}
            className="text-gray-400 transition-transform"
          />
          <Icon name="CalendarDays" size={15} className="text-blue-400" />
          <span className="font-semibold text-gray-800 text-sm">{date}</span>
          <span className="text-xs text-gray-400">({shifts.length})</span>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-lg">
          <Icon name="MessageSquare" size={11} className="text-blue-400" />
          <span>{totalLeads} лидов</span>
        </div>
      </div>

      {isExpanded && (
        <div className="divide-y divide-gray-50 border-t border-gray-100">
          {shifts.map((shift, index) => (
            <WorkTimeShiftCard
              key={index}
              shift={shift}
              index={index}
              deletingShift={deletingShift}
              closingShift={closingShift}
              onDelete={onDelete}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}
