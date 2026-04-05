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
supabase
  .from('tax_records')
  .insert(toSnakeCase({ ...payload, userId }))

// Update
supabase
  .from('tax_records')
  .update(toSnakeCase({ ...payload, updatedAt: new Date().toISOString() }))
  .eq('id', id)
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

userInfo?.fullName       // ✅
userInfo?.email          // ✅
userInfo?.createdAt      // ✅
userInfo?.provider       // ✅
user?.user_metadata?.full_name  // ❌ — user is not exposed
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
query.eq('user_id', userId)
query.eq('reference_number', value)
query.order('created_at', { ascending: false })
```

## Checklist

When adding a new Supabase table/service:
- [ ] Responses wrapped in `mapRow()` using `toCamelCase()`
- [ ] Write payloads wrapped in `toSnakeCase()`
- [ ] No snake_case field names used in components or hooks
- [ ] Uniqueness validated per-user (not globally)
