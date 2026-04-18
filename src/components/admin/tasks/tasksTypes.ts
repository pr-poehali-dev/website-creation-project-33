export const TASKS_API = 'https://functions.poehali.dev/65786d7c-38f3-4811-aad3-17cefbab2d6d';

export const RESPONSIBLES = ['Корельский Максим', 'Виктор Кобыляцкий'];

export const STATUS_CONFIG = {
  pending: {
    label: 'Не выполнена',
    color: 'bg-red-500/15 text-red-400 ring-red-500/30',
    dot: 'bg-red-400',
    activeBg: 'bg-red-500 text-white',
    bar: 'bg-red-400',
    order: 0,
  },
  in_progress: {
    label: 'В процессе',
    color: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/30',
    dot: 'bg-yellow-400',
    activeBg: 'bg-yellow-400 text-white',
    bar: 'bg-yellow-400',
    order: 1,
  },
  done: {
    label: 'Выполнена',
    color: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    dot: 'bg-emerald-400',
    activeBg: 'bg-emerald-500 text-white',
    bar: 'bg-emerald-400',
    order: 2,
  },
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
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
}

export const AVATAR_COLORS: Record<string, string> = {
  'Корельский Максим': 'bg-violet-500/20 text-violet-300',
  'Виктор Кобыляцкий': 'bg-blue-500/20 text-blue-300',
};

export function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('');
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
}