---
id: "builder-custom-block-scripts-2026-10-31"
status: "backlog"
priority: "low"
assignee: null
dueDate: null
created: "2026-10-31T01:00:00.000Z"
modified: "2026-10-31T01:00:00.000Z"
completedAt: null
labels: ["конструктор", "фича", "кастомный-блок"]
order: "a2"
---

# Кастомный блок, этап 3: компоненты со скриптами

На первом этапе скрыты компоненты, которым нужен JS или связки по id: calendar, countdown, dropdown, megamenu, modal.

## Критерии готовности

- [ ] Решить для каждого: чистый HTML/CSS (popover, details, `commandfor`) или скрипт в `site.js`
- [ ] Связки по id (кнопка открывает modal) переписываются при вставке вместе
- [ ] В редакторе компонент можно открыть и править (например, содержимое modal)
- [ ] Скрипты попадают в выгрузку только если компонент есть на странице

Зависит от [[builder-custom-block-elements-2026-10-31]].
