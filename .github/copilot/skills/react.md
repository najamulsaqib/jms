---
description: Expert in React 19 patterns for the JMS Tax application. Handles hooks, component composition, performance optimization, and all available UI components.
---

# React Skill

You are a React 19 expert for the JMS Tax Consultancy Electron application.

## Your Responsibilities

1. **Component Architecture:** Build reusable, composable React components using the project's existing component library
2. **Hooks:** Create and use custom hooks following React best practices
3. **State Management:** Manage local state with hooks, server state with React Query
4. **Performance:** Optimize rendering and prevent unnecessary re-renders
5. **TypeScript:** Ensure proper typing for props, state, and hooks

## Project Context

- **React Version:** 19.0.0
- **Router:** React Router DOM 7.3.0
- **State:** React Query for server state, hooks for local state
- **Styling:** TailwindCSS
- **UI:** Custom component library at `src/renderer/components/` + HeadlessUI (for DropdownMenu/Modal only) + Heroicons
- **Path alias:** `@components/` → `src/renderer/components/`

---

## UI Component Library

All components live under `src/renderer/components/`. **Always prefer these over raw HTML elements or native `<select>`, `<input>`, `<button>` tags.**

---

### `SelectField` — Combobox / Dropdown

**Import:** `import SelectField from '@components/ui/SelectField';`

Portal-based combobox with search filtering, single and multi-select modes, smart flip (opens upward when near the bottom of the viewport), and light/dark variants. The dropdown renders into `document.body` via `createPortal` — it is never clipped by `overflow: hidden` ancestors.

**Never use a native `<select>` element.** Always use `SelectField`.

```tsx
// Single select (most common)
<SelectField
  id="status"
  label="Status"
  value={status}
  onChange={(value) => setStatus(value)}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
/>

// Compact, no label — for filter bars
<SelectField
  value={field}
  onChange={(value) => setField(value)}
  options={FIELD_OPTIONS}
  size="sm"
  className="w-36"
/>

// Dark variant — for dark toolbars / floating bars
<SelectField
  value={status}
  onChange={(value) => onStatusChange(value as TaxRecordStatus)}
  options={STATUS_OPTIONS}
  size="sm"
  variant="dark"
  className="w-36"
/>

// Multi-select
<SelectField
  multiple
  value={selectedIds}
  onChange={(values) => setSelectedIds(values)}
  options={options}
  label="Assign Tags"
/>

// With label, hint, and error
<SelectField
  id="portal"
  label="Portal"
  hint="Which portal to associate this record with"
  error={errors.portal}
  value={portalId}
  onChange={(value) => setPortalId(value)}
  options={portalOptions}
/>

// Inside a modal (portal rendering escapes overflow clipping automatically)
<SelectField
  value={mapping[field.id] ?? ''}
  onChange={(value) => setMapping((prev) => ({ ...prev, [field.id]: value }))}
  options={[
    { value: '', label: '— not mapped —' },
    ...headers.map((h) => ({ value: h, label: h })),
  ]}
  size="sm"
/>
```

**Props:**

| Prop          | Type                                             | Default     | Notes                                            |
| ------------- | ------------------------------------------------ | ----------- | ------------------------------------------------ |
| `value`       | `string` \| `string[]`                           | —           | String for single, string[] for multi            |
| `onChange`    | `(v: string) => void` \| `(v: string[]) => void` | —           | Matches value type                               |
| `options`     | `{ value: string; label: string }[]`             | —           | Required                                         |
| `multiple`    | `boolean`                                        | `false`     | Enables multi-select with checkboxes             |
| `label`       | `string`                                         | —           | Omit for inline/filter use (no wrapper rendered) |
| `hint`        | `string`                                         | —           | Helper text below label                          |
| `error`       | `string`                                         | —           | Red error text + red border                      |
| `placeholder` | `string`                                         | `'Select…'` |                                                  |
| `disabled`    | `boolean`                                        | `false`     |                                                  |
| `size`        | `'sm' \| 'md'`                                   | `'md'`      | `'sm'` for filter bars                           |
| `variant`     | `'light' \| 'dark'`                              | `'light'`   | `'dark'` for dark toolbars                       |
| `className`   | `string`                                         | `''`        | Controls outer width, e.g. `"w-36 flex-1"`       |
| `id`          | `string`                                         | —           | Links label `for` attribute                      |

