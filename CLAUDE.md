# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server at http://localhost:5173
npm run build      # TypeScript check + Vite production build (~3-4s)
npm run lint       # ESLint (~4s)
npm run lint:fix   # Auto-fix lint issues
npm run preview    # Preview production build at http://localhost:4173
```

No test suite exists — validate changes via build and lint.

**Git hooks:** Pre-commit runs ESLint on staged files; pre-push runs a full build. Always lint before committing.

## Architecture

Orbit is a Lit + MobX activity/list management SPA backed by the `gapi` Azure Functions API.

**Entry point:** `index.html` loads `<page-container>`, which bootstraps the router and renders the active view.

**Key layers:**

- **`src/state.ts`** — Single global `AppState` (MobX `@observable`). All components access it via `import { appState } from '@/state'` and `this.state = appState`. Mutations are `@action` methods on the class.
- **`src/lib/Router.ts`** — Custom client-side router using the history API. Routes defined in `src/routes.ts` with lazy-loaded view components. `routerState` is a MobX observable; use `navigate()` for programmatic navigation.
- **`src/lib/Storage.ts`** — Delegates all persistence to `networkStorage` (REST API calls). The `StorageSchema` interface (in `src/models/Storage.ts`) defines every storage method — implement there when adding new data operations.
- **`src/lib/Api.ts`** — Generic `httpRequest<T>()` wrapper. All responses are `{ status, isOk, response }`. JWT token is appended automatically; 403 triggers forbidden state.

**API base URL:** `https://sikosoft.azurewebsites.net/api/action` (override with `APP_BASE_API_URL` env var).

## Component Conventions

- Components live in `src/components/<kebab-case-tag-name>/`
- Each directory: `component-name.ts` (main), optionally `component-name.models.ts` (types) and `component-name.events.ts` (custom DOM events)
- Extend `MobxLitElement` from `@adobe/lit-mobx` for reactive MobX integration
- Register with `@customElement('tag-name')`

**Import order within files:**
1. Third-party (`lit`, `mobx`, `@ss/ui`, etc.)
2. Models/lib (`@/models`, `@/lib`)
3. Events (`@/events`)
4. Components (`@/components`)
5. Styles (`@/styles`)

Path alias: `@/` → `src/`

## Views & Routing

| Route | Component | Purpose |
|---|---|---|
| `/` | `entity-form-view` | Main input form |
| `/entities` | `entity-list-view` | List with filtering/sorting |
| `/entity/:id` | `entity-form` | Edit single entity |
| `/admin` | `admin-dashboard-view` | Schema/config management |
| `/login` | `login-form` | Authentication |
| `/account` | `account-form` | User settings |
| `/list/:id` | `public-list-view` | Public shared list |

## External Packages

- **`@ss/ui`** (`projects/ui`) — shared Lit component library; 30+ components with Storybook docs (`npm run storybook` in that repo)
- **`@ss/identity`** (`projects/identity`) — shared auth/identity utilities
- **`api-spec`** — shared TypeScript interfaces: `Entity`, `EntityConfig`, `List`, `ListFilter`, `ListConfig`, `Setting`, etc.

Keep `api-spec` version in sync when making API contract changes. Internal packages are referenced via GitHub npm registry URLs with version pinning in `package.json`.

## Local Backend

`gapi` runs locally on port 9999 (`npm start` in `projects/gapi`). Set `APP_BASE_API_URL=http://localhost:7071/api/action` to point orbit at the local backend instead of production.

## Prettier Config

`singleQuote: true`, `arrowParens: 'avoid'`
