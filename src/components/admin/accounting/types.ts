export interface ShiftRecord {
  date: string;
  start_time: string;
  end_time: string;
  organization: string;
  organization_id: number;
  user_id: number;
  user_name: string;
  contacts_count: number;
  contact_rate: number;
  payment_type: 'cash' | 'cashless';
  expense_amount: number;
  expense_comment: string;
  paid_by_organization: boolean;
  paid_to_worker: boolean;
  paid_kvv: boolean;
  paid_kms: boolean;
  invoice_issued: boolean;
  invoice_issued_date: string | null;
  invoice_paid: boolean;
  invoice_paid_date: string | null;
}

export interface User {
  id: number;
  name: string;
}

export interface Organization {
  id: number;
  name: string;
}

export interface NewShiftData {
  user_id: number;
  organization_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  contacts_count: number;
}

export const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';