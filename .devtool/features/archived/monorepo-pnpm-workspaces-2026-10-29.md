---
id: "monorepo-pnpm-workspaces-2026-10-29"
status: "done"
priority: "high"
assignee: null
epic: null
dueDate: null
created: "2026-10-29T09:20:34.000Z"
modified: "2026-11-05T09:28:33.786Z"
completedAt: "2026-11-05T09:28:33.786Z"
labels: ["конструктор", "этап-0"]
order: "a3"
---
# Переезд на pnpm workspaces

Перевести репозиторий на pnpm workspaces и перенести каталог в `apps/catalog` без изменения поведения.

## Критерии готовности

- [x] pnpm-workspace.yaml и корневой package.json со скриптами
- [x] Каталог живёт в apps/catalog, dev, build, test, lint работают
- [x] Husky и lint-staged работают из корня
- [x] README описывает структуру монорепо