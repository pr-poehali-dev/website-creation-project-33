export const TASKS_API = 'https://functions.poehali.dev/65786d7c-38f3-4811-aad3-17cefbab2d6d';
export const RESPONSIBLES = ['Корельский Максим', 'Виктор Кобыляцкий'];

export const STATUS_CONFIG = {
  pending:     { label: 'Не выполнена', dot: 'bg-red-400',     badge: 'bg-red-400/15 text-red-300 ring-red-400/30',         bar: 'bg-red-400',     btn: 'bg-red-500 text-white',     order: 0 },
  in_progress: { label: 'В процессе',   dot: 'bg-yellow-400',  badge: 'bg-yellow-400/15 text-yellow-300 ring-yellow-400/30', bar: 'bg-yellow-400', btn: 'bg-yellow-500 text-white', order: 1 },
  done:        { label: 'Выполнена',    dot: 'bg-emerald-400', badge: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30', bar: 'bg-emerald-400', btn: 'bg-emerald-500 text-white', order: 2 },
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