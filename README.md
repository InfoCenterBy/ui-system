# UI System

A catalog of [daisyUI](https://daisyui.com) components with live preview, an in-browser HTML editor and copy-ready HTML or JSX.

Live: https://infocenterby.github.io/ui-system/

## Stack

React 19, Vite, Tailwind CSS 4, daisyUI 5, React Router (hash routing for GitHub Pages).

## Getting started

Requires Node.js 24 and pnpm. Run `corepack enable` once to get pnpm. Corepack reads the pnpm version from `packageManager` in `package.json`.

```sh
pnpm install
pnpm dev
```

## Repository layout

This is a pnpm workspace.

- `apps/catalog`: the daisyUI component catalog (Vite app).
- `packages/theme`: `@ui-system/theme`, colors, theme presets and the theme generator logic.
- `packages/blocks`: `@ui-system/blocks`, HTML component examples and their registry.
- `apps/builder`: a local site builder that exports static HTML and CSS, see below.
- `packages/core`: `@ui-system/core`, the page tree model, HTML parsing and serialization.

## Scripts

| Script              | What it does                                |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | Start the catalog dev server                |
| `pnpm build`        | Build the catalog to `apps/catalog/dist`    |
| `pnpm preview`      | Serve the production build locally          |
| `pnpm lint`         | Run ESLint                                  |
| `pnpm typecheck`    | Run TypeScript checks in every package      |
| `pnpm test`         | Run unit tests with Vitest in every package |
| `pnpm format`       | Format the whole repo with Prettier         |
| `pnpm format:check` | Check formatting without writing            |

## Adding a component

Every example is a plain HTML file, the registry lists them in display order.

1. Add the markup to `packages/blocks/src/library/<slug>/<variant>.html`. Use unique ids and radio names, prefixed with the slug.
2. List the variant in `packages/blocks/src/categories.ts`. A new component needs `slug`, `name`, `group`, a Russian `description` and `variants`.
3. Optional fields: `showcase` picks the variant shown on the overview page, `previewClass` adjusts the preview box, `note` shows a hint under the description.

The JSX tab is generated from the HTML, so there is nothing else to write. Inline `<script>` tags run in the preview and are left out of the JSX. A missing file fails the build with a clear error.

## Preview sandbox

Every example on a component page runs in its own iframe that reuses the site stylesheet, so it looks exactly like the rest of the site and loads from cache.

- The HTML editor suggests Tailwind utilities, variants and daisyUI classes inside `class=""`, with color swatches and the generated CSS.
- Once the code is edited, the Tailwind browser build joins in, so any Tailwind class typed in the live editor works.
- Iframes mount when they get close to the screen and are rebuilt if one fails to load.
- The iframe grows with its content, open dropdowns and select pickers included. Fixed elements like toast, dock or FAB stay inside it.
- Links, form submits and browser validation bubbles stay inside the example.
- The toolbar above the examples switches the preview width (phone, tablet, full) and theme.
- Horizontal carousels also scroll with the mouse wheel in the preview.

## Catalog

- Search (Ctrl/Cmd+K) forgives typos and finds examples by class name, for example `btn-soft`.
- The star keeps an example in Favorites, saved in this browser.
- The link button copies a URL that opens the page scrolled to that example.

## Theme generator

`#/theme-generator` builds a daisyUI theme on top of any built-in preset: colors, radius, sizes, border and depth.

- Content colors follow their background automatically and keep at least 4.5:1 contrast; turn off "auto" to pick one by hand.
- The contrast section lists every text and background pair with its WCAG ratio and fixes low ones in one click.
- The preview shows a sample dashboard or every library example with the theme applied, the rest of the site is untouched.
- Import reads an exported block or any `[data-theme]` rule with OKLCH or HEX colors.
- Export gives a `@plugin "daisyui/theme"` block in OKLCH. The theme is also kept in the URL, so a link restores it.
- "Apply to site" saves the theme and adds a Custom option to the theme menu.

Color math, theme logic and search are covered by tests. Run them with `pnpm test`.

## Site builder

`pnpm builder` starts the builder at http://localhost:5180 (the API runs on 5181; set `BUILDER_PORT` to run a copy on other ports). Type a folder path and create or open a project.

- A project is a folder: `site.json` (name, language, theme, fonts, page order), `pages/*.json`, `partials/header.json` and `footer.json`, `assets/` for uploads and `dist/` for the export. Keep it in git if you like, the JSON is stable and readable.
- Pages are built from section presets (`packages/blocks/src/sections`). Presets are plain HTML: `data-edit="text|rich|image|link"` marks editable places, `data-repeat` marks items that can be added, removed and reordered. Header and footer presets become shared parts of every page.
- Double-click text on the canvas to edit it. Images, links, repeat items and section variants are edited in the right panel. Ctrl+Z and Ctrl+Y undo and redo, edits are saved automatically.
- Site settings hold the language, the asset path prefix, the daisyUI theme and fonts. Fonts come from Google Fonts or local files and are stored in the project, the exported site never calls Google.
- Export writes `dist/`: one HTML file per page, `assets/site.css` with only the classes in use, `assets/site.js` when a section has inline scripts, images as WebP in several widths with `srcset`, fonts and other files. The canvas and the export CSS come from the same Tailwind and daisyUI build on the server, so the export looks like the canvas.
- For Bitrix set the asset path prefix to the template folder, for example `/local/templates/site/`, and copy `dist/assets` there.

## Code style

- Formatting is defined in `.prettierrc.json` and `.editorconfig`: tabs, single quotes, no semicolons, 80 columns, LF line endings. Tailwind classes are sorted by `prettier-plugin-tailwindcss`.
- A pre-commit hook (husky + lint-staged) runs ESLint and Prettier on staged files, so every machine commits the same formatting.
- In VS Code install the recommended extensions; format on save is enabled for the workspace.

### Comments

- English only.
- One line, short and to the point.
- Plain human language, no emoji.

## Deploy

Every push to `main` runs the `Deploy to GitHub Pages` workflow: pnpm install, format check, lint, typecheck, tests, build, publish `apps/catalog/dist`.

## Task board

Tasks are markdown cards in `.devtool/features`. Each card has YAML frontmatter with its status and priority. The `kanban-markdown` VS Code extension shows them as a board.