**Numeric options:** Convert via `String(n)` / `Number(value)`:

```tsx
<SelectField
  value={String(pageSize)}
  onChange={(value) => setPageSize(Number(value))}
  options={[10, 25, 50, 100].map((n) => ({
    value: String(n),
    label: String(n),
  }))}
  size="sm"
/>
```

---

### `Button` — Primary Action Button

**Import:** `import Button from '@components/ui/Button';`

Full-width-capable button with variants, sizes, loading state, and optional leading icon. On mobile, icon-only buttons show just the icon; the text label appears at `sm:` breakpoint.

```tsx
// Primary
<Button onClick={handleSave}>Save</Button>

// With loading state
<Button busy={isSaving} onClick={handleSave}>Save</Button>

// With icon (responsive: icon only on mobile, icon + label on sm+)
import { PlusIcon } from '@heroicons/react/20/solid';
<Button icon={PlusIcon} onClick={handleAdd}>Add Record</Button>

// Danger
<Button variant="danger" onClick={handleDelete}>Delete</Button>

// Secondary / ghost
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>
<Button variant="ghost" onClick={handleBack}>Back</Button>

// Small size
<Button size="sm" variant="secondary">Filter</Button>
```

**Props:**

| Prop       | Type                                              | Default     | Notes                                          |
| ---------- | ------------------------------------------------- | ----------- | ---------------------------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` |                                                |
| `size`     | `'sm' \| 'md' \| 'lg'`                            | `'md'`      |                                                |
| `busy`     | `boolean`                                         | `false`     | Shows spinner + "Processing…", disables button |
| `icon`     | `ComponentType<{ className?: string }>`           | —           | Heroicon component reference                   |
| `disabled` | `boolean`                                         | —           | Inherited from `ButtonHTMLAttributes`          |
| `...rest`  | `ButtonHTMLAttributes<HTMLButtonElement>`         | —           | `type`, `onClick`, etc.                        |

---

### `IconButton` — Icon-only Action Button

**Import:** `import IconButton from '@components/ui/IconButton';`

Square icon-only button for table row actions, toolbars, etc.

```tsx
import { PencilIcon, TrashIcon } from '@heroicons/react/20/solid';

<IconButton
  icon={<PencilIcon className="h-4 w-4" />}
  onClick={() => handleEdit(row.id)}
  title="Edit"
/>

<IconButton
  icon={<TrashIcon className="h-4 w-4" />}
  onClick={() => handleDelete(row.id)}
  variant="danger"
  title="Delete"
/>
```

**Props:**

| Prop        | Type                                | Default     |
| ----------- | ----------------------------------- | ----------- |
| `icon`      | `ReactNode`                         | —           |
| `variant`   | `'default' \| 'subtle' \| 'danger'` | `'default'` |
| `size`      | `'sm' \| 'md' \| 'lg'`              | `'md'`      |
| `onClick`   | `() => void`                        | —           |
| `disabled`  | `boolean`                           | `false`     |
| `title`     | `string`                            | —           |
| `className` | `string`                            | `''`        |

---

### `TextField` — Text Input

**Import:** `import TextField from '@components/ui/TextField';`

Labeled text input with optional hint, error, prefix, and suffix slots.

```tsx
<TextField
  id="name"
  label="Client Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// With hint and error
<TextField
  id="email"
  label="Email"
  type="email"
  hint="Used for all correspondence"
  error={errors.email}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With prefix/suffix
