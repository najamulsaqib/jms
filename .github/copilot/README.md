# GitHub Copilot Agent Customization

Configuration for AI-assisted development on the JMS Tax Consultancy project. This folder defines the rules and domain knowledge that all Copilot agents load automatically.

---

## File Map

```
.github/copilot/
  skills/
    react.md         — All UI components (full prop APIs) + React hooks patterns
    data-layer.md    — camelCase convention, mapRow, toSnakeCase, auth context
    supabase.md      — Database queries, mutations, real-time, React Query
    electron.md      — IPC, main/renderer boundary, native features, auto-update
    tailwindcss.md   — Tailwind conventions and responsive patterns
.instructions.md     — Core project rules applied to all files (source of truth)
CLAUDE.md            — Claude Code session context (loads .instructions.md + skills)
```

---

## Core Rules (`.instructions.md`)

These apply to every file touched in `src/renderer/` and `src/main/`.

### Component Organization

- Always use existing components from `src/renderer/components/` — never create one-off components inside a page file
- Component categories:
  - `ui/` — Button, TextField, SelectField, CheckboxField, Card, Chip, IconButton, DropdownMenu, DropZone, ConfirmDialog
  - `common/` — EmptyState, ServiceCard, LoadingSpinner, StatCard, FloatingActionBar
  - `layout/` — Sidebar, Header, AppLayout, TabBar
  - `table/` — DataTable, Pagination
- New shared components go in the appropriate subfolder, never in `pages/`

### Hooks Pattern

- No direct Supabase calls in pages or components — all data goes through `src/renderer/hooks/`
- Hooks use React Query (`@tanstack/react-query`) for all server state
- Available hooks: `useTaxRecords`, `usePortalPages`, `useNetworkStatus`, `useTabNavigate`, `useUpdater`

### Page Structure (folder-based routing)

```
pages/
  tax-records/
    index.tsx          ✅ main page
    components/        ✅ page-specific components
    [id]/
      index.tsx        ✅ detail page
```

Not `pages/tax-records/TaxRecords.tsx` ❌

### UI Rules

- **No native `<select>`** — always use `SelectField` (portal-based, never clipped)
- **No raw `<button>` for actions** — use `Button`, `IconButton`, or `DropdownMenu`
- **All components are default exports** — `import Button from '@components/ui/Button'`
- **HeadlessUI is internal only** — used inside `DropdownMenu` and `ConfirmDialog`; do not import it directly
- **Icons only from `@heroicons/react`** — `/20/solid` for compact, `/24/outline|solid` for standard
- **Styling:** TailwindCSS only — no CSS modules, no styled-components
- **Notifications:** `sonner` (`toast.success`, `toast.error`)

### Data Layer

- All Supabase data is **camelCase** on the frontend — use `toCamelCase` / `toSnakeCase` from `src/renderer/lib/caseTransform.ts`
- Never access `user.user_metadata` directly — use `userInfo` from `useAuth()`
- `email`, `cnic`, `referenceNumber` are unique **per user**, not globally

### Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `StatCard.tsx` |
| Hooks | camelCase | `useTaxRecords.ts` |
| Page folders | kebab-case | `tax-records/` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types | PascalCase | `TaxRecord` |

---

## Skills

Each skill file is a deep reference document for its domain. Read the relevant one before working in that area.

### `react.md` — UI Components + React Patterns

Full prop API tables for every component in the library, with usage examples for common scenarios (filter bars, dark toolbars, modals, tables). Also covers custom hooks, React Router, and performance patterns.

**Read this when:** building any UI, picking a component, writing a custom hook.

### `data-layer.md` — Data Conventions

The `mapRow` / `toCamelCase` / `toSnakeCase` patterns, the `useAuth()` → `userInfo` contract, and the parallel uniqueness validation approach.

**Read this when:** writing a new hook, adding a Supabase read/write, handling user profile data.

### `supabase.md` — Database & Auth

Supabase query patterns, mutation patterns, real-time subscriptions, React Query integration, and auth flows.

**Read this when:** adding a new table, writing complex queries, implementing real-time features.

### `electron.md` — Desktop / IPC

Main ↔ renderer IPC patterns via `contextBridge`, file system access, window management, native dialogs, auto-updater.

**Read this when:** adding native features, implementing file export/import, working in `src/main/`.

### `tailwindcss.md` — Styling

Tailwind conventions used in this project, responsive breakpoints, common layout patterns, design tokens.

**Read this when:** building new layouts, ensuring responsive design, matching the visual style.

---

## Pre-commit Checklist

- [ ] No components created inside page files
- [ ] No direct Supabase calls in components/pages (use hooks)
- [ ] No native `<select>` — using `SelectField`
- [ ] No raw `<button>` — using `Button` / `IconButton` / `DropdownMenu`
- [ ] All imports use default export form (`import X from '...'`)
- [ ] All Supabase reads use `toCamelCase` / `mapRow`
- [ ] All Supabase writes use `toSnakeCase`
- [ ] Loading and error states implemented
- [ ] Errors surfaced with `toast.error()`
- [ ] TypeScript — no untyped `any`
- [ ] Page folders follow `index.tsx` structure

---

## Tech Stack

| Layer | Package | Version |
|-------|---------|---------|
| Runtime | Electron | 35.0.2 |
| UI | React | 19.0.0 |
| Language | TypeScript | 5.8.2 |
| Server state | @tanstack/react-query | 5.96.2 |
| Routing | react-router-dom | 7.3.0 |
| Database | @supabase/supabase-js | 2.101.1 |
| Styling | TailwindCSS | 4.2.2 |
| UI primitives | @headlessui/react | 2.2.9 |
| Icons | @heroicons/react | 2.2.0 |
| Notifications | sonner | 2.0.7 |
| PDF export | jspdf | 4.2.1 |

---

**Last Updated:** 2026-04-10
