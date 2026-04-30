import React from 'react';
import Icon from '@/components/ui/icon';

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
    <div className={`px-4 py-3 bg-white ${shift.is_open ? 'border-l-2 border-l-amber-400' : ''}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Icon name="User" size={13} className="text-gray-400" />
          <span className="font-semibold text-gray-800 text-sm">{shift.user_name}</span>
          {shift.is_open && (
            <span className="text-[10px] font-medium text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md">не закрыта</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 text-xs text-gray-400 mr-1">
            <Icon name="MessageSquare" size={11} />
            <span>{shift.leads_count}</span>
          </div>
          {shift.is_open && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(shift.user_id, shift.date, shift.organization_id); }}
              disabled={isClosing}
              title="Закрыть смену"
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors"
            >
              {isClosing
                ? <Icon name="Loader2" size={13} className="animate-spin text-gray-400" />
                : <Icon name="LogOut" size={13} className="text-amber-500" />
              }
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(shift.user_id, shift.date); }}
            disabled={isDeleting}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
          >
            {isDeleting
              ? <Icon name="Loader2" size={13} className="animate-spin text-gray-400" />
              : <Icon name="Trash2" size={13} className="text-red-400" />
            }
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] text-gray-400 mb-1">Начало</div>
          <div className="flex items-center gap-1">
            <Icon name="LogIn" size={12} className="text-emerald-400" />
            <span className="text-sm font-semibold text-gray-700">{shift.start_time}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-1">Окончание</div>
          <div className="flex items-center gap-1">
            <Icon name="LogOut" size={12} className="text-red-400" />
            <span className="text-sm font-semibold text-gray-700">{shift.end_time}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-1">Отработано</div>
          <div className="flex items-center gap-1">
            <Icon name="Timer" size={12} className="text-blue-400" />
            <span className="text-xs font-semibold text-gray-700">{shift.hours_worked}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
