---
id: "monorepo-pnpm-workspaces-2026-10-29"
status: "review"
priority: "high"
assignee: null
dueDate: null
created: "2026-10-29T09:20:34.000Z"
modified: "2026-10-29T09:40:03.000Z"
completedAt: null
labels: ["конструктор", "этап-0"]
order: "a0"
---

# Переезд на pnpm workspaces

Перевести репозиторий на pnpm workspaces и перенести каталог в `apps/catalog` без изменения поведения.

## Критерии готовности

- [x] pnpm-workspace.yaml и корневой package.json со скриптами
- [x] Каталог живёт в apps/catalog, dev, build, test, lint работают
- [x] Husky и lint-staged работают из корня
- [x] README описывает структуру монорепо
