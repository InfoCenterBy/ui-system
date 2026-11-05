---
id: "monorepo-shared-packages-2026-10-29"
status: "done"
priority: "high"
assignee: null
epic: null
dueDate: null
created: "2026-10-29T09:20:34.000Z"
modified: "2026-11-05T09:28:33.817Z"
completedAt: "2026-11-05T09:28:33.817Z"
labels: ["конструктор", "этап-0"]
order: "a7"
---
# Общие пакеты theme и blocks

Вынести логику тем и цветов в `packages/theme`, примеры компонентов и реестр в `packages/blocks`, каталог использует их как зависимости.

## Критерии готовности

- [x] packages/theme: color, theme и их тесты
- [x] packages/blocks: library и registry
- [x] Каталог импортирует пакеты, сборка и тесты проходят