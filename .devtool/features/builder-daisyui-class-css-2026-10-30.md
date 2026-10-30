---
id: "builder-daisyui-class-css-2026-10-30"
status: "backlog"
priority: "low"
assignee: null
dueDate: null
created: "2026-10-30T10:30:00.000Z"
modified: "2026-10-30T10:30:00.000Z"
completedAt: null
labels: ["конструктор", "баг"]
order: "a3"
---

# CSS в подсказках daisyUI-классов

Сервер отдаёт daisyUI-классы для поля классов через `GET /api/classes/components`. Найдено при проверке этапа 5.

## Критерии готовности

- [ ] У 185 из 686 классов пустой `css` (например btn-outline, btn-active, btn-disabled, card-sm, collapse, divider-primary, avatar-online), при наведении нет превью. Разобраться в извлечении на сервере
- [ ] Превью `btn-md` показывает правило, вложенное само в себя: `.btn-md { .btn-md { ... } }`
- [ ] Тест на извлечение CSS для этих классов
