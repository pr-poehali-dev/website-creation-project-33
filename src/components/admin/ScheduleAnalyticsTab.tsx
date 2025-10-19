import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { UserSchedule, DaySchedule, DeleteSlotState, ConfirmDeleteState, DayStats } from './schedule/types';
import { getAllWeeksUntilEndOfYear, initializeWeekDays } from './schedule/utils';
import ScheduleHeader from './schedule/ScheduleHeader';
import TeamScheduleView from './schedule/TeamScheduleView';
import IndividualScheduleView from './schedule/IndividualScheduleView';
import DeleteConfirmDialog from './schedule/DeleteConfirmDialog';

export default function ScheduleAnalyticsTab() {
  const weeks = getAllWeeksUntilEndOfYear();
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [view, setView] = useState<'team' | 'individual'>('team');
  const [schedules, setSchedules] = useState<UserSchedule[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [weekDays, setWeekDays] = useState<DaySchedule[]>([]);
  const [deletingSlot, setDeletingSlot] = useState<DeleteSlotState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null);
  const [dayStats, setDayStats] = useState<DayStats[]>([]);

  useEffect(() => {
    const days = initializeWeekDays(weeks[currentWeekIndex].start);
    setWeekDays(days);
    if (view === 'team') {
      loadAllSchedules(days);
    }
  }, [view, currentWeekIndex]);

  const enrichSchedulesWithStats = async (schedules: UserSchedule[]) => {
    try {
      const response = await fetch('https://functions.poehali.dev/1bee9f5e-8c1a-4353-aa1b-726199b50b62', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_token') || '',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const statsMap = new Map(data.stats?.map((s: any) => [s.user_id, s.avg_contacts_per_day]) || []);
        
        return schedules.map(schedule => ({
          ...schedule,
          avg_contacts_per_day: statsMap.get(schedule.user_id) || 0
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    return schedules;
  };

  const calculateDayStats = (schedules: UserSchedule[], days: DaySchedule[]) => {
    const stats: DayStats[] = days.map(day => {
      let expected = 0;

      day.slots.forEach(slot => {
        const workers = schedules.filter(user => 
          user.schedule[day.date] && user.schedule[day.date][slot.time]
        );
        
        workers.forEach(worker => {
          expected += worker.avg_contacts_per_day || 0;
        });
      });

      return {
        date: day.date,
        expected: Math.round(expected),
        actual: 0
      };
    });

    setDayStats(stats);
    if (stats.length > 0) {
      loadActualStats(stats);
    }
  };

  const loadActualStats = async (stats: DayStats[]) => {
    try {
      const response = await fetch('https://functions.poehali.dev/1bee9f5e-8c1a-4353-aa1b-726199b50b62', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
        body: JSON.stringify({
          dates: stats.map(s => s.date)
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedStats = stats.map(stat => {
          const actualData = data.actual?.find((a: any) => a.date === stat.date);
          return {
            ...stat,
            actual: actualData?.count || 0
          };
        });
        setDayStats(updatedStats);
      }
    } catch (error) {
      console.error('Error loading actual stats:', error);
    }
  };

  const loadAllSchedules = async (days: DaySchedule[]) => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/13a21013-236c-4e06-a825-ee3679b130c2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
        body: JSON.stringify({
          week_start_date: weeks[currentWeekIndex].start
        })
      });

      if (response.ok) {
        const data = await response.json();
        const schedulesWithStats = await enrichSchedulesWithStats(data.schedules || []);
        setSchedules(schedulesWithStats);
        calculateDayStats(schedulesWithStats, days);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsersWorkingOnSlot = (date: string, slotTime: string) => {
    return schedules.filter(user => 
      user.schedule[date] && user.schedule[date][slotTime]
    );
  };

  const confirmRemoveSlot = (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => {
    setConfirmDelete({userId, userName, date, slot: slotTime, slotLabel});
  };

  const removeSlot = async () => {
    if (!confirmDelete) return;
    
    const {userId, date, slot: slotTime} = confirmDelete;
    setDeletingSlot({userId, date, slot: slotTime});
    setConfirmDelete(null);
    
    try {
      const userSchedule = schedules.find(s => s.user_id === userId);
      if (!userSchedule) return;

      const updatedSchedule = { ...userSchedule.schedule };
      if (updatedSchedule[date]) {
        updatedSchedule[date] = {
          ...updatedSchedule[date],
          [slotTime]: false
        };
      }

      const response = await fetch('https://functions.poehali.dev/13a21013-236c-4e06-a825-ee3679b130c2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
        body: JSON.stringify({
          user_id: userId,
          week_start_date: weeks[currentWeekIndex].start,
          schedule: updatedSchedule
        })
      });

      if (response.ok) {
        await loadAllSchedules(weekDays);
      }
    } catch (error) {
      console.error('Error removing slot:', error);
    } finally {
      setDeletingSlot(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-2 border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <ScheduleHeader
            view={view}
            setView={setView}
            currentWeekIndex={currentWeekIndex}
            setCurrentWeekIndex={setCurrentWeekIndex}
            weeks={weeks}
            loading={loading}
          />

          {view === 'team' && (
            <TeamScheduleView
              weekDays={weekDays}
              schedules={schedules}
              getUsersWorkingOnSlot={getUsersWorkingOnSlot}
              confirmRemoveSlot={confirmRemoveSlot}
              deletingSlot={deletingSlot}
              dayStats={dayStats}
            />
          )}

          {view === 'individual' && (
            <IndividualScheduleView
              schedules={schedules}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              weekDays={weekDays}
              confirmRemoveSlot={confirmRemoveSlot}
              deletingSlot={deletingSlot}
            />
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        removeSlot={removeSlot}
      />
    </div>
  );
}