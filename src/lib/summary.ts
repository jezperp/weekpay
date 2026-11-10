import { i18n } from '@/i18n'
import type { ChoreLog } from '@/stores/chorelogs'

export interface ChoreSummary {
  id: string
  name: string
  icon: string | null
  color: string | null
  count: number
  sum: number
}

// Count and money per chore. Chores netting out to zero are left out. Biggest sum first.
export function summarize(logs: ChoreLog[]): ChoreSummary[] {
  const map = new Map<string, ChoreSummary>()
  for (const l of logs) {
    const row = map.get(l.chore_id) ?? {
      id: l.chore_id,
      name: l.chores?.name ?? i18n.global.t('earned.removedChore'),
      icon: l.chores?.icon ?? null,
      color: l.chores?.color ?? null,
      count: 0,
      sum: 0,
    }
    row.count += l.delta
    row.sum += l.amount * l.delta
    map.set(l.chore_id, row)
  }
  return [...map.values()]
    .filter((r) => r.count !== 0)
    .map((r) => ({ ...r, sum: Math.round(r.sum * 100) / 100 }))
    .sort((a, b) => b.sum - a.sum)
}
