---
id: "builder-custom-block-scripts-2026-10-31"
status: "review"
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

## Решения (31.10.2026)

- modal: `onclick` заменяется на `command="show-modal"` и `commandfor`, в `site.js` запасной вариант для старых браузеров.
- dropdown и megamenu работают на `popover` и CSS-привязках, скрипт не нужен; при вставке переписываются id, `popovertarget` и имена привязок `--anchor`.
- В редакторе modal, dropdown и megamenu раскрыты на холсте, пока выделен компонент или что-то внутри него.
- countdown: целевая дата в свойствах (`data-countdown-to`), тикание в `site.js`, в редакторе числа статичные.
- calendar: локальная копия Cally в `assets/js`, только на страницах, где есть календарь.

## Критерии готовности

- [x] Решить для каждого: чистый HTML/CSS (popover, details, `commandfor`) или скрипт в `site.js`
- [x] Связки по id (кнопка открывает modal) переписываются при вставке вместе
- [x] В редакторе компонент можно открыть и править (например, содержимое modal)
- [x] Скрипты попадают в выгрузку только если компонент есть на странице

Зависит от [[builder-custom-block-elements-2026-10-31]].

## Что сделано

- modal: `command="show-modal"` и `commandfor`, запасной вариант в `site.js` только на страницах с `[commandfor]`.
- dropdown и megamenu: `prepareInsert` переписывает и имена привязок `anchor-name`, `position-anchor`, `anchor()`.
- В редакторе открываются modal (без блокировки холста), popover, `details.dropdown` и фокусные dropdown, пока выделен компонент или что-то внутри.
- countdown: поле «Countdown to» в свойствах, тикание в `site.js` по `data-countdown-to` и `data-countdown`.
- calendar: Cally в холсте и превью, в выгрузке `assets/js/cally.js` обычным скриптом (работает и с file://) только на страницах с календарём; лицензия в шапке файла и в `THIRD_PARTY_NOTICES.md`.

## Правки после проверки (31.10.2026)

- Выпадающая панель megamenu или dropdown у последнего блока обрезалась низом холста и получала свою прокрутку. Теперь, пока панель раскрыта, редактор добавляет внизу страницы запас под её полную высоту и прокручивает холст. После снятия выделения запас убирается. Только в редакторе (`editor/canvas/useRevealOpen.ts`).
- Если выделена кнопка-триггер, раскрывается её панель, а не первая в компоненте.
