import {
  PRIORITIES,
  STATUSES,
  TAGS,
  DEFAULT_PRIORITY,
  DEFAULT_STATUS,
  DEFAULT_TAG,
  PRIORITY_WEIGHT
} from '../constants'

export function normalizeNote(raw) {
  const now = Date.now()
  const note = raw && typeof raw === 'object' ? raw : {}
  return {
    id: String(note.id || `${now}-${Math.random().toString(36).slice(2, 8)}`),
    title: String(note.title || ''),
    content: String(note.content || ''),
    priority: PRIORITIES.includes(note.priority) ? note.priority : DEFAULT_PRIORITY,
    status: STATUSES.includes(note.status) ? note.status : DEFAULT_STATUS,
    tag: TAGS.includes(note.tag) ? note.tag : DEFAULT_TAG,
    due: Number.isFinite(note.due) && note.due > 0 ? note.due : null,
    pinned: Boolean(note.pinned),
    url: typeof note.url === 'string' ? note.url : '',
    createdAt: Number(note.createdAt) || now,
    updatedAt: Number(note.updatedAt) || Number(note.createdAt) || now
  }
}

export function isOverdue(note, now = Date.now()) {
  return note.status === 'active' && note.due != null && note.due < now
}

export function isToday(note, now = Date.now()) {
  if (note.due == null) return false
  const d = new Date(note.due)
  const n = new Date(now)
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  )
}

export function startOfDay(ts) {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const DAY = 86400000

/** 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' */
export function dueBucket(note, now = Date.now()) {
  if (note.due == null) return 'later'
  if (isOverdue(note, now)) return 'overdue'
  const today = startOfDay(now)
  const dueDay = startOfDay(note.due)
  if (dueDay === today) return 'today'
  if (dueDay === today + DAY) return 'tomorrow'
  if (dueDay <= today + 7 * DAY) return 'week'
  return 'later'
}

/**
 * Today screen: pinned notes always first, the rest split by due date.
 * Returns [{ key, titleKey, notes }]
 */
export function groupForToday(notes, now = Date.now()) {
  const visible = notes.filter((n) => n.status !== 'archived')
  const pinned = visible.filter((n) => n.pinned).sort(byDueThenPriority)
  const rest = visible.filter((n) => !n.pinned)

  const buckets = { overdue: [], today: [], tomorrow: [], week: [], later: [] }
  for (const note of rest) buckets[dueBucket(note, now)].push(note)
  for (const key of Object.keys(buckets)) buckets[key].sort(byDueThenPriority)

  const groups = []
  if (pinned.length) groups.push({ key: 'pinned', titleKey: 'group.pinned', notes: pinned })
  for (const key of ['overdue', 'today', 'tomorrow', 'week', 'later']) {
    if (buckets[key].length) {
      groups.push({ key, titleKey: `group.${key}`, notes: buckets[key] })
    }
  }
  return groups
}

export function byDueThenPriority(a, b) {
  const ad = a.due == null ? Number.MAX_SAFE_INTEGER : a.due
  const bd = b.due == null ? Number.MAX_SAFE_INTEGER : b.due
  if (ad !== bd) return ad - bd
  return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
}

export function sortNotes(notes, sortKey) {
  const list = [...notes]
  if (sortKey === 'priority') {
    list.sort((a, b) => {
      const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
      return diff !== 0 ? diff : byDueThenPriority(a, b)
    })
  } else if (sortKey === 'created') {
    list.sort((a, b) => b.createdAt - a.createdAt)
  } else {
    list.sort(byDueThenPriority)
  }
  return list
}

/** Pinned notes are always on top; the rest keeps the requested order. */
export function withPinnedFirst(notes) {
  return [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned))
}

export function matchesQuery(note, query, tagLabel) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    note.title.toLowerCase().includes(q) ||
    note.content.toLowerCase().includes(q) ||
    (tagLabel ? tagLabel.toLowerCase().includes(q) : false)
  )
}

export function computeStats(notes, now = Date.now()) {
  const stats = {
    total: notes.length,
    active: 0,
    done: 0,
    archived: 0,
    overdue: 0,
    today: 0,
    byTag: {},
    byPriority: { low: 0, medium: 0, high: 0 }
  }
  for (const note of notes) {
    stats[note.status] += 1
    if (note.priority in stats.byPriority) stats.byPriority[note.priority] += 1
    stats.byTag[note.tag] = (stats.byTag[note.tag] || 0) + 1
    if (isOverdue(note, now)) stats.overdue += 1
    if (note.status === 'active' && isToday(note, now)) stats.today += 1
  }
  return stats
}

export function toLocalInput(ts) {
  if (ts == null) return ''
  const d = new Date(ts)
  const pad = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`
}

export function fromLocalInput(value) {
  if (!value) return null
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : null
}

export function formatDue(ts, locale, now = Date.now()) {
  if (ts == null) return ''
  const date = new Date(ts)
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date)
  const today = startOfDay(now)
  const dueDay = startOfDay(ts)
  if (dueDay === today) return time
  if (dueDay === today + DAY) return `${time}`
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date) + `, ${time}`
}
