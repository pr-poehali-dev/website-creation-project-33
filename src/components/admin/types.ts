export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  lead_count: number;
  shifts_count?: number;
  avg_per_shift?: number;
  last_shift_date?: string;
  latitude?: number;
  longitude?: number;
  location_city?: string;
  location_country?: string;
  registration_ip?: string;
  is_active?: boolean;
  video_recording_enabled?: boolean;
}

export interface Lead {
  id: number;
  lead_type: string;
  lead_result: string;
  telegram_message_id: number | null;
  created_at: string;
  organization_name?: string;
}

export interface OrganizationStats {
  name: string;
  contacts: number;
  approaches: number;
  total: number;
}

export interface UserStats {
  user_id: number;
  name: string;
  email: string;
  lead_count: number;
  contacts: number;
  approaches: number;
  duplicates: number;
  shifts_count?: number;
  avg_per_shift?: number;
  max_contacts_per_shift?: number;
  revenue?: number;
  is_active?: boolean;
  organizations?: OrganizationStats[];
}

export interface DailyStats {
  date: string;
  count: number;
  contacts: number;
  approaches: number;
}

export interface ChartDataPoint {
  date: string;
  organization_ids?: number[];
  user_orgs?: Record<string, number[]>;  // Привязка промоутеров к организациям
  [key: string]: string | number | number[] | Record<string, number[]> | undefined;
}

export interface DailyUserStats {
  user_stats: UserStats[];
}

export interface Stats {
  total_leads: number;
  contacts: number;
  approaches: number;
  user_stats: UserStats[];
  daily_stats: DailyStats[];
}

export const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';