<TextField
  id="amount"
  label="Amount"
  prefix="$"
  suffix={<CurrencyDollarIcon className="h-4 w-4 text-slate-400" />}
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
/>
```

**Props:**

| Prop      | Type                                    | Notes                                                        |
| --------- | --------------------------------------- | ------------------------------------------------------------ |
| `label`   | `string`                                | Required                                                     |
| `hint`    | `string`                                | Helper text below label                                      |
| `error`   | `string`                                | Red error text + border                                      |
| `prefix`  | `ReactNode`                             | Rendered inside left edge of input                           |
| `suffix`  | `ReactNode`                             | Rendered inside right edge of input                          |
| `...rest` | `InputHTMLAttributes<HTMLInputElement>` | `type`, `value`, `onChange`, `placeholder`, `disabled`, etc. |

---

### `CheckboxField` — Checkbox with Label

**Import:** `import CheckboxField from '@components/ui/CheckboxField';`

```tsx
<CheckboxField
  id="consent"
  label="I agree to the terms"
  checked={consent}
  onChange={(e) => setConsent(e.target.checked)}
/>

// With hint
<CheckboxField
  id="notify"
  label="Email notifications"
  hint="Receive reminders before filing deadlines"
  checked={notify}
  onChange={(e) => setNotify(e.target.checked)}
/>
```

**Props:** `label` (required), `hint`, plus all `InputHTMLAttributes<HTMLInputElement>` except `type`.

---

### `Card` — Content Container

**Import:** `import Card from '@components/ui/Card';`

White rounded card with border and shadow.

```tsx
// Default (md padding)
<Card>
  <p>Content here</p>
</Card>

// Custom padding
<Card padding="none" className="overflow-hidden">
  <DataTable ... />
</Card>

// No padding + extra class
<Card padding="sm" className="flex flex-col gap-4">
  ...
</Card>
```

**Props:**

| Prop        | Type                             | Default |
| ----------- | -------------------------------- | ------- |
| `padding`   | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'`  |
| `className` | `string`                         | `''`    |
| `children`  | `ReactNode`                      | —       |

---

### `Chip` — Status Badge / Tag

**Import:** `import { Chip } from '@components/ui/Chip';`

Colored label chip for statuses, tags, and filters. Supports optional remove button and click interaction.

```tsx
// Status badge
<Chip variant="green">Active</Chip>
<Chip variant="red">Inactive</Chip>
<Chip variant="amber">Late Filer</Chip>
<Chip variant="primary">New</Chip>

// With icon
import { CheckCircleIcon } from '@heroicons/react/20/solid';
<Chip variant="green" icon={<CheckCircleIcon className="h-3 w-3" />}>Verified</Chip>

// Removable tag
<Chip variant="primary" onRemove={() => removeTag(tag.id)}>
  {tag.name}
</Chip>

// Clickable filter chip
<Chip
  variant={isActive ? 'primary' : 'outline'}
  clickable
  onClick={() => toggleFilter()}
>
  Show Inactive
</Chip>

// Full-rounded pill, larger size
<Chip variant="blue" rounded="full" size="md">Processing</Chip>
```

**Variant options:** `default` `grey` `primary` `outline` `green` `red` `amber` `purple` `blue` `teal` `cyan` `indigo` `violet` `fuchsia` `pink` `rose` `sky` `emerald` `lime` `yellow` `orange`

**Props:**

| Prop        | Type                   | Default     |
| ----------- | ---------------------- | ----------- |
| `variant`   | (see above)            | `'default'` |
| `size`      | `'sm' \| 'md' \| 'lg'` | `'sm'`      |
| `rounded`   | `'default' \| 'full'`  | `'default'` |
| `icon`      | `ReactNode`            | —           |
| `onRemove`  | `() => void`           | —           |
| `clickable` | `boolean`              | `false`     |

---

### `ConfirmDialog` — Destructive Action Confirmation

**Import:** `import ConfirmDialog from '@components/ui/ConfirmDialog';`

Modal dialog for confirming irreversible actions (deletes, bulk operations, etc.).

```tsx
const [open, setOpen] = useState(false);

<ConfirmDialog
  isOpen={open}
  title="Delete Record"
  message="This action cannot be undone. The tax record will be permanently removed."
  confirmLabel="Delete"
  confirmVariant="danger"
  busy={isDeleting}
  onConfirm={async () => {
    await deleteRecord(id);
    setOpen(false);
  }}
  onCancel={() => setOpen(false)}
/>;
```

**Props:**

