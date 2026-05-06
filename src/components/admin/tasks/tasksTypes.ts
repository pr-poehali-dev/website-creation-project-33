export const TASKS_API = 'https://functions.poehali.dev/65786d7c-38f3-4811-aad3-17cefbab2d6d';
export const RESPONSIBLES = ['Корельский Максим', 'Виктор Кобыляцкий'];

export const STATUS_CONFIG = {
  pending:     { label: 'Не выполнена', dot: 'bg-red-400',     badge: 'bg-red-50 text-red-500 border-red-200',           bar: 'bg-red-400',     btn: 'bg-red-500 text-white',     order: 0 },
  in_progress: { label: 'В процессе',   dot: 'bg-yellow-400',  badge: 'bg-yellow-50 text-yellow-600 border-yellow-200',  bar: 'bg-yellow-400',  btn: 'bg-yellow-500 text-white',  order: 1 },
  done:        { label: 'Выполнена',    dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', bar: 'bg-emerald-500', btn: 'bg-emerald-500 text-white', order: 2 },
} as const;

export type TaskStatus = keyof typeof STATUS_CONFIG;

export interface Task {
  id: number;
  text: string;
  responsible: string;
  category_id: number | null;
  category_name: string | null;
  status: TaskStatus;
  created_at: string;
}

export interface Category { id: number; name: string; }

export interface TaskAction {
  id: number;
  comment: string;
  is_done: boolean;
  done_at: string | null;
  created_at: string;
}

export function fmt(iso: string) {
  try { return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}