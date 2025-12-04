import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';

interface ShiftDetail {
  date: string;
  contacts: number;
}

interface PromoterShiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoterName: string;
  organizationName: string;
  totalContacts: number;
  timeRange: 'week' | 'month' | 'year';
  selectedWeekIndex?: number;
  selectedMonthIndex?: number;
  selectedYear?: number;
}

export default function PromoterShiftsModal({
  isOpen,
  onClose,
  promoterName,
  organizationName,
  totalContacts,
  timeRange,
  selectedWeekIndex,
  selectedMonthIndex,
  selectedYear
}: PromoterShiftsModalProps) {
  const [shifts, setShifts] = useState<ShiftDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchShiftDetails = async () => {
      setLoading(true);
      try {
        const sessionToken = localStorage.getItem('session_token');
        const baseUrl = 'https://functions.poehali.dev/api/admin-promoter-shifts';
        
        const params = new URLSearchParams({
          promoter_name: promoterName,
          organization_name: organizationName,
          time_range: timeRange
        });

        if (timeRange === 'week' && selectedWeekIndex !== undefined) {
          params.append('week_index', selectedWeekIndex.toString());
        }
        if (timeRange === 'month' && selectedMonthIndex !== undefined) {
          params.append('month_index', selectedMonthIndex.toString());
        }
        if (timeRange === 'year' && selectedYear !== undefined) {
          params.append('year', selectedYear.toString());
        }

        const response = await fetch(`${baseUrl}?${params}`, {
          headers: {
            'X-Session-Token': sessionToken || ''
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch shift details');
        }

        const data = await response.json();
        setShifts(data.shifts || []);
      } catch (error) {
        console.error('Error fetching shift details:', error);
        setShifts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShiftDetails();
  }, [isOpen, promoterName, organizationName, timeRange, selectedWeekIndex, selectedMonthIndex, selectedYear]);

  if (!isOpen) return null;

  const averageContacts = shifts.length > 0 
    ? Math.round(totalContacts / shifts.length) 
    : 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl bg-slate-900 border-slate-700 shadow-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-gradient-to-r from-cyan-600 to-blue-600 p-6 border-b border-slate-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-white/10">
                  <Icon name="User" size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">{promoterName}</h2>
              </div>
              <p className="text-cyan-100 text-sm">{organizationName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Icon name="X" size={24} className="text-white" />
            </button>
          </div>
        </div>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="text-center py-12">
              <Icon name="Loader2" size={32} className="animate-spin text-cyan-400 mx-auto mb-4" />
              <p className="text-slate-300">Загрузка смен...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {shifts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Icon name="CalendarX" size={48} className="mx-auto mb-3 text-slate-600" />
                    <p>Нет данных о сменах</p>
                  </div>
                ) : (
                  shifts.map((shift, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700">
                          <Icon name="Calendar" size={18} className="text-cyan-400" />
                        </div>
                        <span className="text-slate-200 font-medium">
                          {new Date(shift.date).toLocaleDateString('ru-RU', { 
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            weekday: 'short'
                          })}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-cyan-400">
                          {shift.contacts}
                        </div>
                        <div className="text-xs text-slate-400">контактов</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-700 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="TrendingUp" size={18} className="text-green-400" />
                      <span className="text-sm text-slate-300">Всего контактов</span>
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                      {totalContacts}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="BarChart3" size={18} className="text-blue-400" />
                      <span className="text-sm text-slate-300">Средний показатель</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-400">
                      {averageContacts}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
