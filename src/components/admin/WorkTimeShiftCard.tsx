import React from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

export interface WorkTimeData {
  user_id: number;
  user_name: string;
  date: string;
  start_time: string;
  end_time: string;
  hours_worked: string;
  leads_count: number;
  organization_id: number;
  is_open: boolean;
}

interface WorkTimeShiftCardProps {
  shift: WorkTimeData;
  index: number;
  deletingShift: string | null;
  closingShift: string | null;
  onDelete: (userId: number, workDate: string) => void;
  onClose: (userId: number, workDate: string, organizationId: number) => void;
}

export default function WorkTimeShiftCard({
  shift,
  index,
  deletingShift,
  closingShift,
  onDelete,
  onClose,
}: WorkTimeShiftCardProps) {
  const shiftKey = `${shift.user_id}-${shift.date}`;
  const isDeleting = deletingShift === shiftKey;
  const isClosing = closingShift === `close-${shift.user_id}-${shift.date}`;

  return (
    <div
      key={index}
      className="bg-slate-700/50 rounded-lg p-2.5 md:p-3 border border-slate-600"
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Icon name="User" size={12} className="text-slate-400 md:w-[14px] md:h-[14px]" />
          <span className="font-medium text-slate-100 text-xs md:text-sm">{shift.user_name}</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-slate-400">
            <Icon name="MessageSquare" size={10} className="md:w-3 md:h-3" />
            <span>{shift.leads_count}</span>
          </div>
          {shift.is_open && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClose(shift.user_id, shift.date, shift.organization_id);
              }}
              disabled={isClosing}
              title="Закрыть смену"
              className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-amber-500/20"
            >
              {isClosing ? (
                <Icon name="Loader2" size={12} className="animate-spin text-slate-400 md:w-[14px] md:h-[14px]" />
              ) : (
                <Icon name="LogOut" size={12} className="text-amber-400 md:w-[14px] md:h-[14px]" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(shift.user_id, shift.date);
            }}
            disabled={isDeleting}
            className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-red-500/20"
          >
            {isDeleting ? (
              <Icon name="Loader2" size={12} className="animate-spin text-slate-400 md:w-[14px] md:h-[14px]" />
            ) : (
              <Icon name="Trash2" size={12} className="text-red-400 md:w-[14px] md:h-[14px]" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px] md:text-xs mb-0.5 md:mb-1">Начало</span>
          <div className="flex items-center gap-1 md:gap-1.5 text-slate-100 font-medium">
            <Icon name="LogIn" size={12} className="text-emerald-400 md:w-[14px] md:h-[14px]" />
            <span className="text-[11px] md:text-sm">{shift.start_time}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px] md:text-xs mb-0.5 md:mb-1">Окончание</span>
          <div className="flex items-center gap-1 md:gap-1.5 text-slate-100 font-medium">
            <Icon name="LogOut" size={12} className="text-red-400 md:w-[14px] md:h-[14px]" />
            <span className="text-[11px] md:text-sm">{shift.end_time}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px] md:text-xs mb-0.5 md:mb-1">Отработано</span>
          <div className="flex items-center gap-1 md:gap-1.5 text-slate-100 font-bold">
            <Icon name="Timer" size={12} className="text-cyan-400 md:w-[14px] md:h-[14px]" />
            <span className="text-[10px] md:text-xs">{shift.hours_worked}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
