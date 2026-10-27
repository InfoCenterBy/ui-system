# UI System

A catalog of [daisyUI](https://daisyui.com) components with live preview and copy-ready markup.

Live: https://infocenterby.github.io/ui-system/

## Stack

React 19, Vite, Tailwind CSS 4, daisyUI 5, React Router (hash routing for GitHub Pages).

## Getting started

Requires Node.js 24.

```sh
npm install
npm run dev
```

## Scripts

| Script                 | What it does                        |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start the dev server                |
| `npm run build`        | Build to `dist`                     |
| `npm run preview`      | Serve the production build locally  |
| `npm run lint`         | Run ESLint                          |
| `npm run format`       | Format the whole repo with Prettier |
| `npm run format:check` | Check formatting without writing    |

## Code style

- Formatting is defined in `.prettierrc.json` and `.editorconfig`: tabs, single quotes, no semicolons, 80 columns, LF line endings. Tailwind classes are sorted by `prettier-plugin-tailwindcss`.
- A pre-commit hook (husky + lint-staged) runs ESLint and Prettier on staged files, so every machine commits the same formatting.
- In VS Code install the recommended extensions; format on save is enabled for the workspace.

### Comments

- English only.
- One line, short and to the point.
- Plain human language, no emoji.

## Deploy

Every push to `main` runs the `Deploy to GitHub Pages` workflow: format check, lint, build, publish `dist`.
