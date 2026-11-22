# Mobile App Rules

This folder contains only the mobile app. Do not read, edit, or
create files outside this folder unless I explicitly ask.

## SOLID Principles (required for all code here)

- Single Responsibility: one job per class/function.
- Open/Closed: extend through new classes/interfaces instead of
  editing working code.
- Liskov Substitution: subtypes must be safely replaceable.
- Interface Segregation: small, focused interfaces.
- Dependency Inversion: depend on abstractions, use dependency
  injection.

## Architecture

- Use [MVVM / Clean Architecture] with separate UI, domain, and
  data layers.
- No business logic inside screens/components.
- Network calls go through one API/repository layer, never
  directly from UI code.

## Working Rules

- Read existing mobile code first and follow its current
  structure and naming.
- Keep changes minimal and limited to files the task needs.
- Before writing code, briefly state which SOLID principles apply.
- Don't refactor existing code unless I ask.
