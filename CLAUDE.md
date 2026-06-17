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

See [docs/architecture.md](docs/architecture.md) for system design specifications.

## Component Conventions

- Components live in `src/components/<kebab-case-tag-name>/`
- Each directory: `component-name.ts` (main), optionally `component-name.models.ts` (types), `component-name.test.ts` (tests) and `component-name.events.ts` (custom DOM events)
- Extend `MobxLitElement` from `@adobe/lit-mobx` for reactive MobX integration
- Register with `@customElement('tag-name')`
- Always use Lit's repeat directive, instead of map, for iterating in templates

**Property declaration convention:**

Any component with custom properties must define them in its `.models.ts` file. The models file must export:

1. A `{ComponentName}Prop` enum whose values are the kebab-case attribute names.
2. An interface `{ComponentName}Props extends PropTypes` with each property typed using computed keys from the enum.
3. A `{camelCaseName}Props: PropConfigMap<{ComponentName}Props>` constant with `default`, `description`, and `control` for every property.

```ts
// my-widget.models.ts
import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum MyWidgetProp {
  LABEL = 'label',
  COUNT = 'count',
}

export interface MyWidgetProps extends PropTypes {
  [MyWidgetProp.LABEL]: string;
  [MyWidgetProp.COUNT]: number;
}

export const myWidgetProps: PropConfigMap<MyWidgetProps> = {
  [MyWidgetProp.LABEL]: {
    default: '',
    description: 'The label text',
    control: { type: ControlType.TEXT },
  },
  [MyWidgetProp.COUNT]: {
    default: 0,
    description: 'The item count',
    control: { type: ControlType.NUMBER },
  },
};
```

The component then imports the enum, interface, and config map and uses them when declaring each `@property`:

```ts
// my-widget.ts
import { MyWidgetProp, MyWidgetProps, myWidgetProps } from './my-widget.models';

@property({ type: Number })
[MyWidgetProp.COUNT]: MyWidgetProps[MyWidgetProp.COUNT] =
  myWidgetProps[MyWidgetProp.COUNT].default;
```

Never hard-code default values or types in the component file — always derive them from the models file.

**Import order within files:**

1. Third-party (`lit`, `mobx`, `@ss/ui`, etc.)
2. Models/lib (`@/models`, `@/lib`)
3. Events (`@/events`)
4. Components (`@/components`)
5. Styles (`@/styles`)

Path alias: `@/` → `src/`

## Views & Routing

| Route         | Component              | Purpose                     |
| ------------- | ---------------------- | --------------------------- |
| `/`           | `entity-form-view`     | Main input form             |
| `/entities`   | `entity-list-view`     | List with filtering/sorting |
| `/entity/:id` | `entity-form`          | Edit single entity          |
| `/admin`      | `admin-dashboard-view` | Schema/config management    |
| `/login`      | `login-form`           | Authentication              |
| `/account`    | `account-form`         | User settings               |
| `/list/:id`   | `public-list-view`     | Public shared list          |

## External Packages

- **`@ss/ui`** (`projects/ui`) — shared Lit component library; 30+ components with Storybook docs (`npm run storybook` in that repo)
- **`@ss/identity`** (`projects/identity`) — shared auth/identity utilities
- **`api-spec`** — shared TypeScript interfaces: `Entity`, `EntityConfig`, `List`, `ListFilter`, `ListConfig`, `Setting`, etc.

Keep `api-spec` version in sync when making API contract changes. Internal packages are referenced via GitHub npm registry URLs with version pinning in `package.json`.

## API Spec

The OpenAPI spec for `gapi` lives at `docs/openapi.latest.json` (not committed — fetched at dev/CI time via `npm run fetch-spec`, which requires `GAPI_SPEC_STORAGE_ACCOUNT` and `GAPI_SPEC_STORAGE_KEY` env vars). Read it when adding or modifying methods in `NetworkStorage` or any code that calls the backend API. If the file doesn't exist, tell the user to run `npm run fetch-spec` before proceeding.

## Local Backend

`gapi` runs locally on port 9999 (`npm start` in `projects/gapi`). Set `APP_BASE_API_URL=http://localhost:7071/api/action` to point orbit at the local backend instead of production.

## Prettier Config

`singleQuote: true`, `arrowParens: 'avoid'`

## Coding Conventions

