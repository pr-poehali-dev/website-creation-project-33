import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { formatMoscowDate } from '@/utils/date';

interface DetailedLead {
  user_name: string;
  lead_type: string;
  organization: string;
  created_at: string;
}

interface LeadsDetailModalProps {
  userName: string;
  userLeads: DetailedLead[];
  onClose: () => void;
}

export default function LeadsDetailModal({
  userName,
  userLeads,
  onClose
}: LeadsDetailModalProps) {
  const getTypeColor = (type: string) => {
    return type === 'контакт' ? 'text-green-400 bg-green-500/20 border-green-500/30' : 'text-orange-400 bg-orange-500/20 border-orange-500/30';
  };

  const getTypeIcon = (type: string) => {
    return type === 'контакт' ? 'Phone' : 'Users';
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl border-2 border-cyan-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100">
            Детали лидов: {userName}
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-slate-700 text-slate-300"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="space-y-2">
            {userLeads.map((lead, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getTypeColor(lead.lead_type)} text-xs border`}>
                        <Icon name={getTypeIcon(lead.lead_type)} size={12} className="mr-1" />
                        {lead.lead_type}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-100 font-medium">
                      {lead.organization}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatMoscowDate(lead.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
