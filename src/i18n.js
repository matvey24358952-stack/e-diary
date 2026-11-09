import { createI18n } from 'vue-i18n'

const ru = {
  app: 'Ежедневник',
  subtitle: 'Заметки, дедлайны и напоминания',
  tabs: { today: 'Сегодня', all: 'Все', search: 'Поиск', stats: 'Статистика' },
  group: {
    pinned: 'Закреплённые',
    overdue: 'Просрочено',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    week: 'На этой неделе',
    later: 'Позже'
  },
  priority: { label: 'Приоритет', low: 'Низкий', medium: 'Средний', high: 'Высокий' },
  status: { label: 'Статус', active: 'Активная', done: 'Выполнена', archived: 'Архив', all: 'Все' },
  tag: { label: 'Тег', study: 'Учёба', work: 'Работа', personal: 'Личное', ideas: 'Идеи', all: 'Все' },
  sort: { label: 'Сортировка', due: 'По дедлайну', priority: 'По приоритету', created: 'По дате создания' },
  search: {
    placeholder: 'Поиск по заголовку, тексту и тегу',
    empty: 'Ничего не найдено',
    hint: 'Начните вводить запрос'
  },
  empty: {
    title: 'Пока пусто',
    hint: 'Нажмите «+», чтобы создать первую заметку',
    today: 'На сегодня задач нет',
    todayHint: 'Отдыхайте или добавьте новую заметку',
    done: 'Здесь появятся выполненные заметки'
  },
  actions: {
    save: 'Сохранить',
    delete: 'Удалить',
    cancel: 'Отмена',
    close: 'Закрыть',
    add: 'Новая заметка',
    clear: 'Очистить',
    show: 'Показать'
  },
  fields: {
    title: 'Заголовок',
    titlePlaceholder: 'О чём заметка?',
    content: 'Содержание',
    contentPlaceholder: 'Начните печатать или нажмите микрофон…',
    due: 'Дедлайн',
    duePlaceholder: 'Дата и время',
    url: 'Ссылка',
    urlPlaceholder: 'https://…',
    pinned: 'Закрепить',
    noDeadline: 'Без срока'
  },
  editor: { new: 'Новая заметка', edit: 'Редактирование', meta: 'заметок' },
  messages: {
    saved: 'Сохранено',
    deleted: 'Заметка удалена',
    noContent: 'Добавьте заголовок или текст',
    pinnedOn: 'Заметка закреплена',
    pinnedOff: 'Заметка откреплена',
    completed: 'Отмечено выполненным',
    reopened: 'Возвращено в активные'
  },
  digest: {
    title: 'Напоминание',
    overdue: 'Просрочено: {count}',
    today: 'На сегодня: {count}',
    text: 'Есть задачи, требующие внимания',
    later: 'Позже'
  },
  stats: {
    title: 'Статистика',
    total: 'Всего заметок',
    active: 'Активные',
    done: 'Выполненные',
    overdue: 'Просроченные',
    archived: 'В архиве',
    byTag: 'По тегам',
    byPriority: 'По приоритету',
    completion: 'Выполнено',
    todayTasks: 'На сегодня'
  },
  voice: {
    listening: 'Слушаю…',
    stop: 'Остановить запись',
    start: 'Голосовой ввод',
    unsupported: 'Голосовой ввод недоступен на этом устройстве',
    denied: 'Нет доступа к микрофону. Разрешите его в настройках.',
    error: 'Не удалось распознать речь. Попробуйте ещё раз.'
  },
  notifications: {
    channel: 'Напоминания о дедлайнах',
    channelDesc: 'Уведомления о задачах с дедлайном',
    body: 'Дедлайн: {due}'
  },
  lang: 'Язык',
  notes: 'заметок',
  today: 'Сегодня',
  yesterday: 'Вчера'
}

const en = {
  app: 'Diary',
  subtitle: 'Notes, deadlines and reminders',
  tabs: { today: 'Today', all: 'All', search: 'Search', stats: 'Stats' },
  group: {
    pinned: 'Pinned',
    overdue: 'Overdue',
    today: 'Today',
    tomorrow: 'Tomorrow',
    week: 'This week',
    later: 'Later'
  },
  priority: { label: 'Priority', low: 'Low', medium: 'Medium', high: 'High' },
  status: { label: 'Status', active: 'Active', done: 'Done', archived: 'Archived', all: 'All' },
  tag: { label: 'Tag', study: 'Study', work: 'Work', personal: 'Personal', ideas: 'Ideas', all: 'All' },
  sort: { label: 'Sort', due: 'By deadline', priority: 'By priority', created: 'By creation date' },
  search: {
    placeholder: 'Search title, text and tag',
    empty: 'Nothing found',
    hint: 'Start typing to search'
  },
  empty: {
    title: 'Nothing here yet',
    hint: 'Tap “+” to create your first note',
    today: 'No tasks for today',
    todayHint: 'Relax or add a new note',
    done: 'Completed notes will appear here'
  },
  actions: {
    save: 'Save',
    delete: 'Delete',
    cancel: 'Cancel',
    close: 'Close',
    add: 'New note',
    clear: 'Clear',
    show: 'Show'
  },
  fields: {
    title: 'Title',
    titlePlaceholder: 'What is this about?',
    content: 'Content',
    contentPlaceholder: 'Start typing or tap the microphone…',
    due: 'Deadline',
    duePlaceholder: 'Date and time',
    url: 'Link',
    urlPlaceholder: 'https://…',
    pinned: 'Pin note',
    noDeadline: 'No deadline'
  },
  editor: { new: 'New note', edit: 'Edit note', meta: 'notes' },
  messages: {
    saved: 'Saved',
    deleted: 'Note deleted',
    noContent: 'Add a title or some text',
    pinnedOn: 'Note pinned',
    pinnedOff: 'Note unpinned',
    completed: 'Marked as done',
    reopened: 'Moved back to active'
  },
  digest: {
    title: 'Reminder',
    overdue: 'Overdue: {count}',
    today: 'Due today: {count}',
    text: 'You have tasks that need attention',
    later: 'Later'
  },
  stats: {
    title: 'Statistics',
    total: 'All notes',
    active: 'Active',
    done: 'Completed',
    overdue: 'Overdue',
    archived: 'Archived',
    byTag: 'By tag',
    byPriority: 'By priority',
    completion: 'Completed',
    todayTasks: 'Due today'
  },
  voice: {
    listening: 'Listening…',
    stop: 'Stop recording',
    start: 'Voice input',
    unsupported: 'Voice input is not available on this device',
    denied: 'Microphone access denied. Allow it in settings.',
    error: 'Speech was not recognized. Please try again.'
  },
  notifications: {
    channel: 'Deadline reminders',
    channelDesc: 'Notifications about tasks with a deadline',
    body: 'Deadline: {due}'
  },
  lang: 'Language',
  notes: 'notes',
  today: 'Today',
  yesterday: 'Yesterday'
}

export const i18n = createI18n({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'ru',
  messages: { ru, en }
})
