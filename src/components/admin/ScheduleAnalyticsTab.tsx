import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { UserSchedule, DaySchedule, DeleteSlotState, ConfirmDeleteState, DayStats } from './schedule/types';
import { getAllWeeksUntilEndOfYear, initializeWeekDays, getCurrentWeekIndex } from './schedule/utils';
import ScheduleHeader from './schedule/ScheduleHeader';
import TeamScheduleView from './schedule/TeamScheduleView';
import IndividualScheduleView from './schedule/IndividualScheduleView';
import DeleteConfirmDialog from './schedule/DeleteConfirmDialog';
import AddShiftModal from './AddShiftModal';

export default function ScheduleAnalyticsTab() {
  const weeks = getAllWeeksUntilEndOfYear();
  const [currentWeekIndex, setCurrentWeekIndex] = useState(getCurrentWeekIndex());
  const [view, setView] = useState<'team' | 'individual'>('team');
  const [schedules, setSchedules] = useState<UserSchedule[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [weekDays, setWeekDays] = useState<DaySchedule[]>([]);
  const [deletingSlot, setDeletingSlot] = useState<DeleteSlotState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null);
  const [dayStats, setDayStats] = useState<DayStats[]>([]);
  const [addingSlot, setAddingSlot] = useState<DeleteSlotState | null>(null);
  const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);

  useEffect(() => {
    const days = initializeWeekDays(weeks[currentWeekIndex].start);
    setWeekDays(days);
    if (view === 'team') {
      loadAllSchedules(days);
    }
  }, [view, currentWeekIndex]);

  // Удалено: статистика теперь приходит сразу из schedules API

  const calculateDayStats = (schedules: UserSchedule[], days: DaySchedule[], actualContactsMap: Record<string, number>) => {
    const stats: DayStats[] = days.map(day => {
      const uniqueWorkers = new Set<number>();

      day.slots.forEach(slot => {
        const workers = schedules.filter(user => 
          user.schedule[day.date] && user.schedule[day.date][slot.time]
        );
        
        workers.forEach(worker => {
          uniqueWorkers.add(worker.user_id);
        });
      });

      const expected = Array.from(uniqueWorkers).reduce((sum, userId) => {
        const worker = schedules.find(s => s.user_id === userId);
        return sum + (worker?.avg_per_shift || 0);
      }, 0);

      return {
        date: day.date,
        expected: Math.round(expected),
        actual: actualContactsMap[day.date] || 0
      };
    });

    setDayStats(stats);
  };

  // Удалено: фактические контакты теперь приходят из schedules API

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
        // Статистика avg_per_shift и actual_contacts теперь приходят сразу
        setSchedules(data.schedules || []);
        calculateDayStats(data.schedules || [], days, data.actual_contacts || {});
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

  const addSlot = async (userId: number, date: string, slotTime: string) => {
    setAddingSlot({userId, date, slot: slotTime});
    
    try {
      const userSchedule = schedules.find(s => s.user_id === userId);
      if (!userSchedule) return;

      const updatedSchedule = { ...userSchedule.schedule };
      if (!updatedSchedule[date]) {
        updatedSchedule[date] = {};
      }
      updatedSchedule[date] = {
        ...updatedSchedule[date],
        [slotTime]: true
      };

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
      console.error('Error adding slot:', error);
    } finally {
      setAddingSlot(null);
    }
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
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 rounded-xl md:rounded-2xl shadow-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-slate-300 flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
            <Icon name="Loader2" size={20} className="animate-spin text-cyan-400 md:w-6 md:h-6" />
            Загрузка данных...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 rounded-xl md:rounded-2xl shadow-2xl">
        <CardContent className="p-3 md:p-6">
          <ScheduleHeader
            view={view}
            setView={setView}
            currentWeekIndex={currentWeekIndex}
            setCurrentWeekIndex={setCurrentWeekIndex}
            weeks={weeks}
            loading={loading}
            onOpenAddShift={() => setAddShiftModalOpen(true)}
          />

          {view === 'team' && (
            <TeamScheduleView
              weekDays={weekDays}
              schedules={schedules}
              getUsersWorkingOnSlot={getUsersWorkingOnSlot}
              confirmRemoveSlot={confirmRemoveSlot}
              deletingSlot={deletingSlot}
              dayStats={dayStats}
              addSlot={addSlot}
              addingSlot={addingSlot}
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

      <AddShiftModal
        isOpen={addShiftModalOpen}
        onClose={() => setAddShiftModalOpen(false)}
        userStats={schedules.map(s => ({ name: s.first_name + ' ' + s.last_name, id: s.user_id }))}
        onShiftAdded={() => loadAllSchedules(weekDays)}
      />
    </div>
  );
}