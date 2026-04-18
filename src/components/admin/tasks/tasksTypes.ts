export const TASKS_API = 'https://functions.poehali.dev/65786d7c-38f3-4811-aad3-17cefbab2d6d';

export const RESPONSIBLES = ['Корельский Максим', 'Виктор Кобыляцкий'];

export const STATUS_CONFIG = {
  pending: {
    label: 'Не выполнена',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    dot: 'bg-red-500',
    activeBg: 'bg-red-500 text-white',
    bar: 'bg-red-400',
    order: 0,
  },
  in_progress: {
    label: 'В процессе',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    activeBg: 'bg-amber-400 text-white',
    bar: 'bg-amber-400',
    order: 1,
  },
  done: {
    label: 'Выполнена',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
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
  'Корельский Максим': 'bg-violet-100 text-violet-700',
  'Виктор Кобыляцкий': 'bg-blue-100 text-blue-700',
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
