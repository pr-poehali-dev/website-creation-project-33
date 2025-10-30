export interface HourlyNote {
  hour: string;
  note: string;
}

export interface PlannedOrganization {
  id: number;
  organization: string;
  date: string;
  notes?: string;
  hourlyNotes?: HourlyNote[];
}

export const STORAGE_KEY = 'planned_organizations';
