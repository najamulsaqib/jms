# GitHub Copilot Agent Customization

This document describes the coding standards and skills configured for the JMS Tax Consultancy project.

## 📋 Project Rules (.instructions.md)

The `.instructions.md` file contains the core coding standards that **ALL** agents must follow:

### 1. **Component Organization**

- ✅ Always use existing components from `src/renderer/components/`
- ✅ Never create components in pages
- ✅ Organize by category: `ui/`, `common/`, `layout/`, `table/`, `modals/`
- ✅ Use PascalCase for component files (`UserCard.tsx`)

### 2. **Hooks Pattern**

- ✅ NO direct database calls in pages/components
- ✅ ALL data fetching goes through `src/renderer/hooks/`
- ✅ Use React Query for server state management
- ✅ Use camelCase for hook files (`useUserData.ts`)

### 3. **Pages Structure** (Folder-Based Routing)

```
pages/
  dashboard/
    index.tsx           ✅ Correct
    components/         ✅ Page-specific components
  tax-records/
    index.tsx
    new/
      index.tsx
    [id]/
      index.tsx
```

**NOT:**

```
pages/
  dashboard/Dashboard.tsx  ❌ Wrong
```

### 4. **Naming Conventions**

- **Folders:** kebab-case (`tax-records`, `user-settings`)
- **Hooks:** camelCase (`useTaxRecords.ts`, `useAuth.ts`)
- **Variables:** camelCase (`taxRecord`, `isLoading`)
- **Components:** PascalCase (`UserCard.tsx`, `Button.tsx`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_SIZE`, `API_URL`)

### 5. **UI Library Standards**

- **Icons:** ONLY `@heroicons/react` (outline or solid)
- **UI Primitives:** `@headlessui/react` for complex components
- **Styling:** TailwindCSS only (no CSS modules)
- **Notifications:** `sonner` for toasts

### 6. **Code Quality**

- Write clean, self-documenting code
- Use TypeScript strictly (no `any` without justification)
- Keep functions small and focused
- Handle errors gracefully with user-friendly messages
- Always implement loading and error states

## 🎯 Specialized Skills

Four specialized skills have been created for domain-specific expertise:

### 1. **Supabase Skill** (`supabase.md`)

Expert in Supabase integration for JMS Tax.

**Capabilities:**

- Database operations with supabase-js client
- React Query integration patterns
- Authentication flows
- Real-time subscriptions
- Type-safe database operations

**Key Patterns:**

- Query hooks for read operations
- Mutation hooks for write operations
- Optimistic updates
- Pagination and search
- Error handling with toast notifications

### 2. **Electron Skill** (`electron.md`)

Expert in Electron-specific features for desktop app.

**Capabilities:**

- IPC communication (main ↔ renderer)
- Window management
- Native features (file system, notifications)
- Security best practices
- Auto-updates

**Key Patterns:**

- Secure contextBridge setup
- File operations (select, save, read)
- Custom title bar
- PDF/CSV export
- Window controls

### 3. **React Skill** (`react.md`)

Expert in React 19 patterns and best practices.

**Capabilities:**

- Component architecture
- Custom hooks
- State management
- Performance optimization
- TypeScript patterns

**Key Patterns:**

- Compound components
- Render props
- Form handling
- Modal management
- Debouncing
- Local storage
- Memoization
- Lazy loading

### 4. **Data Layer Skill** (`data-layer.md`)

Expert in data conventions for the JMS Tax app.

**Capabilities:**

- camelCase ↔ snake_case transformation via `toCamelCase` / `toSnakeCase`
- Correct `mapRow` pattern for Supabase reads
- `toSnakeCase` usage for Supabase writes
- `userInfo` from `useAuth()` for all auth and profile data (never `user` or `user.user_metadata`)
- Per-user uniqueness validation pattern

### 5. **TailwindCSS Skill** (`tailwindcss.md`)

Expert in utility-first styling with Tailwind.

**Capabilities:**

- Utility-first styling
- Responsive design (mobile-first)
- Design system consistency
- Custom components
- Performance optimization

**Key Patterns:**

- Button variants
- Input components
- Card layouts
- Modal styling
- Grid and flex layouts
- Responsive patterns
- Animations and transitions

## 🚀 How Agents Use These Files

### Automatic Loading

All agents in this project will automatically:

1. Load `.instructions.md` for core project rules
2. Access specialized skills when relevant tasks are detected
3. Apply naming conventions and architectural patterns
4. Use the correct libraries and tools

### When to Invoke Skills

The specialized skills are invoked automatically when:

- **Supabase Skill:** Working with database operations, auth, or real-time features
- **Electron Skill:** Implementing IPC, file operations, or native features
- **React Skill:** Creating components, hooks, or React patterns
- **TailwindCSS Skill:** Styling components or implementing layouts
- **Data Layer Skill:** Anything touching Supabase reads/writes, user profile, or uniqueness validation

### Manual Invocation

You can also explicitly request a skill:

```
"Use the Supabase skill to create a hook for managing clients"
"Use the React skill to optimize this component"
"Use the TailwindCSS skill to make this responsive"
```

## 📁 File Structure

```
.github/
  copilot/
    skills/
      supabase.md      # Database & auth patterns
      electron.md      # Desktop app patterns
      react.md         # Component patterns
      tailwindcss.md   # Styling patterns
      data-layer.md    # camelCase convention, mapRow, toSnakeCase, UserProfile
.instructions.md       # Core project rules
```

## 🔄 Migration Guide

To align existing code with these standards:

1. **Pages:** Move to folder structure with `index.tsx`
2. **Hooks:** Extract direct Supabase calls to hooks
3. **Components:** Identify reusable components, move to `components/`
4. **Naming:** Rename files to match conventions
5. **Imports:** Update import paths
6. **Testing:** Test thoroughly after refactoring

## ✅ Best Practices Checklist

Before committing code, verify:

- [ ] Components in correct folders (not in pages)
- [ ] No direct DB calls in components/pages
- [ ] Hooks use React Query
- [ ] Pages use folder structure (`index.tsx`)
- [ ] Naming follows conventions (kebab-case, camelCase, PascalCase)
- [ ] Only approved UI libraries used (Heroicons, Headless UI)
- [ ] TailwindCSS for all styling
- [ ] Loading and error states implemented
- [ ] TypeScript types properly defined
- [ ] Error handling with user-friendly messages

## 🛠️ Tech Stack Reference

- **Framework:** Electron 35.0.2 + React 19.0.0
- **Language:** TypeScript 5.8.2
- **State:** @tanstack/react-query 5.96.2
- **Routing:** react-router-dom 7.3.0
- **Database:** @supabase/supabase-js 2.101.1
- **Styling:** TailwindCSS 4.2.2
- **UI:** @headlessui/react 2.2.9 + @heroicons/react 2.2.0
- **Notifications:** sonner 2.0.7
- **PDF:** jspdf 4.2.1

## 📝 Notes

- These rules ensure code consistency across the team
- Skills provide deep expertise in specific domains
- All agents will follow these standards automatically
- Update `.instructions.md` as project evolves
- Add new skills for additional domains as needed

---

**Last Updated:** 2026-04-04  
**Maintained By:** Development Team