- Every statement is terminated with a semicolon
- Use the One True Brace Style (never omit braces)
- Do not hard code any messages in the UI elements. Always use translate() function with a camelCased key.
- Every function must include a return type
- SVG icons should never be inserted inline. Create new component for icon if it doesn't exist in `components/svg-icon/svg`
- Every custom event must have its own class extending `CustomEvent<TPayload>`, a named export for the event name string, and a payload type — never dispatch a bare `new CustomEvent(...)`. Events with no payload use `Record<string, never>` as the type. See `src/events/` for examples.

See [docs/code-hygeine.md](docs/code-hygeine.md) for further details on code hygeine and cleanup routines.

## Storage layer

`OFFLINE_CACHE_ENABLED = true` in `src/lib/Storage.ts`, so the active delegate is `OfflineCacheStorage`, not `NetworkStorage`. The `@delegateSource()` decorator routes calls to the first active delegate that has the method.

**When adding a new storage method:**

1. Add the signature to `StorageSchema` (`src/models/Storage.ts`)
2. Implement it in `NetworkStorage` (`src/lib/NetworkStorage.ts`)
3. Add a `@delegateSource()` stub in `Storage` (`src/lib/Storage.ts`)
4. Add a pass-through in `OfflineCacheStorage` (`src/lib/OfflineCacheStorage.ts`) — either delegating to `networkStorage` directly (network-only ops) or with offline queue logic (cacheable ops). **Skipping step 4 means the method is never called.**

## Collapsable panels

When adding a collapsable panel (via `ss-collapsable`) inside a list component, always integrate with `collapsablePanelState` so open/closed state persists across renders:

1. **In the list component** — add an `isPanelOpen(id: number): boolean` method:
   - Return `true` when `!id` (new, unsaved items should default open).
   - Otherwise return `this.state.collapsablePanelState[\`<panelKey>-${id}\`] || false`.
2. **Bind the open attribute** — use `?open=${this.isPanelOpen(item.id)}` on the form element.
3. **After a successful save** — dispatch a `CollapsableToggledEvent` with `isOpen: true` and the matching `panelId` so the panel stays open after the item gets its server-assigned id.
4. **In the form component** — set `panelId={\`<panelKey>-${this.localConfig.id}\`}`on`ss-collapsable`so the event the collapsable emits carries the correct id for`app-container` to persist.

The `app-container` already listens for `collapsable-toggled` events that bubble up and calls `state.setCollapsablePanelState(panelId, isOpen)`. No extra wiring is needed there.

See `medal-config-list` / `medal-config-form` and `entity-config-list` / `entity-config-form` for reference implementations.

## Extra rules

- Keep all edits, reads and and shell commands confined to this projects root directory or its subdirectories. Do not traverse into directories outside of this projects root
- When the user references a type from `api-spec` that isn't in the currently installed version, do not define it locally. First check whether the type exists in the local `api-spec` source at `/Users/aaron/projects/api-spec` and, if so, ask the user to update the `api-spec` version in `package.json` (or do so yourself if instructed). If the type doesn't exist there either, flag this to the user and ask for clarification before proceeding.
- Whenever an <img> tag is used, use crossorigin="anonymous" if the image src is not hard coded (if the image comes from user generated data for example, because the server may be external then)
- Unless specifically instructed to do so, never create an interface that involves a large text field being added to save a JSON blob. In almost all circumstances, if a model stores a JSON blob, there are associated models that should be used to build richer forms consisting of numerous controls that should generate the JSON.
- Views must stay lightweight: no business logic, no data fetching, no non-trivial state. A view's job is to compose components, handle auth gating, and wire up top-level routing concerns. Extract everything else into dedicated components.
- Whenever new delete functionality is added, always gate it behind a `confirmation-modal` from `@ss/ui/components/confirmation-modal`. Use a `@state() confirmDelete*Id` to track the pending delete, show the modal with `?open=${...}`, confirm via `@confirmation-accepted`, and cancel via `@confirmation-declined`. Never delete immediately on button click.
- Before making changes to a component, verify it is actually used in the codebase (`grep -r "component-tag-name" src --include="*.ts" -l`). If the only references are the component's own file and its models file, the component is likely deprecated. Ask the user whether to delete it before spending time on it.
- Never define event handler callbacks inline in templates when the handler body has more than one line of functional code. Extract them as private class methods instead.
