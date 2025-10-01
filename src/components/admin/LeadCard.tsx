import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Lead } from './types';
import { formatMoscowTime } from '@/utils/timeFormat';

interface LeadCardProps {
  lead: Lead;
  isDuplicate: boolean;
  onDeleteLead: () => void;
}

const getTypeIcon = (type: string) => {
  const icons = {
    'контакт': 'Phone',
    'подход': 'User',
    'продажа': 'DollarSign',
    'отказ': 'X'
  };
  return icons[type as keyof typeof icons] || 'MessageSquare';
};

const getTypeColor = (type: string) => {
  const colors = {
    'контакт': 'bg-blue-500',
    'подход': 'bg-yellow-500',
    'продажа': 'bg-green-500',
    'отказ': 'bg-red-500'
  };
  return colors[type as keyof typeof colors] || 'bg-gray-500';
};

export default function LeadCard({ lead, isDuplicate, onDeleteLead }: LeadCardProps) {
  const typeIcon = getTypeIcon(lead.lead_type);
  const typeColor = getTypeColor(lead.lead_type);
  
  return (
    <div 
      className="border-2 border-gray-200 rounded-lg p-3 md:p-4 shadow-md hover:shadow-lg transition-all duration-300 bg-white"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${typeColor} flex-shrink-0`}>
            <Icon name={typeIcon} size={16} className="text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-[#001f54] text-sm md:text-base font-medium mb-1">
              {formatMoscowTime(lead.created_at, 'datetime')}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs md:text-sm font-medium text-[#001f54]">
              <Icon name={typeIcon} size={14} />
              {lead.lead_type}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDeleteLead}
          className="h-8 w-8 md:h-9 md:w-9 p-0 hover:bg-red-50 text-red-600 transition-all duration-300 flex-shrink-0"
          title="Удалить метрики лида"
        >
          <Icon name="Trash2" size={16} />
        </Button>
      </div>
    </div>
  );
}