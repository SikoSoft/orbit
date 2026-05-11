# Architecture

Orbit is a Lit + MobX activity/list management SPA backed by the `gapi` Azure Functions API.

**Entry point:** `index.html` loads `<page-container>`, which bootstraps the router and renders the active view.

**Key layers:**

- **`src/state.ts`** — Single global `AppState` (MobX `@observable`). All components access it via `import { appState } from '@/state'` and `this.state = appState`. Mutations are `@action` methods on the class.
- **`src/lib/Router.ts`** — Custom client-side router using the history API. Routes defined in `src/routes.ts` with lazy-loaded view components. `routerState` is a MobX observable; use `navigate()` for programmatic navigation.
- **`src/lib/Storage.ts`** — Delegates all persistence to `networkStorage` (REST API calls). The `StorageSchema` interface (in `src/models/Storage.ts`) defines every storage method — implement there when adding new data operations.
- **`src/lib/Api.ts`** — Generic `httpRequest<T>()` wrapper. All responses are `{ status, isOk, response }`. JWT token is appended automatically; 403 triggers forbidden state.

**API base URL:** `https://sikosoft.azurewebsites.net/api/action` (override with `APP_BASE_API_URL` env var).
