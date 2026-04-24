import { PlanEntry } from '../tasks/PlanOrgModal';

export const PLANNING_API = 'https://functions.poehali.dev/0476e6f3-5f78-4770-9742-11fda4ba89c8';
export const WORK_COMMENTS_API = 'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2';

export const HOURS      = Array.from({ length: 14 }, (_, i) => i + 8); // 8–21
export const HOUR_H     = 80;   // px на 1 час
export const START_HOUR = 8;
export const TIME_LABEL_W = 56; // px — ширина колонки с временем
export const RIGHT_PAD    = 12; // px — отступ справа

// "HH:MM" → минуты от начала шкалы
export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h - START_HOUR) * 60 + (m || 0);
}

export interface Layout { col: number; totalCols: number; }

// Алгоритм раскладки: возвращает { col, totalCols } для каждого индекса
export function computeLayout(plans: PlanEntry[]): Layout[] {
  const n = plans.length;
  const result: Layout[] = Array.from({ length: n }, () => ({ col: 0, totalCols: 1 }));

  const timed = plans.map((p, i) =>
    p.time_from && p.time_to
      ? { i, from: toMin(p.time_from), to: toMin(p.time_to) }
      : null
  );

  const visited = new Set<number>();

  for (let i = 0; i < n; i++) {
    if (!timed[i] || visited.has(i)) continue;

    const group: number[] = [i];
    visited.add(i);
    const queue = [i];
    while (queue.length) {
      const cur = queue.shift()!;
      for (let j = 0; j < n; j++) {
        if (visited.has(j) || !timed[j]) continue;
        const overlaps = group.some(g => {
          const a = timed[g]!, b = timed[j]!;
          return a.from < b.to && b.from < a.to;
        });
        if (overlaps) {
          group.push(j);
          visited.add(j);
          queue.push(j);
        }
      }
    }

    const cols: Array<{ to: number }[]> = [];
    for (const gi of group) {
      const ev = timed[gi]!;
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        if (cols[c].every(slot => slot.to <= ev.from)) {
          result[gi].col = c;
          cols[c].push({ to: ev.to });
          placed = true;
          break;
        }
      }
      if (!placed) {
        result[gi].col = cols.length;
        cols.push([{ to: ev.to }]);
      }
    }
    const total = cols.length;
    for (const gi of group) result[gi].totalCols = total;
  }

  return result;
}

export function fmtDate(d: string) {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  } catch { return d; }
}
