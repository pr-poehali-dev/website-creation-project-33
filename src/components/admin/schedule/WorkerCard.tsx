import { useState } from 'react';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { UserSchedule, DeleteSlotState } from './types';
import { isMaximKorelsky } from './utils';
import OrgStatsModal from './OrgStatsModal';

interface WorkerCardProps {
  worker: UserSchedule;
  dayDate: string;
  slotTime: string;
  slotLabel: string;
  workComments: Record<string, Record<string, {location?: string, flyers?: string}>>;
  savingComment: string | null;
  allLocations: string[];
  recommendedOrg: string;
  orgAvg?: number;
  orgStats: Array<{organization_name: string, avg_per_shift: number}>;
  onCommentChange: (userName: string, date: string, field: 'location' | 'flyers', value: string) => void;
  onCommentBlur: (userName: string, date: string, field: 'location' | 'flyers', value: string) => void;
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
  orgStats,
  onCommentChange,
  onCommentBlur,
  onRemoveSlot,
  deletingSlot
}: WorkerCardProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [showOrgStatsModal, setShowOrgStatsModal] = useState(false);

  const isMaxim = isMaximKorelsky(worker.first_name, worker.last_name);
  const avgContacts = worker.avg_per_shift || 0;
  const workerName = `${worker.first_name} ${worker.last_name}`;
  const commentKey = `${workerName}-${dayDate}`;
  const commentData = workComments[dayDate]?.[workerName] || {};
  const currentLocation = commentData.location || '';
  const currentFlyers = commentData.flyers || '';



  const handleLocationChange = (value: string) => {
    onCommentChange(workerName, dayDate, 'location', value);
    
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

  const handleFlyersChange = (value: string) => {
    onCommentChange(workerName, dayDate, 'flyers', value);
  };

  const handleSuggestionClick = (location: string) => {
    onCommentChange(workerName, dayDate, 'location', location);
    setShowSuggestions(false);
    onCommentBlur(workerName, dayDate, 'location', location);
  };



  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between group">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs text-slate-200">
              • {worker.first_name} {worker.last_name}{isMaxim && ' 👑'}
            </span>
            {avgContacts !== undefined && avgContacts !== null && (
              <span className="text-[9px] md:text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                ~{avgContacts.toFixed(1)}
              </span>
            )}
          </div>
          {recommendedOrg && (
            <div className="flex items-center gap-2 ml-2">
              <span 
                className="text-[9px] md:text-[10px] text-cyan-400 cursor-pointer hover:underline"
                onClick={() => setShowOrgStatsModal(true)}
              >
                Рекомендация: {recommendedOrg}{orgAvg ? ` (~${orgAvg.toFixed(1)})` : ''}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => onRemoveSlot(worker.user_id, workerName, dayDate, slotTime, slotLabel)}
          disabled={deletingSlot?.userId === worker.user_id && deletingSlot?.date === dayDate && deletingSlot?.slot === slotTime}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 disabled:opacity-50"
          title="Удалить смену"
        >
          {deletingSlot?.userId === worker.user_id && deletingSlot?.date === dayDate && deletingSlot?.slot === slotTime ? (
            <Icon name="Loader2" size={14} className="animate-spin" />
          ) : (
            <Icon name="X" size={14} />
          )}
        </button>
      </div>
      <div className="space-y-1 ml-2">
        <div className="relative flex items-center gap-1">
          <Input
            type="text"
            placeholder="Место работы"
            value={currentLocation}
            onChange={(e) => handleLocationChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setShowSuggestions(false);
              }
            }}
            className="text-[10px] md:text-xs h-6 md:h-7 px-2 bg-slate-800/50 border-slate-600 text-slate-200"
          />
          {currentLocation && savingComment !== commentKey && (
            <Icon name="MapPin" size={12} className="text-emerald-400 flex-shrink-0" />
          )}
        
          {showSuggestions && filteredLocations.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
              {filteredLocations.map((location, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 text-[10px] md:text-xs hover:bg-slate-700/50 cursor-pointer text-slate-200"
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
        
        <div className="flex items-center gap-1">
          <Input
            type="text"
            placeholder="Листовки"
            value={currentFlyers}
            onChange={(e) => handleFlyersChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="text-[10px] md:text-xs h-6 md:h-7 px-2 bg-slate-800/50 border-slate-600 text-slate-200"
          />
          {currentFlyers && savingComment !== commentKey && (
            <Icon name="FileText" size={12} className="text-cyan-400 flex-shrink-0" />
          )}
        </div>
        
        <button
          onClick={() => {
            setShowSuggestions(false);
            onCommentBlur(workerName, dayDate, 'location', currentLocation);
            onCommentBlur(workerName, dayDate, 'flyers', currentFlyers);
          }}
          disabled={savingComment === commentKey}
          className="w-full px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded text-[10px] md:text-xs h-6 md:h-7 flex items-center justify-center gap-1"
          title="Сохранить"
        >
          {savingComment === commentKey ? (
            <Icon name="Loader2" size={12} className="animate-spin" />
          ) : (
            <>
              <Icon name="Check" size={12} />
              <span>Сохранить</span>
            </>
          )}
        </button>
      </div>
      
      {showOrgStatsModal && (
        <OrgStatsModal
          workerName={workerName}
          workerEmail={worker.email}
          orgStats={orgStats}
          onClose={() => setShowOrgStatsModal(false)}
        />
      )}
    </div>
  );
}