import React from 'react';
import Icon from '@/components/ui/icon';

interface WorkTimeData {
  date: string;
  startTime: string;
  endTime: string;
  hoursWorked: string;
  leadsCount: number;
}

interface WorkTimeCardProps {
  workTimeData: WorkTimeData[];
}

export default function WorkTimeCard({ workTimeData }: WorkTimeCardProps) {
  if (workTimeData.length === 0) {
    return null;
  }

  return (
    <div className="border-2 border-[#001f54]/10 rounded-lg p-4 bg-[#001f54]/5 space-y-3">
      <div className="flex items-center gap-2 text-[#001f54] font-semibold text-base">
        <Icon name="Clock" size={18} />
        Время работы
      </div>
      
      <div className="space-y-2">
        {workTimeData.map((data, index) => (
          <div 
            key={index} 
            className="bg-white/50 rounded-lg p-3 border border-[#001f54]/10"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name="Calendar" size={14} className="text-[#001f54]/70" />
                <span className="font-medium text-[#001f54] text-sm">{data.date}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#001f54]/70">
                <Icon name="MessageSquare" size={12} />
                <span>{data.leadsCount} лидов</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-[#001f54]/60 text-xs mb-1">Начало</span>
                <div className="flex items-center gap-1.5 text-[#001f54] font-medium">
                  <Icon name="LogIn" size={14} className="text-green-600" />
                  <span>{data.startTime}</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-[#001f54]/60 text-xs mb-1">Окончание</span>
                <div className="flex items-center gap-1.5 text-[#001f54] font-medium">
                  <Icon name="LogOut" size={14} className="text-red-600" />
                  <span>{data.endTime}</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-[#001f54]/60 text-xs mb-1">Отработано</span>
                <div className="flex items-center gap-1.5 text-[#001f54] font-bold">
                  <Icon name="Timer" size={14} className="text-blue-600" />
                  <span>{data.hoursWorked}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
