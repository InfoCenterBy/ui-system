# UI System

A catalog of [daisyUI](https://daisyui.com) components with live preview, an in-browser HTML editor and copy-ready HTML or JSX.

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
| `npm test`             | Run unit tests with Vitest          |
| `npm run format`       | Format the whole repo with Prettier |
| `npm run format:check` | Check formatting without writing    |

## Adding a component

Every example is a plain HTML file, the registry lists them in display order.

1. Add the markup to `src/library/<slug>/<variant>.html`. Use unique ids and radio names, prefixed with the slug.
2. List the variant in `src/registry/categories.js`. A new component needs `slug`, `name`, `group`, a Russian `description` and `variants`.
3. Optional fields: `showcase` picks the variant shown on the overview page, `previewClass` adjusts the preview box.

The JSX tab is generated from the HTML, so there is nothing else to write. A missing file fails the build with a clear error.

Tailwind only generates classes it finds in the source, so classes typed in the live editor work only if they already appear somewhere in the project.

## Theme generator

`#/theme-generator` builds a daisyUI theme on top of any built-in preset: colors, radius, sizes, border and depth.

- Content colors follow their background automatically and keep at least 4.5:1 contrast; turn off "auto" to pick one by hand.
- The preview shows every library example with the theme applied, the rest of the site is untouched.
- Export gives a `@plugin "daisyui/theme"` block in OKLCH. The theme is also kept in the URL, so a link restores it.
- "Apply to site" saves the theme and adds a Custom option to the theme menu.

Color math and theme logic live in `src/lib/color.js` and `src/lib/theme.js` and are covered by tests.

## Code style

- Formatting is defined in `.prettierrc.json` and `.editorconfig`: tabs, single quotes, no semicolons, 80 columns, LF line endings. Tailwind classes are sorted by `prettier-plugin-tailwindcss`.
- A pre-commit hook (husky + lint-staged) runs ESLint and Prettier on staged files, so every machine commits the same formatting.
- In VS Code install the recommended extensions; format on save is enabled for the workspace.

### Comments

- English only.
- One line, short and to the point.
- Plain human language, no emoji.

## Deploy

Every push to `main` runs the `Deploy to GitHub Pages` workflow: format check, lint, tests, build, publish `dist`.
