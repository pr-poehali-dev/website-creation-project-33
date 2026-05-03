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
    'контакт': 'bg-blue-50 text-blue-500',
    'подход': 'bg-amber-50 text-amber-500',
    'продажа': 'bg-green-50 text-green-500',
    'отказ': 'bg-red-50 text-red-500'
  };
  return colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-500';
};

const getTypeBadge = (type: string) => {
  const colors = {
    'контакт': 'bg-blue-50 border-blue-100 text-blue-600',
    'подход': 'bg-amber-50 border-amber-100 text-amber-600',
    'продажа': 'bg-green-50 border-green-100 text-green-600',
    'отказ': 'bg-red-50 border-red-100 text-red-600'
  };
  return colors[type as keyof typeof colors] || 'bg-gray-50 border-gray-100 text-gray-600';
};

export default function LeadCard({ lead, isDuplicate, onDeleteLead }: LeadCardProps) {
  const typeIcon = getTypeIcon(lead.lead_type);
  const typeColor = getTypeColor(lead.lead_type);
  const typeBadge = getTypeBadge(lead.lead_type);
  
  return (
    <div 
      className={`border rounded-xl p-3 md:p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 ${
        isDuplicate ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl ${typeColor} flex items-center justify-center flex-shrink-0`}>
            <Icon name={typeIcon} size={16} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-gray-700 text-sm md:text-base font-medium mb-1">
              {formatMoscowTime(lead.created_at, 'datetime')}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs md:text-sm font-medium ${typeBadge}`}>
                <Icon name={typeIcon} size={14} />
                {lead.lead_type}
              </div>
              {lead.organization_name && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs md:text-sm font-medium text-gray-600">
                  <Icon name="Building2" size={14} />
                  {lead.organization_name}
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDeleteLead}
          className="h-8 w-8 md:h-9 md:w-9 p-0 hover:bg-red-50 text-red-400 transition-all duration-200 flex-shrink-0"
          title="Удалить метрики лида"
        >
          <Icon name="Trash2" size={16} />
        </Button>
      </div>
    </div>
  );
}