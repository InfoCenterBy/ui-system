---
id: "builder-tests-2026-11-05"
status: "review"
priority: "medium"
assignee: null
epic: null
dueDate: null
created: "2026-11-05T09:30:00.000Z"
modified: "2026-11-05T11:30:00.000Z"
completedAt: null
labels: ["конструктор", "тесты"]
order: "a1"
---

# Тесты: нестабильные серверные тесты и e2e

Хвосты из лога доработок (`archived/builder-polish-log-2026-10-31`).

- [x] **Нестабильные серверные тесты:** `server/app.test.ts` и `server/export.test.ts` иногда падают при полном параллельном прогоне `pnpm test` на Windows (каждый раз разный тест), по отдельности проходят. Найти причину и убрать, а не просто увеличить таймауты.
  - **Сделано:** причина — таймаут vitest по умолчанию 5 с на тяжёлых тестах (Tailwind-сборка, sharp) при нагрузке на CPU от параллельных воркеров. 3 полных `pnpm test` на свободной машине проходили, а 12 одновременных `pnpm --filter builder test` давали 5 падений из 12 (`Test timed out in 5000ms` в classes/images/app), так что это медленная работа под нагрузкой, а не общее состояние. Временные папки уникальны (`mkdtemp`), `recentFile` в тестах и так временный. Поправлено: `test.testTimeout/hookTimeout` = 30 с в `apps/builder/vite.config.ts` (честное увеличение, причина показана выше); `BUILDER_RECENT_FILE` + `test.env`, чтобы тесты не трогали `~/.ui-builder/recent.json`; найден и убран общий файл `os.tmpdir()/ui-builder-preview-cally.js` в превью (теперь `callyScript()` отдаёт строку без записи на диск). После правки 12 одновременных прогонов builder — 12 из 12 зелёные (277 тестов).
- [x] **E2E-тесты:** `@playwright/test` в `apps/builder/e2e` и команда `pnpm e2e`. Сценарии: создать проект, вставить секцию и элемент, редактировать текст, Options, слайды карусели, стили с состоянием, выгрузка. Сервер конструктора поднимается на своих портах (не 5180/5181), проект — во временной папке.
  - **Сделано:** `@playwright/test` 1.64.1 (точная версия, из той же линейки, что `@playwright/mcp@0.0.83`), `apps/builder/playwright.config.ts` (Chrome `channel: 'chrome'`, `webServer`: API на 5197 и vite на 5196, `BUILDER_RECENT_FILE` во временной папке, при `BUILDER_E2E` vite без watch/HMR, чтобы чужие правки файлов не перезагружали страницу), `e2e/fixtures.ts` (проект через `POST /api/projects/create` во временной папке, английский язык через `localStorage`), `e2e/global-setup.ts` (проверяет, что в реальный recent.json ничего не попало), `e2e/builder.spec.ts` — 7 сценариев: создать проект с экрана старта, открыть из списка недавних, вставить секцию и править текст на холсте, вставить элемент и Options, слайд карусели, hover-стиль (класс `hover:flex`), выгрузка (файлы в `dist`). Скрипты `e2e` в `apps/builder` и в корне, `tsconfig.e2e.json` подключён в typecheck, vitest исключает `e2e/`, `test-results` и `playwright-report` в `.gitignore`. Запуск: `pnpm e2e` (`E2E_REUSE=1` — использовать уже запущенные серверы на 5196/5197). 4 подряд зелёных прогона по 7 тестов; два более ранних падали из-за чужих правок в `packages/core` (временно не было `variants.ts`) и перезагрузки vite — отсюда отключение HMR.
- [x] **Документация:** строка в таблице Scripts и раздел «E2E tests» в README.

## Проверка

Проверено 05.11: `pnpm e2e` — 7 из 7, полный `pnpm test` — зелёный.
