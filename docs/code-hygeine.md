# Code Hygeine

## 1. Imports

- Imports should be grouped based on the specified grouping in README.md, with one new line in between each group
- No unused imports should be used

## 2. Code Guidelines

- All code must adhere to one-true-bracestyle
- All functions must specify their return types
- Never-nest coding style; fail early and abstract otherwise nested business logic in function calls rather than deep nesting. Ideally, no nesting beyond 1 if statement within a function definition

## 3. Code Repetition

- As a general rule of thumb, follow the DRY principle
- As soon as code becomes repeated 3 times, break it into a re-usable function

## 4. logged-in / logged-out Components

The `logged-in` and `logged-out` components stamp their content by calling `tpl.content.cloneNode(true)` on a `<template>` child element. Because the content is cloned from an inert HTML `<template>`, Lit's binding engine **never processes it** — event bindings (`@event=...`), property bindings (`.prop=...`), and dynamic expressions (`${...}`) are silently dropped.

**Rule: never place Lit expressions inside a `<template>` tag.**

When a view needs dynamic/reactive content, bypass `logged-in`/`logged-out` entirely and check auth state directly in `render()` using `appState.authToken` (a MobX `@observable`). Because views extend `MobxLitElement`, reading `appState.authToken` in `render()` is enough to make the view re-render reactively when auth changes:

```typescript
render(): TemplateResult {
  if (!this.appState.authToken) {
    return html`<login-form></login-form>`;
  }
  return html`
    <some-component @my-event=${this.handleEvent}></some-component>
    ${this.showExtra ? html`<extra-component .data=${this.data}></extra-component>` : nothing}
  `;
}
```

Reserve `logged-in`/`logged-out` with `<template>` **only for fully static content** — simple component tags with no bindings or expressions.

## 5. Testify

- Identify the key areas dealing with custom business logic that is crucial to the operation of this program
- Ensure these crucial areas have unit tests
