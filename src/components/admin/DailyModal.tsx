import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { UserStats } from './types';
import OrganizationsStatsSection from './daily-modal/OrganizationsStatsSection';
import PromoterCard from './daily-modal/PromoterCard';
import LeadsDetailModal from './daily-modal/LeadsDetailModal';

interface DetailedLead {
  user_name: string;
  lead_type: string;
  organization: string;
  created_at: string;
}

interface DailyModalProps {
  selectedDate: string | null;
  dailyUserStats: UserStats[];
  detailedLeads: DetailedLead[];
  dailyLoading: boolean;
  onClose: () => void;
}

export default function DailyModal({ 
  selectedDate, 
  dailyUserStats,
  detailedLeads = [],
  dailyLoading, 
  onClose 
}: DailyModalProps) {
  const [expandedUser, setExpandedUser] = React.useState<string | null>(null);
  const [comments, setComments] = React.useState<Record<string, {location?: string, flyers?: string}>>({});
  const [savingComment, setSavingComment] = React.useState<string | null>(null);
  const [leadsModalUser, setLeadsModalUser] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (selectedDate) {
      fetchComments();
    }
  }, [selectedDate]);

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2?work_date=${selectedDate}`
      );
      const data = await response.json();
      setComments(data.comments || {});
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const saveComment = async (userName: string, field: 'location' | 'flyers', value: string) => {
    setSavingComment(userName);
    
    const currentData = comments[userName] || {};
    const updatedData = {
      location_comment: field === 'location' ? value : (currentData.location || ''),
      flyers_comment: field === 'flyers' ? value : (currentData.flyers || '')
    };
    
    try {
      const response = await fetch(
        'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: userName,
            work_date: selectedDate,
            ...updatedData
          })
        }
      );
      
      if (response.ok) {
        setComments(prev => ({ 
          ...prev, 
          [userName]: {
            location: updatedData.location_comment,
            flyers: updatedData.flyers_comment
          }
        }));
      }
    } catch (error) {
      console.error('Error saving comment:', error);
    } finally {
      setSavingComment(null);
    }
  };

  if (!selectedDate) {
    return null;
  }

  const toggleUser = (userName: string) => {
    setExpandedUser(expandedUser === userName ? null : userName);
  };

  const getUserLeads = (userName: string) => {
    return detailedLeads.filter(lead => lead.user_name === userName);
  };

  const handleCommentChange = (userName: string, field: 'location' | 'flyers', value: string) => {
    setComments(prev => ({ 
      ...prev, 
      [userName]: { 
        ...prev[userName], 
        [field]: value 
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85dvh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                Статистика за {new Intl.DateTimeFormat('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'Europe/Moscow'
                }).format(new Date(selectedDate))}
              </h3>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 text-gray-400 flex-shrink-0"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto flex-1 bg-gray-50" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          {dailyLoading ? (
            <div className="text-center text-gray-400 flex items-center justify-center gap-3 py-8">
              <Icon name="Loader2" size={20} className="animate-spin sm:w-6 sm:h-6 text-blue-400" />
              <span className="text-sm sm:text-base">Загрузка статистики...</span>
            </div>
          ) : dailyUserStats.length > 0 ? (
            <OrganizationsStatsSection 
              dailyUserStats={dailyUserStats}
            />
          ) : (
            <div className="text-center text-gray-400 py-8">
              <Icon name="Users" size={32} className="mx-auto mb-3 opacity-40 text-gray-400" />
              <div className="text-lg font-medium text-gray-600">Нет данных</div>
              <div className="text-sm">В этот день лиды не отправлялись</div>
            </div>
          )}
        </div>
      </div>

      {leadsModalUser && (
        <LeadsDetailModal
          userName={leadsModalUser}
          userLeads={getUserLeads(leadsModalUser)}
          onClose={() => setLeadsModalUser(null)}
        />
      )}
    </div>
  );
}