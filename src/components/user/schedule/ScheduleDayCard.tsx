import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface TimeSlot {
  label: string;
  time: string;
  selected: boolean;
}

interface DaySchedule {
  date: string;
  dayName: string;
  dayNameFull: string;
  isWeekend: boolean;
  slots: TimeSlot[];
}

interface WorkShift {
  date: string;
  start_time: string;
  end_time: string;
  organization_name: string;
  organization_id: number;
}

interface WorkComment {
  location?: string;
  flyers?: string;
  organization?: string;
  location_type?: string;
  location_details?: string;
}

interface ScheduleDayCardProps {
  day: DaySchedule;
  dayIndex: number;
  workShifts: WorkShift[];
  workComment?: WorkComment;
  onToggleSlot: (dayIndex: number, slotIndex: number) => void;
  isUkrainian: boolean;
}

export default function ScheduleDayCard({
  day,
  dayIndex,
  workShifts,
  workComment,
  onToggleSlot,
  isUkrainian
}: ScheduleDayCardProps) {
  const dayShifts = workShifts.filter(shift => shift.date === day.date);
  const hasSelectedSlots = day.slots.some(slot => slot.selected);

  return (
    <Card 
      className={`border-2 ${day.isWeekend ? 'border-orange-200 bg-orange-50/30' : 'border-blue-200 bg-blue-50/30'}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${day.isWeekend ? 'bg-orange-500' : 'bg-[#001f54]'} text-white flex flex-col items-center justify-center font-bold`}>
              <span className="text-[10px] md:text-xs">{day.dayName}</span>
              <span className="text-sm md:text-lg">{new Date(day.date).getDate()}.{(new Date(day.date).getMonth() + 1).toString().padStart(2, '0')}</span>
            </div>
            <div>
              <p className="text-sm md:text-base font-semibold text-gray-800">
                {day.dayNameFull}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500">{day.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {day.slots.map((slot, slotIndex) => (
              <Button
                key={slot.time}
                onClick={() => onToggleSlot(dayIndex, slotIndex)}
                variant={slot.selected ? 'default' : 'outline'}
                className={`text-xs md:text-sm transition-all duration-300 ${
                  slot.selected
                    ? day.isWeekend
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-[#001f54] hover:bg-[#002b6b] text-white'
                    : 'border-2 hover:border-[#001f54] hover:bg-gray-50'
                }`}
                size="sm"
              >
                <Icon name="Clock" size={14} className="mr-1 md:mr-2" />
                {slot.label}
              </Button>
            ))}
          </div>

          {dayShifts.length > 0 && (
            <div className="mt-2 space-y-2">
              {dayShifts.map((shift, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-green-50 border-2 border-green-300 rounded-lg p-2.5">
                  <Icon name="Briefcase" size={16} className="text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-green-600 text-white text-[10px] px-2 py-0.5">
                        {isUkrainian ? 'Від адміна' : 'От админа'}
                      </Badge>
                      <span className="text-xs font-bold text-green-900">{shift.organization_name}</span>
                    </div>
                    <p className="text-[10px] text-green-700 mt-0.5">
                      <Icon name="Clock" size={10} className="inline mr-1" />
                      {new Date(shift.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {workComment && hasSelectedSlots && (
            <div className="mt-2 space-y-2">
              {workComment.organization && (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg p-2">
                  <Icon name="Building2" size={14} className="text-purple-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-purple-600 font-medium">{isUkrainian ? 'Організація:' : 'Организация:'}</span>
                    <span className="text-xs text-purple-900 font-medium ml-1">{workComment.organization}</span>
                  </div>
                </div>
              )}
              {workComment.location_type && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <Icon name="MapPin" size={14} className="text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-blue-600 font-medium">{isUkrainian ? 'Тип місця:' : 'Тип места:'}</span>
                    <span className="text-xs text-blue-900 font-medium ml-1">{workComment.location_type}</span>
                  </div>
                </div>
              )}
              {workComment.location_details && (
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                  <Icon name="Navigation" size={14} className="text-indigo-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-indigo-600 font-medium">{isUkrainian ? 'Адреса:' : 'Адрес:'}</span>
                    <span className="text-xs text-indigo-900 font-medium ml-1">{workComment.location_details}</span>
                  </div>
                </div>
              )}
              {workComment.flyers && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <Icon name="FileText" size={14} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-amber-600 font-medium">{isUkrainian ? 'Листівки:' : 'Листовки:'}</span>
                    <span className="text-xs text-amber-900 font-medium ml-1">{workComment.flyers}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
