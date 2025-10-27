import { useState } from 'react';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { UserSchedule, DeleteSlotState } from './types';
import { isMaximKorelsky } from './utils';

interface WorkerCardProps {
  worker: UserSchedule;
  dayDate: string;
  slotTime: string;
  slotLabel: string;
  workComments: Record<string, Record<string, string>>;
  savingComment: string | null;
  allLocations: string[];
  recommendedOrg: string;
  orgAvg?: number;
  onCommentChange: (userName: string, date: string, comment: string) => void;
  onCommentBlur: (userName: string, date: string, comment: string) => void;
  onRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
}

export default function WorkerCard({
  worker,
  dayDate,
  slotTime,
  slotLabel,
  workComments,
  savingComment,
  allLocations,
  recommendedOrg,
  orgAvg,
  onCommentChange,
  onCommentBlur,
  onRemoveSlot,
  deletingSlot
}: WorkerCardProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);

  const isMaxim = isMaximKorelsky(worker.first_name, worker.last_name);
  const avgContacts = worker.avg_per_shift || 0;
  const workerName = `${worker.first_name} ${worker.last_name}`;
  const commentKey = `${workerName}-${dayDate}`;
  const currentComment = workComments[dayDate]?.[workerName] || '';

  const handleInputChange = (value: string) => {
    onCommentChange(workerName, dayDate, value);
    
    if (value.length > 0) {
      const filtered = allLocations.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (location: string) => {
    onCommentChange(workerName, dayDate, location);
    setShowSuggestions(false);
    onCommentBlur(workerName, dayDate, location);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
    onCommentBlur(workerName, dayDate, currentComment);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between group">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs text-gray-700">
              • {worker.first_name} {worker.last_name}{isMaxim && ' 👑'}
            </span>
            {avgContacts !== undefined && avgContacts !== null && (
              <span className="text-[9px] md:text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                ~{avgContacts.toFixed(1)}
              </span>
            )}
          </div>
          {recommendedOrg && (
            <span className="text-[9px] md:text-[10px] text-blue-600 ml-2">
              Рекомендация: {recommendedOrg}{orgAvg ? ` (~${orgAvg.toFixed(1)})` : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => onRemoveSlot(worker.user_id, workerName, dayDate, slotTime, slotLabel)}
          disabled={deletingSlot?.userId === worker.user_id && deletingSlot?.date === dayDate && deletingSlot?.slot === slotTime}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 disabled:opacity-50"
          title="Удалить смену"
        >
          {deletingSlot?.userId === worker.user_id && deletingSlot?.date === dayDate && deletingSlot?.slot === slotTime ? (
            <Icon name="Loader2" size={14} className="animate-spin" />
          ) : (
            <Icon name="X" size={14} />
          )}
        </button>
      </div>
      <div className="relative flex items-center gap-1 ml-2">
        <Input
          type="text"
          placeholder=""
          value={currentComment}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          className="text-[10px] md:text-xs h-6 md:h-7 px-2 bg-white border-gray-300"
        />
        {savingComment === commentKey && (
          <Icon name="Loader2" size={12} className="animate-spin text-gray-400" />
        )}
        {currentComment && (
          <Icon name="MapPin" size={12} className="text-green-600" />
        )}
        
        {showSuggestions && filteredLocations.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
            {filteredLocations.map((location, idx) => (
              <div
                key={idx}
                className="px-2 py-1 text-[10px] md:text-xs hover:bg-gray-100 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(location);
                }}
              >
                {location}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}