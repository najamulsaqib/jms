# JMS Tax — Claude Code Context

## Project Overview

JMS Tax Consultancy is an Electron desktop application (React 19 + Supabase) for managing tax records, client portals, and filings.

**Stack:** Electron · React 19 · TypeScript · Supabase · React Query · TailwindCSS · Heroicons · Sonner

---

## Mandatory Standards — read `.instructions.md` first

All coding standards, naming conventions, architecture rules, and data layer patterns are defined in [`.instructions.md`](.instructions.md).

Key rules to internalize before writing any code:

- **No direct Supabase calls in pages or components** — all data goes through hooks in `src/renderer/hooks/`
- **No native `<select>` elements** — always use `SelectField` from `@components/ui/SelectField`
- **No raw `<button>` for actions** — use `Button`, `IconButton`, or `DropdownMenu`
- **All components are default exports** — `import Button from '@components/ui/Button'`, never `import { Button }`
- **All Supabase data is camelCase on the frontend** — use `toCamelCase` / `toSnakeCase` from `src/renderer/lib/caseTransform.ts`
- **HeadlessUI is internal only** — used inside `DropdownMenu` and `Modal`, do not import it directly in pages/new components
- **Icons only from `@heroicons/react`** — `/20/solid` for compact, `/24/outline` or `/24/solid` for standard

---

## Skill Reference Files

Deep documentation for each domain lives in `.github/copilot/skills/`. Read the relevant file before working in that area.

| File                                                    | Covers                                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [react.md](.github/copilot/skills/react.md)             | All UI components with full prop APIs, custom hooks patterns, React Router, performance                  |
| [data-layer.md](.github/copilot/skills/data-layer.md)   | camelCase convention, `toCamelCase`/`toSnakeCase`, `mapRow` pattern, auth context, uniqueness validation |
| [supabase.md](.github/copilot/skills/supabase.md)       | Supabase queries, mutations, React Query integration, real-time subscriptions                            |
| [electron.md](.github/copilot/skills/electron.md)       | IPC communication, main/renderer process boundaries, window management, native features                  |
| [tailwindcss.md](.github/copilot/skills/tailwindcss.md) | Tailwind conventions, responsive patterns, design system tokens used in this project                     |

---

## Component Quick Reference

All components are in `src/renderer/components/` with path alias `@components/`.

### `ui/` — Base UI Elements

| Component       | Import                         | When to use                                                        |
| --------------- | ------------------------------ | ------------------------------------------------------------------ |
| `SelectField`   | `@components/ui/SelectField`   | Any dropdown / select — replaces all `<select>`                    |
| `Button`        | `@components/ui/Button`        | Primary actions. Props: `variant`, `size`, `busy`, `icon`          |
| `IconButton`    | `@components/ui/IconButton`    | Icon-only actions in tables/toolbars                               |
| `TextField`     | `@components/ui/TextField`     | Text inputs with label, hint, error, prefix/suffix                 |
| `CheckboxField` | `@components/ui/CheckboxField` | Labeled checkbox with optional hint                                |
| `Card`          | `@components/ui/Card`          | Content containers. Prop: `padding` (`none`/`sm`/`md`/`lg`)        |
| `Chip`          | `@components/ui/Chip`          | Status badges, tags. 20 color variants + removable/clickable       |
| `Modal`         | `@components/ui/Modal`         | Reusable modal shell for standard dialogs and custom modal layouts |
| `ConfirmDialog` | `@components/ui/ConfirmDialog` | Destructive action confirmation modals                             |
| `DropdownMenu`  | `@components/ui/DropdownMenu`  | Context menus with icon/badge/danger/divider items                 |
| `DropZone`      | `@components/ui/DropZone`      | Drag-and-drop file upload                                          |

### `common/` — Shared Business Components

| Component           | Import                                 | When to use                                       |
| ------------------- | -------------------------------------- | ------------------------------------------------- |
| `EmptyState`        | `@components/common/EmptyState`        | Zero-data placeholders with icon + CTA            |
| `LoadingSpinner`    | `@components/common/LoadingSpinner`    | Activity indicator. Prop: `size` (`sm`/`md`/`lg`) |
| `StatCard`          | `@components/common/StatCard`          | KPI metric cards on dashboards                    |
| `ServiceCard`       | `@components/common/ServiceCard`       | Navigation cards linking to app sections          |
| `FloatingActionBar` | `@components/common/FloatingActionBar` | Bulk action bar (appears when rows selected)      |

### `table/` — Table Components

| Component    | Import                         | When to use                                                  |
| ------------ | ------------------------------ | ------------------------------------------------------------ |
| `DataTable`  | `@components/table/DataTable`  | All data tables. Typed columns, sort, row click, footer slot |
| `Pagination` | `@components/table/Pagination` | Pass as `footer` prop to `DataTable`                         |

---

## Available Hooks

All in `src/renderer/hooks/`:

- `useTaxRecords` — tax records CRUD, filtering, bulk operations
- `usePortalPages` — portal management CRUD
- `useNetworkStatus` — online/offline detection
- `useTabNavigate` — tab-based navigation state
- `useUpdater` — Electron auto-updater

---

## Path Aliases

```
@components/ → src/renderer/components/
@shared/     → src/shared/
```

---

## File Naming Conventions

| Type             | Convention       | Example            |
| ---------------- | ---------------- | ------------------ |
| Components       | PascalCase       | `UserCard.tsx`     |
| Hooks            | camelCase        | `useTaxRecords.ts` |
| Page folders     | kebab-case       | `tax-records/`     |
| Constants        | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`    |
| Types/Interfaces | PascalCase       | `TaxRecord`        |
