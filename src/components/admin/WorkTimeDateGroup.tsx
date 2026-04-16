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
    <div className="border-2 border-slate-600 rounded-xl overflow-hidden bg-slate-800/50">
      <div
        className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 cursor-pointer hover:bg-slate-800/70 transition-colors gap-2"
        onClick={() => onToggle(date)}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <Icon
            name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
            size={18}
            className="text-cyan-400 transition-transform md:w-5 md:h-5"
          />
          <Icon name="Calendar" size={18} className="text-cyan-400 md:w-5 md:h-5" />
          <span className="font-bold text-slate-100 text-sm md:text-base">{date}</span>
          <span className="text-xs md:text-sm text-slate-400">({shifts.length})</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-300 bg-slate-700 px-2 py-1 md:px-3 rounded-lg ml-7 md:ml-0">
          <Icon name="MessageSquare" size={12} className="md:w-[14px] md:h-[14px] text-cyan-400" />
          <span>{totalLeads} лидов</span>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 p-3 md:p-4 pt-0">
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