| Prop             | Type                                              | Default     |
| ---------------- | ------------------------------------------------- | ----------- |
| `isOpen`         | `boolean`                                         | —           |
| `title`          | `string`                                          | —           |
| `message`        | `ReactNode`                                       | —           |
| `confirmLabel`   | `string`                                          | —           |
| `cancelLabel`    | `string`                                          | `'Cancel'`  |
| `confirmVariant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` |
| `busy`           | `boolean`                                         | `false`     |
| `onConfirm`      | `() => void \| Promise<void>`                     | —           |
| `onCancel`       | `() => void`                                      | —           |

---

### `Modal` — Reusable Dialog Shell

**Import:** `import Modal from '@components/ui/Modal';`

Reusable dialog wrapper used by page modals and by `ConfirmDialog`.

```tsx
<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Bulk Status Update"
  description="Select a status to apply to your records"
  size="sm"
  footer={
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleApply}>Apply</Button>
    </div>
  }
>
  <p className="text-sm text-slate-600">Modal body content</p>
</Modal>

// Full custom header/body layouts
<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Import CSV"
  size="lg"
  hideHeader
  bodyClassName="p-0"
>
  <CustomCsvImportWizard />
</Modal>
```

**Props:**

| Prop              | Type                           | Default       |
| ----------------- | ------------------------------ | ------------- |
| `isOpen`          | `boolean`                      | —             |
| `onClose`         | `() => void`                   | —             |
| `title`           | `ReactNode`                    | —             |
| `description`     | `ReactNode`                    | —             |
| `children`        | `ReactNode`                    | —             |
| `footer`          | `ReactNode`                    | —             |
| `size`            | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`        |
| `closeOnBackdrop` | `boolean`                      | `true`        |
| `hideHeader`      | `boolean`                      | `false`       |
| `bodyClassName`   | `string`                       | `'px-6 py-6'` |

---

### `DropdownMenu` — Context / Actions Menu

**Import:** `import DropdownMenu from '@components/ui/DropdownMenu';`

HeadlessUI-based dropdown with icon-or-text trigger button, item icons, badge counts, danger items, and optional dividers.

```tsx
import { PencilIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

<DropdownMenu
  items={[
    {
      label: 'Edit',
      icon: PencilIcon,
      onClick: () => openEdit(row.id),
    },
    {
      label: 'Export',
      icon: ArrowDownTrayIcon,
      onClick: () => exportRecord(row.id),
      divider: true,  // adds separator after this item
    },
    {
      label: 'Delete',
      icon: TrashIcon,
      onClick: () => confirmDelete(row.id),
      variant: 'danger',
    },
  ]}
/>

// Text trigger with label
<DropdownMenu
  buttonVariant="text"
  buttonLabel="Actions"
  items={menuItems}
/>

// With badge count
{
  label: 'Notifications',
  badge: 3,
  onClick: () => openNotifications(),
}
```

**`DropdownMenuItem` shape:**

| Field      | Type                                    | Notes                    |
| ---------- | --------------------------------------- | ------------------------ |
| `label`    | `string`                                | —                        |
| `icon`     | `ComponentType<{ className?: string }>` | Heroicon component       |
| `onClick`  | `() => void`                            | —                        |
| `variant`  | `'default' \| 'danger'`                 | `'danger'` = red styling |
| `disabled` | `boolean`                               | —                        |
| `badge`    | `string \| number`                      | Blue pill counter        |
| `divider`  | `boolean`                               | Adds line after item     |

---

### `DropZone` — File Upload Area

**Import:** `import DropZone from '@components/ui/DropZone';`

Drag-and-drop + click-to-browse file input with accessible keyboard support.

```tsx
<DropZone
  onFile={(file) => handleFile(file)}
  accept=".csv"
  acceptLabel="CSV files only"
/>;

// Custom icon and title
import { TableCellsIcon } from '@heroicons/react/24/outline';
<DropZone
  onFile={handleFile}
  accept=".csv,.xlsx"
  acceptLabel="CSV or Excel files"
  title="Drop your spreadsheet here, or"
  icon={TableCellsIcon}
/>;
```

**Props:**

| Prop          | Type                                    | Default                     |
| ------------- | --------------------------------------- | --------------------------- |
| `onFile`      | `(file: File) => void`                  | —                           |
| `accept`      | `string`                                | `'*'`                       |
| `acceptLabel` | `string`                                | —                           |
| `title`       | `string`                                | `'Drop your file here, or'` |
| `icon`        | `ComponentType<{ className?: string }>` | `DocumentTextIcon`          |

---

### `DataTable` — Sortable Data Table

**Import:** `import DataTable, { type DataTableColumn } from '@components/table/DataTable';`

Generic typed table with sortable columns, sticky pinned columns, row click, and a footer slot (used for `Pagination`).

```tsx
type User = { id: string; name: string; email: string; createdAt: string };

const columns: DataTableColumn<User>[] = [
  {
    id: 'name',
    header: 'Name',
    sortable: true,
    render: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: 'email',
    header: 'Email',
    render: (row) => row.email,
  },
  {
    id: 'actions',
    header: '',
    align: 'right',
    render: (row) => (
      <DropdownMenu items={buildMenuItems(row)} />
    ),
  },
];

<DataTable
  columns={columns}
  rows={users}
  getRowId={(row) => row.id}
  sortState={sort}
  onSortChange={setSort}
  onRowClick={(row) => navigate(`/users/${row.id}`)}
  footer={
    <tr>
      <td colSpan={columns.length}>
        <Pagination ... />
      </td>
    </tr>
  }
/>
```

**`DataTableColumn<T>` shape:**

| Field       | Type                            | Notes                                                                         |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------- |
| `id`        | `string`                        | Column key; use `'actions'` or `'checkbox'` to disable row-click on that cell |
| `header`    | `ReactNode`                     | Column heading                                                                |
| `render`    | `(row: T) => ReactNode`         | Cell renderer                                                                 |
| `sortable`  | `boolean`                       | Shows sort chevrons                                                           |
| `align`     | `'left' \| 'center' \| 'right'` | `'left'` default                                                              |
| `pinned`    | `boolean`                       | Sticky left column with shadow border                                         |
| `className` | `string`                        | Extra classes on th/td                                                        |

**`DataTableProps<T>`:**

| Prop           | Type                                                  | Notes                                  |
| -------------- | ----------------------------------------------------- | -------------------------------------- |
| `rows`         | `T[]`                                                 | —                                      |
| `getRowId`     | `(row: T) => string \| number`                        | Unique row key                         |
| `sortState`    | `{ key: string; direction: 'asc' \| 'desc' } \| null` | Controlled sort                        |
| `onSortChange` | `(next: SortState \| null) => void`                   | `null` = clear sort                    |
| `onRowClick`   | `(row: T) => void`                                    | Makes rows cursor-pointer              |
| `emptyMessage` | `string`                                              | Shown with bug icon when rows is empty |
| `footer`       | `ReactNode`                                           | Rendered inside `<tfoot>`              |

---

### `Pagination` — Table Pagination Controls

**Import:** `import Pagination from '@components/table/Pagination';`

Rows-per-page selector + page window navigator. Renders as a footer row inside `DataTable`.

```tsx
<Pagination
  page={page}
  pageSize={pageSize}
  total={totalRecords}
  onPageChange={setPage}
  onPageSizeChange={(size) => {
    setPageSize(size);
    setPage(0);
  }}
/>
```

**Props:** `page` (0-indexed), `pageSize`, `total`, `onPageChange`, `onPageSizeChange`.

---

### `EmptyState` — Zero-data Placeholder

**Import:** `import EmptyState from '@components/common/EmptyState';`

Centered empty state with optional icon, description, and action CTA.

```tsx
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

<EmptyState
  icon={<DocumentMagnifyingGlassIcon className="h-full w-full" />}
  title="No records found"
  description="Try adjusting your filters or importing new records."
  action={
    <Button onClick={openImport} icon={PlusIcon}>
      Import CSV
    </Button>
  }
/>;
```

**Props:** `title` (required), `icon`, `description`, `action`.

---

### `LoadingSpinner` — Activity Indicator

**Import:** `import LoadingSpinner from '@components/common/LoadingSpinner';`

```tsx
// Inline, default size
<LoadingSpinner />

// Full page centered
<div className="flex h-full items-center justify-center">
  <LoadingSpinner size="lg" />
</div>

// Small inline
<LoadingSpinner size="sm" className="ml-2" />
```

**Props:** `size` (`'sm' | 'md' | 'lg'`, default `'md'`), `className`.

---

### `StatCard` — KPI / Dashboard Metric Card

**Import:** `import StatCard from '@components/common/StatCard';`

```tsx
import { UsersIcon } from '@heroicons/react/24/outline';

<StatCard
  label="Total Clients"
  value={1234}
  subtext="+12 this month"
  icon={UsersIcon}
  color="blue"
/>;
```

**Props:**

| Prop      | Type                                               | Notes                   |
| --------- | -------------------------------------------------- | ----------------------- |
| `label`   | `string`                                           | Uppercase label         |
| `value`   | `number \| string`                                 | Large number display    |
| `subtext` | `string`                                           | Small secondary line    |
| `icon`    | `ComponentType<{ className?: string }>`            | Heroicon                |
| `color`   | `'green' \| 'orange' \| 'red' \| 'blue' \| 'neon'` | Left border + icon tint |

---

## Custom Hooks Patterns

### Data Fetching Hook

```typescript
// src/renderer/hooks/useTaxRecords.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useTaxRecords() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['tax-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tax_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-records'] });
      toast.success('Record deleted');
    },
    onError: () => toast.error('Failed to delete record'),
  });

  return {
    records: data ?? [],
    isLoading,
    error,
    deleteRecord: deleteRecord.mutate,
    isDeleting: deleteRecord.isPending,
  };
}
```

### Debounce Hook

```typescript
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedQuery = useDebounce(searchQuery, 300);
const { data } = useQuery({ queryKey: ['search', debouncedQuery], ... });
```

### Modal State Hook

```typescript
import { useState } from 'react';

