export interface TimeSlot {
  label: string;
  time: string;
}

export interface UserSchedule {
  user_id: number;
  first_name: string;
  last_name: string;
  schedule: any;
  avg_per_shift?: number;
}

export interface DaySchedule {
  date: string;
  dayName: string;
  isWeekend: boolean;
  slots: TimeSlot[];
}

export interface DayStats {
  date: string;
  expected: number;
  actual: number;
}

export interface Week {
  start: string;
  label: string;
}

export interface DeleteSlotState {
  userId: number;
  date: string;
  slot: string;
}

export interface ConfirmDeleteState {
  userId: number;
  userName: string;
  date: string;
  slot: string;
  slotLabel: string;
}