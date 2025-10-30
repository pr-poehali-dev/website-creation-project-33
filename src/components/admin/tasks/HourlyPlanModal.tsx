import Icon from '@/components/ui/icon';
import { PlannedOrganization } from './types';

interface HourlyPlanModalProps {
  editingPlan: PlannedOrganization;
  timeSlots: string[];
  onClose: () => void;
  onUpdateNote: (hour: string, note: string) => void;
  getHourlyNote: (hour: string) => string;
}

export default function HourlyPlanModal({
  editingPlan,
  timeSlots,
  onClose,
  onUpdateNote,
  getHourlyNote
}: HourlyPlanModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800">{editingPlan.organization}</h3>
            <p className="text-sm text-gray-600">
              {new Date(editingPlan.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <Icon name="X" size={24} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {timeSlots.map((hour) => (
            <div key={hour} className="flex items-start gap-3 border-b border-gray-100 pb-3">
              <div className="flex-shrink-0 w-16 md:w-20 pt-2">
                <div className="text-sm md:text-base font-semibold text-gray-700">{hour}</div>
                <div className="text-xs text-gray-400">
                  {hour.split(':')[0] === '08' && '2 часа'}
                  {hour.split(':')[0] !== '08' && hour.split(':')[0] !== '22' && ''}
                </div>
              </div>
              <textarea
                value={getHourlyNote(hour)}
                onChange={(e) => onUpdateNote(hour, e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Заметки для этого времени..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base resize-none"
                rows={2}
              />
            </div>
          ))}
        </div>
        
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm md:text-base"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