export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
  };
}

// Usage
const deleteModal = useModal();

<>
  <Button variant="danger" onClick={deleteModal.open}>Delete</Button>
  <ConfirmDialog
    isOpen={deleteModal.isOpen}
    title="Delete Record"
    message="This cannot be undone."
    confirmLabel="Delete"
    confirmVariant="danger"
    onConfirm={async () => { await deleteRecord(id); deleteModal.close(); }}
    onCancel={deleteModal.close}
  />
</>
```

---

## React Router Patterns

```typescript
import { useNavigate, useParams } from 'react-router-dom';

// Navigate programmatically
const navigate = useNavigate();
navigate(`/tax-records/${id}`);
navigate(-1); // go back

// Read route params
const { id } = useParams<{ id: string }>();
```

---

## Performance Optimization

```typescript
import { useMemo, useCallback } from 'react';

// Memoize expensive derived data
const filteredRows = useMemo(
  () => rows.filter((r) => r.status === activeStatus),
  [rows, activeStatus],
);

// Stable callback references (prevents child re-renders)
const handleRowClick = useCallback(
  (row: TaxRecord) => navigate(`/tax-records/${row.id}`),
  [navigate],
);
```

---

## Best Practices

1. **Always use project components** — never raw `<select>`, `<input>` or `<button>` tags
2. **SelectField for all dropdowns** — portal-based, never clipped, always consistent
3. **Button `busy` prop** — for async actions; never manually toggle `disabled` during loading
4. **ConfirmDialog for destructive actions** — all deletes and bulk operations need confirmation
5. **DataTable + Pagination** — standard table pattern; pass `Pagination` as the `footer` prop
6. **EmptyState** — always show a meaningful empty state with a CTA when a list has 0 items
7. **Chip for statuses** — never plain text for `active` / `inactive` / `late-filer` labels
8. **useCallback/useMemo** — wrap handlers and derived data passed to memoized children
9. **Keys:** Prefer record IDs over array indexes in lists
10. **Type safety:** Always type column definitions with `DataTableColumn<YourType>`
