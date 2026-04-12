---
description: Expert in the JMS Tax data layer conventions — camelCase transformation, Supabase read/write patterns, user profile access, and per-user uniqueness validation.
---

# Data Layer Skill

You are an expert in the JMS Tax data layer conventions.

## camelCase Convention

All Supabase responses (snake_case) are converted to camelCase before use. All write payloads are converted back to snake_case before hitting Supabase.

**Utilities:** `src/renderer/lib/caseTransform.ts`

```typescript
import { toCamelCase, toSnakeCase } from '@lib/caseTransform';
```

## Reading from Supabase

Always wrap raw Supabase rows through `mapRow()` using `toCamelCase`:

```typescript
function mapRow(row: Record<string, unknown>): TaxRecord {
  const r = toCamelCase(row);
  return {
    id: r.id as number,
    referenceNumber: r.referenceNumber as string,
    name: r.name as string,
    cnic: r.cnic as string,
    email: r.email as string,
    password: r.password as string,
    reference: r.reference as string,
    status: r.status as TaxRecordStatus,
    notes: (r.notes as string) || '',
    createdAt: r.createdAt as string,
    updatedAt: r.updatedAt as string,
  };
}

// In list queries:
return (data as Record<string, unknown>[]).map(mapRow);

// In single-row queries:
return mapRow(data as Record<string, unknown>);
```

## Writing to Supabase

Spread the camelCase payload into `toSnakeCase()` — never write out snake_case keys manually:

```typescript
// Create
supabase.from(TABLES.TAX_RECORDS).insert(toSnakeCase({ ...payload, userId }));

// Update
supabase
  .from(TABLES.TAX_RECORDS)
  .update(toSnakeCase({ ...payload, updatedAt: new Date().toISOString() }))
  .eq('id', id);
```

## Auth — User Info

`AuthContext` exposes a single `userInfo: UserInfo | null` that merges all auth and profile fields.
Never access `user`, `user.user_metadata`, or `profile` — they no longer exist on the context.

```typescript
export type UserInfo = {
  // Auth fields
  email: string;
  createdAt: string;
  provider: string;
  // Profile fields (from user_metadata, camelCased)
  fullName: string;
  companyName: string;
  address: string;
  phoneNumber: string;
  description: string;
};

// In any component:
const { userInfo } = useAuth();

userInfo?.fullName; // ✅
userInfo?.email; // ✅
userInfo?.createdAt; // ✅
userInfo?.provider; // ✅
user?.user_metadata?.full_name; // ❌ — user is not exposed
```

Writing profile updates goes through `AuthContext.updateProfile()` which calls `toSnakeCase()` internally.

## Per-User Uniqueness

`email`, `cnic`, and `reference_number` are unique **per user**, not globally.
DB constraints: `(user_id, email)`, `(user_id, cnic)`, `(user_id, reference_number)`.

`taxRecordApi.validateUniqueness()` checks all three in parallel and returns all errors at once:

```typescript
const errors = await taxRecordApi.validateUniqueness(
  { referenceNumber, cnic, email },
  excludeId, // pass current record id in edit mode
);
// errors may contain: errors.email, errors.cnic, errors.referenceNumber
```

## Query Builder Columns

The snake_case DB column names are only used inside Supabase query builder `.eq()`, `.order()`, `.ilike()` calls — these are DB references, not JS variables, and should stay as-is:

```typescript
// These are correct — query builder column references, not JS field names:
query.eq('user_id', userId);
query.eq('reference_number', value);
query.order('created_at', { ascending: false });
```

## Enums-First Constants

Do not hardcode table names, module names, audit action names, edge function names, page keys, page sizes, or intervals.

```typescript
import {
  TABLES,
  EDGE_FUNCTIONS,
  MODULES,
  AUDIT_ACTIONS,
  AUDIT_EVENTS,
  PAGE_KEYS,
  PAGE_SIZE,
  INTERVALS,
} from '@lib/enums';
```

Use these constants in all new and refactored code:

- `TABLES.*` for `supabase.from(...)`
- `EDGE_FUNCTIONS.*` for `supabase.functions.invoke(...)`
- `MODULES.*` for audit `module` values
- `AUDIT_ACTIONS.*` and `AUDIT_EVENTS.*` for audit values
- `PAGE_KEYS.*`, `PAGE_SIZE.*`, and `INTERVALS.*` in hooks and UI state/query behavior

## Audit Trail Pattern (Create/Update/Delete/Bulk/Export)

All mutation flows must write immutable audit entries via `auditLogApi.log(...)` from hooks/services.

```typescript
import { AUDIT_ACTIONS, AUDIT_EVENTS, MODULES } from '@lib/enums';
import { auditLogApi, diffRecord } from '@services/auditLog.api';

// Update flow example
const changes = diffRecord(beforeRecord, afterRecord);
if (changes) {
  await auditLogApi.log({
    module: MODULES.TAX_RECORD,
    recordId: String(afterRecord.id),
    action: AUDIT_ACTIONS.UPDATE,
    changedByName,
    changes,
    snapshot: { event: AUDIT_EVENTS.BULK_STATUS_UPDATED_SELECTED },
  });
}
```

Rules:

- Create: `AUDIT_ACTIONS.CREATE`
- Update: `AUDIT_ACTIONS.UPDATE` + `changes` from `diffRecord(before, after)`
- Delete: `AUDIT_ACTIONS.DELETE` + pre-delete `snapshot`
- Bulk: `AUDIT_ACTIONS.BULK_*` + event metadata in `snapshot`
- Export: `AUDIT_ACTIONS.EXPORT_PDF` / `AUDIT_ACTIONS.EXPORT_CSV` + `AUDIT_EVENTS.*`
- Never let audit logging failures block the primary operation

## Checklist

When adding a new Supabase table/service:

- [ ] Responses wrapped in `mapRow()` using `toCamelCase()`
- [ ] Write payloads wrapped in `toSnakeCase()`
- [ ] No snake_case field names used in components or hooks
- [ ] Uniqueness validated per-user (not globally)
- [ ] Table/module/action/event values come from `@lib/enums`
- [ ] All mutations (create/update/delete/bulk/export) write audit logs
