import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { i18n } from './i18n'
import { TAG_COLOR } from './constants'

const CHANNEL_ID = 'reminders'

function notificationId(noteId) {
  let hash = 0
  const value = String(noteId)
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0
  return (Math.abs(hash) % 2147483000) + 1
}

export async function ensureNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const current = await LocalNotifications.checkPermissions()
    if (current.display === 'granted') return true
    const requested = await LocalNotifications.requestPermissions()
    return requested.display === 'granted'
  } catch {
    return false
  }
}

async function ensureChannel() {
  try {
    const { channels } = await LocalNotifications.listChannels()
    if (channels?.some((c) => c.id === CHANNEL_ID)) return
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: i18n.global.t('notifications.channel'),
      description: i18n.global.t('notifications.channelDesc'),
      importance: 4,
      visibility: 1,
      vibration: true
    })
  } catch {
    /* channel API is Android-only, ignore elsewhere */
  }
}

/** Cancels previously scheduled reminders and schedules a fresh set. */
export async function syncReminders(notes) {
  if (!Capacitor.isNativePlatform()) return
  try {
    const pending = await LocalNotifications.getPending()
    if (pending?.notifications?.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }

    const now = Date.now()
    const upcoming = notes
      .filter((n) => n.status === 'active' && n.due != null && n.due > now + 5000)
      .slice(0, 50)

    if (!upcoming.length) return

    const granted = await ensureNotificationPermission()
    if (!granted) return
    await ensureChannel()

    const notifications = upcoming.map((n) => {
      const title = n.title.trim() || n.content.trim().slice(0, 60) || i18n.global.t('app')
      return {
        id: notificationId(n.id),
        title,
        body: i18n.global.t('notifications.body', {
          due: new Intl.DateTimeFormat(i18n.global.locale.value === 'ru' ? 'ru-RU' : 'en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(n.due))
        }),
        channelId: CHANNEL_ID,
        color: TAG_COLOR[n.tag],
        schedule: { at: new Date(n.due), allowWhileIdle: true },
        extra: { noteId: n.id }
      }
    })

    await LocalNotifications.schedule({ notifications })
  } catch {
    /* notifications are best-effort; the in-app digest still works */
  }
}
