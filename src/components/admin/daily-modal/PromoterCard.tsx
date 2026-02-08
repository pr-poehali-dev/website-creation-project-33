import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { UserStats } from '../types';

interface DetailedLead {
  user_name: string;
  lead_type: string;
  organization: string;
  created_at: string;
}

interface PromoterCardProps {
  user: UserStats;
  index: number;
  isExpanded: boolean;
  comments: Record<string, {location?: string, flyers?: string}>;
  savingComment: string | null;
  userLeads: DetailedLead[];
  onToggle: (userName: string) => void;
  onCommentChange: (userName: string, field: 'location' | 'flyers', value: string) => void;
  onCommentBlur: (userName: string, field: 'location' | 'flyers', value: string) => void;
  onExpandLeads: (userName: string) => void;
}

export default function PromoterCard({
  user,
  index,
  isExpanded,
  comments,
  savingComment,
  userLeads,
  onToggle,
  onCommentChange,
  onCommentBlur,
  onExpandLeads
}: PromoterCardProps) {
  return (
    <div className="border-2 border-slate-700 rounded-xl bg-slate-800/50 shadow-sm overflow-hidden">
      <div 
        onClick={() => onToggle(user.name)}
        className="p-3 md:p-4 cursor-pointer hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs md:text-sm flex-shrink-0 border border-cyan-500/30">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-100 text-xs sm:text-sm md:text-base truncate">{user.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="flex gap-2 md:gap-3 text-xs">
              <div className="text-center">
                <div className="text-sm md:text-base font-bold text-green-400">{user.contacts}</div>
                <div className="text-[10px] md:text-xs text-slate-400">контакты</div>
              </div>
              <div className="text-center">
                <div className="text-sm md:text-base font-bold text-orange-400">{user.approaches}</div>
                <div className="text-[10px] md:text-xs text-slate-400">подходы</div>
              </div>
            </div>
            <Icon 
              name={isExpanded ? "ChevronUp" : "ChevronDown"} 
              size={18} 
              className="text-slate-400 md:w-5 md:h-5 flex-shrink-0"
            />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4 pt-0 space-y-2 sm:space-y-3">
          <div className="border-t border-slate-700 pt-2 sm:pt-3 space-y-2">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-100 mb-2">Место работы</div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Место работы"
                  value={comments[user.name]?.location || ''}
                  onChange={(e) => onCommentChange(user.name, 'location', e.target.value)}
                  onBlur={(e) => onCommentBlur(user.name, 'location', e.target.value)}
                  className="flex-1 text-xs sm:text-sm bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500"
                  disabled={savingComment === user.name}
                />
                {savingComment === user.name && (
                  <Icon name="Loader2" size={16} className="animate-spin text-cyan-400 flex-shrink-0" />
                )}
                {!savingComment && comments[user.name]?.location && (
                  <Icon name="MapPin" size={16} className="text-green-400 flex-shrink-0" />
                )}
              </div>
            </div>
            
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-100 mb-2">Листовки</div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Листовки"
                  value={comments[user.name]?.flyers || ''}
                  onChange={(e) => onCommentChange(user.name, 'flyers', e.target.value)}
                  onBlur={(e) => onCommentBlur(user.name, 'flyers', e.target.value)}
                  className="flex-1 text-xs sm:text-sm bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500"
                  disabled={savingComment === user.name}
                />
                {savingComment === user.name && (
                  <Icon name="Loader2" size={16} className="animate-spin text-cyan-400 flex-shrink-0" />
                )}
                {!savingComment && comments[user.name]?.flyers && (
                  <Icon name="FileText" size={16} className="text-cyan-400 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          {user.organizations && user.organizations.length > 0 && (
            <div className="border-t border-slate-700 pt-2 sm:pt-3">
              <div className="text-xs sm:text-sm font-semibold text-slate-100 mb-2">Статистика по организациям</div>
              <div className="space-y-2">
                {user.organizations.map((org) => (
                  <div key={org.name} className="bg-slate-900 border border-slate-700 rounded-lg p-2 sm:p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-slate-100 text-xs sm:text-sm truncate flex-1">
                        {org.name}
                      </div>
                      <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-xs sm:text-sm font-bold text-green-400">{org.contacts}</div>
                          <div className="text-[9px] sm:text-[10px] text-slate-400">контакты</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs sm:text-sm font-bold text-orange-400">{org.approaches}</div>
                          <div className="text-[9px] sm:text-[10px] text-slate-400">подходы</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {userLeads.length > 0 && (
            <div className="border-t border-slate-700 pt-2 sm:pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs sm:text-sm font-semibold text-slate-100">Детали по лидам</div>
                <Button
                  onClick={() => onExpandLeads(user.name)}
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-7 px-2"
                >
                  <Icon name="Maximize2" size={12} className="mr-1" />
                  Развернуть
                </Button>
              </div>
              <div className="text-xs text-slate-400">
                Всего лидов: {userLeads.length}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
