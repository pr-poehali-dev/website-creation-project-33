import { useState, useEffect } from 'react';
import { PlannedOrganization, STORAGE_KEY } from './types';
import { getInitialPlans, getMoscowDate, getWeekDates, getWeekLabel } from './utils';
import WeekNavigation from './WeekNavigation';
import WeekCalendarGrid from './WeekCalendarGrid';
import AddOrganizationForm from './AddOrganizationForm';
import DailyHourlyView from './DailyHourlyView';
import HourlyPlanModal from './HourlyPlanModal';

export default function PlanningSection() {
  const [plans, setPlans] = useState<PlannedOrganization[]>(getInitialPlans);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showingHourlyFor, setShowingHourlyFor] = useState<string | null>(null);
  const [addOrgMode, setAddOrgMode] = useState(false);
  const [newOrg, setNewOrg] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingPlan, setEditingPlan] = useState<PlannedOrganization | null>(null);
  const [renamingPlanId, setRenamingPlanId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameNotesValue, setRenameNotesValue] = useState('');
  const weekDates = getWeekDates(weekOffset);
  const todayStr = getMoscowDate();
  
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch (error) {
      console.error('Failed to save plans:', error);
    }
  }, [plans]);

  const addPlan = () => {
    if (!selectedDate || !newOrg.trim()) return;
    
    const newPlan: PlannedOrganization = {
      id: Date.now(),
      organization: newOrg,
      date: selectedDate,
      notes: newNotes.trim() || undefined
    };
    
    setPlans([...plans, newPlan]);
    setNewOrg('');
    setNewNotes('');
    setSelectedDate(null);
  };

  const deletePlan = (id: number) => {
    setPlans(plans.filter(p => p.id !== id));
  };
  
  const startRename = (plan: PlannedOrganization) => {
    setRenamingPlanId(plan.id);
    setRenameValue(plan.organization);
    setRenameNotesValue(plan.notes || '');
  };
  
  const saveRename = (id: number) => {
    if (!renameValue.trim()) return;
    setPlans(plans.map(p => p.id === id ? { 
      ...p, 
      organization: renameValue.trim(),
      notes: renameNotesValue.trim() || undefined
    } : p));
    setRenamingPlanId(null);
    setRenameValue('');
    setRenameNotesValue('');
  };
  
  const cancelRename = () => {
    setRenamingPlanId(null);
    setRenameValue('');
    setRenameNotesValue('');
  };
  
  const updateHourlyNote = (hour: string, note: string) => {
    if (!editingPlan) return;
    
    const existingNotes = editingPlan.hourlyNotes || [];
    const updatedNotes = existingNotes.filter(n => n.hour !== hour);
    
    if (note.trim()) {
      updatedNotes.push({ hour, note });
    }
    
    const updatedPlan = { ...editingPlan, hourlyNotes: updatedNotes };
    setEditingPlan(updatedPlan);
    setPlans(plans.map(p => p.id === editingPlan.id ? updatedPlan : p));
  };
  
  const getHourlyNote = (hour: string): string => {
    if (!editingPlan?.hourlyNotes) return '';
    const note = editingPlan.hourlyNotes.find(n => n.hour === hour);
    return note?.note || '';
  };

  const handleDateClick = (date: string, dayPlans: PlannedOrganization[]) => {
    setShowingHourlyFor(date);
  };

  const handleAddOrgClick = (date: string) => {
    setSelectedDate(date);
    setAddOrgMode(true);
  };

  const handlePlanClick = (plan: PlannedOrganization, date: string) => {
    setShowingHourlyFor(date);
    setEditingPlan(plan);
  };

  const handleAddFormSubmit = () => {
    addPlan();
    setAddOrgMode(false);
  };

  const handleAddFormCancel = () => {
    setSelectedDate(null);
    setAddOrgMode(false);
    setNewOrg('');
    setNewNotes('');
  };

  const handleModalClose = () => {
    setEditingPlan(null);
    setShowingHourlyFor(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg md:text-xl font-semibold text-gray-700">Планирование на неделю</h3>
      </div>

      <WeekNavigation
        weekOffset={weekOffset}
        weekLabel={getWeekLabel(weekDates)}
        onPrevious={() => setWeekOffset(weekOffset - 1)}
        onNext={() => setWeekOffset(weekOffset + 1)}
      />

      <WeekCalendarGrid
        weekDates={weekDates}
        todayStr={todayStr}
        plans={plans}
        showingHourlyFor={showingHourlyFor}
        renamingPlanId={renamingPlanId}
        renameValue={renameValue}
        renameNotesValue={renameNotesValue}
        onDateClick={handleDateClick}
        onAddOrgClick={handleAddOrgClick}
        onPlanClick={handlePlanClick}
        onStartRename={startRename}
        onSaveRename={saveRename}
        onCancelRename={cancelRename}
        onDeletePlan={deletePlan}
        setRenameValue={setRenameValue}
        setRenameNotesValue={setRenameNotesValue}
      />

      {selectedDate && addOrgMode && (
        <AddOrganizationForm
          selectedDate={selectedDate}
          newOrg={newOrg}
          newNotes={newNotes}
          onNewOrgChange={setNewOrg}
          onNewNotesChange={setNewNotes}
          onSubmit={handleAddFormSubmit}
          onCancel={handleAddFormCancel}
        />
      )}

      <DailyHourlyView plans={plans} timeSlots={timeSlots} selectedDate={showingHourlyFor} />

      {editingPlan && showingHourlyFor && (
        <HourlyPlanModal
          editingPlan={editingPlan}
          timeSlots={timeSlots}
          onClose={handleModalClose}
          onUpdateNote={updateHourlyNote}
          getHourlyNote={getHourlyNote}
        />
      )}
    </div>
  );
}
