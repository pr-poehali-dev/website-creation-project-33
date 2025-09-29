export interface UserStats {
  name: string;
  email: string;
  lead_count: number;
  contacts: number;
  approaches: number;
}

export interface DailyStats {
  date: string;
  count: number;
  contacts: number;
  approaches: number;
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
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