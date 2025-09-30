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

const getResultColor = (result: string) => {
  const colors = {
    'положительный': 'border-green-300 bg-green-50',
    'нейтральный': 'border-gray-300 bg-gray-50',
    'отрицательный': 'border-red-300 bg-red-50'
  };
  return colors[result as keyof typeof colors] || 'border-gray-300 bg-gray-50';
};

export default function LeadCard({ lead, isDuplicate, onDeleteLead }: LeadCardProps) {
  const typeIcon = getTypeIcon(lead.lead_type);
  const typeColor = getTypeColor(lead.lead_type);
  const resultColor = getResultColor(lead.lead_result);
  
  return (
    <div 
      className={`border-2 rounded-lg p-3 md:p-4 shadow-md hover:shadow-lg transition-all duration-300 ${resultColor}`}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-3">
        <div className={`p-2 rounded-lg ${typeColor} flex-shrink-0 self-start`}>
          <Icon name={typeIcon} size={14} className="text-white md:w-4 md:h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
            <div className="text-[#001f54]/70 text-xs md:text-sm font-medium">
              {formatMoscowTime(lead.created_at, 'datetime')}
            </div>
            <div className="flex items-center gap-1 self-start sm:self-auto">
              {lead.telegram_message_id && (
                <a
                  href={`https://t.me/c/5215501225/${lead.telegram_message_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
                  title="Открыть в Telegram"
                >
                  <Icon name="MessageCircle" size={12} />
                  Telegram
                </a>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteLead}
                className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-red-50 text-red-600 transition-all duration-300"
                title="Удалить метрики лида"
              >
                <Icon name="Trash2" size={12} className="md:w-[14px] md:h-[14px]" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#001f54]/20 rounded-full text-sm font-medium text-[#001f54]">
              <Icon name={typeIcon} size={14} />
              {lead.lead_type}
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#001f54]/20 rounded-full text-sm font-medium text-[#001f54]">
              {lead.lead_result === 'положительный' && <Icon name="CheckCircle" size={14} className="text-green-500" />}
              {lead.lead_result === 'нейтральный' && <Icon name="Minus" size={14} className="text-gray-500" />}
              {lead.lead_result === 'отрицательный' && <Icon name="XCircle" size={14} className="text-red-500" />}
              {lead.lead_result}
            </div>
          </div>
          
          <div className="mt-3 text-xs text-[#001f54]/60">
            💡 Полный текст и аудио в Telegram
          </div>
        </div>
      </div>
    </div>
  );
}