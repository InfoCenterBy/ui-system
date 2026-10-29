---
id: "monorepo-shared-packages-2026-10-29"
status: "review"
priority: "high"
assignee: null
dueDate: null
created: "2026-10-29T09:20:34.000Z"
modified: "2026-10-29T09:40:03.000Z"
completedAt: null
labels: ["конструктор", "этап-0"]
order: "a1"
---

# Общие пакеты theme и blocks

Вынести логику тем и цветов в `packages/theme`, примеры компонентов и реестр в `packages/blocks`, каталог использует их как зависимости.

## Критерии готовности

- [x] packages/theme: color, theme и их тесты
- [x] packages/blocks: library и registry
- [x] Каталог импортирует пакеты, сборка и тесты проходят
