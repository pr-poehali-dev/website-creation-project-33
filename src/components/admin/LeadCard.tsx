import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AudioPlayer from './AudioPlayer';
import { Lead } from './types';

interface LeadCardProps {
  lead: Lead;
  isDuplicate: boolean;
  onDeleteLead: () => void;
}

export default function LeadCard({ lead, isDuplicate, onDeleteLead }: LeadCardProps) {
  return (
    <div 
      className={`border-2 rounded-lg p-3 md:p-4 shadow-md hover:shadow-lg transition-all duration-300 ${
        isDuplicate 
          ? 'border-amber-400 bg-amber-50' 
          : 'border-[#001f54]/10 bg-white'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-3">
        <div className="p-2 rounded-lg bg-[#001f54]/10 flex-shrink-0 self-start">
          <Icon name="MessageSquare" size={14} className="text-[#001f54] md:w-4 md:h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
            <div className="text-[#001f54]/70 text-xs md:text-sm font-medium">
              {new Date(lead.created_at).toLocaleString('ru-RU')}
            </div>
            <div className="flex items-center gap-1 self-start sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteLead}
                className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-red-50 text-red-600 transition-all duration-300"
                title="Удалить лид"
              >
                <Icon name="Trash2" size={12} className="md:w-[14px] md:h-[14px]" />
              </Button>
            </div>
          </div>
          
          {lead.notes && (
            <div className={`border-2 rounded-lg p-2 md:p-3 mb-3 relative ${
              isDuplicate 
                ? 'border-amber-300 bg-amber-100/50' 
                : 'border-[#001f54]/10 bg-[#001f54]/5'
            }`}>
              {isDuplicate && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  <Icon name="AlertTriangle" size={10} />
                  Дубль
                </div>
              )}
              <div className="text-[#001f54] whitespace-pre-wrap text-sm md:text-base">
                {lead.notes}
              </div>
            </div>
          )}
          
          {lead.has_audio && (
            <AudioPlayer 
              audioData={lead.audio_data}
              leadId={lead.id}
              className="mb-2"
            />
          )}
        </div>
      </div>
    </div>
  );
}