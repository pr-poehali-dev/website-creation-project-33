import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { UserSchedule, DeleteSlotState } from './types';
import { isMaximKorelsky } from './utils';
import OrgStatsModal from './OrgStatsModal';

interface WorkerCardProps {
  worker: UserSchedule;
  dayDate: string;
  slotTime: string;
  slotLabel: string;
  workComments: Record<string, Record<string, {
    location?: string;
    flyers?: string;
    organization?: string;
    location_type?: string;
    location_details?: string;
  }>>;
  savingComment: string | null;
  allLocations: string[];
  recommendedOrg: string;
  orgAvg?: number;
  orgStats: Array<{organization_name: string, avg_per_shift: number}>;
  onCommentChange: (userName: string, date: string, field: string, value: string) => void;
  onCommentBlur: (userName: string, date: string, field: string, value: string) => void;
  onRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
}

const LOCATION_TYPES = ['ТЦ', 'Школа', 'Садик', 'Улица'];

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
  const [showOrgStatsModal, setShowOrgStatsModal] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMaxim = isMaximKorelsky(worker.first_name, worker.last_name);
  const avgContacts = worker.avg_per_shift || 0;
  const workerName = `${worker.first_name} ${worker.last_name}`;
  const commentKey = `${workerName}-${dayDate}`;
  
  const commentData = workComments[dayDate]?.[workerName] || {};
  const currentOrganization = commentData.organization || '';
  const currentLocationType = commentData.location_type || '';
  const currentLocationDetails = commentData.location_details || '';
  const currentFlyers = commentData.flyers || '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOrgDropdown(false);
        setOrgSearchQuery('');
        setShowAllOrgs(false);
      }
    };

    if (showOrgDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOrgDropdown]);

  const filteredOrgs = allLocations.filter(org => 
    org.toLowerCase().includes(orgSearchQuery.toLowerCase())
  );

  const displayedOrgs = showAllOrgs ? filteredOrgs : filteredOrgs.slice(0, 3);

  const handleOrgSelect = (org: string) => {
    onCommentChange(workerName, dayDate, 'organization', org);
    setShowOrgDropdown(false);
    setOrgSearchQuery('');
    setShowAllOrgs(false);
  };

  const handleSave = () => {
    onCommentBlur(workerName, dayDate, 'organization', currentOrganization);
    onCommentBlur(workerName, dayDate, 'location_type', currentLocationType);
    onCommentBlur(workerName, dayDate, 'location_details', currentLocationDetails);
    onCommentBlur(workerName, dayDate, 'flyers', currentFlyers);
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
        <div className="relative flex items-center gap-1" ref={dropdownRef}>
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="w-full text-left text-[10px] md:text-xs h-6 md:h-7 px-2 bg-slate-800/50 border border-slate-600 text-slate-200 rounded-md hover:bg-slate-700/50 flex items-center justify-between"
            >
              <span className={currentOrganization ? '' : 'text-slate-500'}>
                {currentOrganization || 'Организация'}
              </span>
              <Icon name="ChevronDown" size={12} className="flex-shrink-0" />
            </button>
            
            {showOrgDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-20 max-h-64 overflow-hidden">
                <div className="p-2 border-b border-slate-600">
                  <div className="relative">
                    <Icon name="Search" size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Поиск организации..."
                      value={orgSearchQuery}
                      onChange={(e) => {
                        setOrgSearchQuery(e.target.value);
                        setShowAllOrgs(false);
                      }}
                      className="text-[10px] md:text-xs h-6 pl-7 pr-2 bg-slate-700/50 border-slate-600 text-slate-200"
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="max-h-40 overflow-y-auto">
                  {displayedOrgs.length > 0 ? (
                    <>
                      {displayedOrgs.map((org) => (
                        <button
                          key={org}
                          type="button"
                          onClick={() => handleOrgSelect(org)}
                          className="w-full text-left px-2 py-1.5 text-[10px] md:text-xs hover:bg-slate-700/50 text-slate-200 transition-colors"
                        >
                          {org}
                        </button>
                      ))}
                      {!showAllOrgs && filteredOrgs.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllOrgs(true)}
                          className="w-full text-center px-2 py-1.5 text-[10px] md:text-xs text-cyan-400 hover:bg-slate-700/50 border-t border-slate-600"
                        >
                          Показать ещё {filteredOrgs.length - 3}...
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="px-2 py-3 text-center text-[10px] text-slate-500">
                      Не найдено
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {currentOrganization && savingComment !== commentKey && (
            <Icon name="Building2" size={12} className="text-cyan-400 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Select
            value={currentLocationType}
            onValueChange={(value) => onCommentChange(workerName, dayDate, 'location_type', value)}
          >
            <SelectTrigger className="text-[10px] md:text-xs h-6 md:h-7 px-2 bg-slate-800/50 border-slate-600 text-slate-200">
              <SelectValue placeholder="Тип места" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 text-slate-200">
              {LOCATION_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-[10px] md:text-xs">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentLocationType && savingComment !== commentKey && (
            <Icon name="MapPin" size={12} className="text-emerald-400 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Input
            type="text"
            placeholder="Адрес / Детали"
            value={currentLocationDetails}
            onChange={(e) => onCommentChange(workerName, dayDate, 'location_details', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            className="text-[10px] md:text-xs h-6 md:h-7 px-2 bg-slate-800/50 border-slate-600 text-slate-200"
          />
          {currentLocationDetails && savingComment !== commentKey && (
            <Icon name="Navigation" size={12} className="text-blue-400 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Input
            type="text"
            placeholder="Листовки"
            value={currentFlyers}
            onChange={(e) => onCommentChange(workerName, dayDate, 'flyers', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            className="text-[10px] md:text-xs h-6 md:h-7 px-2 bg-slate-800/50 border-slate-600 text-slate-200"
          />
          {currentFlyers && savingComment !== commentKey && (
            <Icon name="FileText" size={12} className="text-amber-400 flex-shrink-0" />
          )}
        </div>
        
        <button
          onClick={handleSave}
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