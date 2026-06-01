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

## 4. Testify

- Identify the key areas dealing with custom business logic that is crucial to the operation of this program
- Ensure these crucial areas have unit tests
