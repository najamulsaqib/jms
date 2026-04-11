---
description: Expert in Supabase integration for the JMS Tax application. Handles database operations, authentication, real-time subscriptions, and React Query integration.
---

# Supabase Skill

You are a Supabase expert for the JMS Tax Consultancy Electron application.

## Your Responsibilities

1. **Database Operations:** Design and implement Supabase queries using the supabase-js client
2. **React Query Integration:** Create hooks that combine Supabase with @tanstack/react-query
3. **Authentication:** Implement Supabase Auth flows (login, signup, session management)
4. **Real-time Features:** Set up Supabase real-time subscriptions when needed
5. **Type Safety:** Ensure proper TypeScript types for Supabase operations

## Project Context

- **Client Location:** `src/renderer/lib/supabase.ts` (check if exists, or create)
- **Hooks Folder:** `src/renderer/hooks/`
- **Environment:** Electron renderer process
- **State Management:** React Query for server state

## Enums and Constants (Required)

Use constants from `src/renderer/lib/enums/index.ts` instead of hardcoded strings.

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
  MODULE_TO_PAGE_KEY,
} from '@lib/enums';
```

Rules:

- Always use `TABLES.*` in `.from(...)`
- Always use `EDGE_FUNCTIONS.*` in `.functions.invoke(...)`
- Always use `PAGE_KEYS.*` for query keys where applicable
- **Audit log query keys use PAGE_KEYS, not MODULES**: `[PAGE_KEYS.AUDIT_LOGS, PAGE_KEYS.TAX_RECORDS]` (MODULES are only for audit logging data)
- Always use `PAGE_SIZE.*` and `INTERVALS.*` instead of numeric literals when matching existing app defaults

## Audit Trail for Mutations (Required)

Every create/update/delete/bulk/export mutation should write an audit log entry through `auditLogApi.log(...)`.

**Important:** Use `MODULES.*` for audit logging and `PAGE_KEYS.*` for query key invalidations — they serve different purposes:

```typescript
import { MODULES, AUDIT_ACTIONS, AUDIT_EVENTS, PAGE_KEYS } from '@lib/enums';
import { auditLogApi, diffRecord } from '@services/auditLog.api';

// Audit logging: use MODULES to identify the domain being acted upon
const changes = diffRecord(previousRow, updatedRow);
if (changes) {
  await auditLogApi.log({
    module: MODULES.TAX_RECORD, // ✅ For audit trail
    recordId: String(updatedRow.id),
    action: AUDIT_ACTIONS.UPDATE,
    changedByName,
    changes,
    snapshot: { event: AUDIT_EVENTS.BULK_STATUS_UPDATED_SELECTED },
  });
}

// Query invalidation: use PAGE_KEYS to match audit query structure
queryClient.invalidateQueries({
  queryKey: [PAGE_KEYS.AUDIT_LOGS, PAGE_KEYS.TAX_RECORDS], // ✅ For query keys
});
```

Audit rules:

- Create: `AUDIT_ACTIONS.CREATE`
- Update: `AUDIT_ACTIONS.UPDATE` + `changes`
- Delete: `AUDIT_ACTIONS.DELETE` + pre-delete snapshot
- Bulk operations: `AUDIT_ACTIONS.BULK_CREATE|BULK_UPDATE|BULK_DELETE`
- Exports: `AUDIT_ACTIONS.EXPORT_PDF|EXPORT_CSV` with `AUDIT_EVENTS.*`
- Never block the mutation if audit write fails

## Supabase Client Setup

**Always check if supabase client exists. If not, create it:**

```typescript
// src/renderer/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Important for Electron
  },
});

// Database types (generate with: npx supabase gen types typescript)
export type Database = {
  public: {
    Tables: {
      // Add your tables here
    };
  };
};
```

## Hook Patterns

### Query Hook (Read Operations)

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTaxRecords() {
  return useQuery({
    queryKey: [PAGE_KEYS.TAX_RECORDS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.TAX_RECORDS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// With filters
export function useTaxRecordsByClient(clientId: string) {
  return useQuery({
    queryKey: [PAGE_KEYS.TAX_RECORDS, clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.TAX_RECORDS)
        .select('*')
        .eq('client_id', clientId);

      if (error) throw error;
      return data;
    },
    enabled: !!clientId, // Only run if clientId exists
  });
}
```

### Mutation Hook (Write Operations)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useCreateTaxRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: NewTaxRecord) => {
      const { data, error } = await supabase
        .from(TABLES.TAX_RECORDS)
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAGE_KEYS.TAX_RECORDS] });
      toast.success('Tax record created successfully');
    },
    onError: (error) => {
      console.error('Failed to create tax record:', error);
      toast.error('Failed to create tax record. Please try again.');
    },
  });
}

export function useUpdateTaxRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<TaxRecord>;
    }) => {
      const { data, error } = await supabase
        .from(TABLES.TAX_RECORDS)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PAGE_KEYS.TAX_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [PAGE_KEYS.TAX_RECORDS, data.id],
      });
      toast.success('Tax record updated successfully');
    },
  });
}

export function useDeleteTaxRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.TAX_RECORDS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAGE_KEYS.TAX_RECORDS] });
      toast.success('Tax record deleted successfully');
    },
  });
}
```

### Real-time Subscription Hook

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTaxRecordsSubscription() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('tax-records-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.TAX_RECORDS,
        },
        (payload) => {
          console.log('Change received:', payload);
          queryClient.invalidateQueries({ queryKey: [PAGE_KEYS.TAX_RECORDS] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
```

### Authentication Hook

The `useAuth` hook is provided by `AuthContext` and manages session state, user profile, and password workflows.

```typescript
// From src/renderer/contexts/AuthContext.tsx
import { useContext } from 'react';

export type UserInfo = {
  email: string;
  createdAt: string;
  provider: string;
  fullName: string;
  companyName: string;
  address: string;
  phoneNumber: string;
  description: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  isAdmin: boolean;
  managedBy: string | null; // UUID of admin account owner; null for admins
};

// Use in any component wrapped by AuthProvider
const {
  session,           // Supabase session
  userInfo,          // Merged user + profile data (camelCased)
  loading,           // Initial load state
  signIn,            // (email, password) => Promise<void>
  signOut,           // () => Promise<void>
  updateProfile,     // (payload: {...}) => Promise<void>
  updatePassword,    // (payload: { newPassword }) => Promise<void>
  sendPasswordResetOtp,     // (email) => Promise<void>
  verifyPasswordResetOtp,   // (email, token) => Promise<void>
  completePasswordReset,    // (newPassword) => Promise<void>
} = useAuth();

// Example usage in a component
export function ProfileSettings() {
  const { userInfo, updateProfile } = useAuth();

  if (!userInfo) return null;

  return (
    <div>
      <p>Email: {userInfo.email}</p>
      <p>Full Name: {userInfo.fullName}</p>
      <p>Role: {userInfo.role}</p>
      <p>Is Admin: {userInfo.isAdmin}</p>
    </div>
  );
}

// Password reset flow
export function PasswordReset() {
  const { sendPasswordResetOtp, verifyPasswordResetOtp, completePasswordReset } = useAuth();

  const handleReset = async (email: string, otp: string, newPassword: string) => {
    await sendPasswordResetOtp(email);
    await verifyPasswordResetOtp(email, otp);
    await completePasswordReset(newPassword);
  };

  return <></>;
}
```

## Advanced Patterns

### Pagination

```typescript
export function usePaginatedTaxRecords(
  page: number,
  pageSize: number = PAGE_SIZE.TABLES,
) {
  return useQuery({
    queryKey: [PAGE_KEYS.TAX_RECORDS, 'paginated', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from(TABLES.TAX_RECORDS)
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data,
        count,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });
}
```

### Search/Filter

```typescript
export function useSearchTaxRecords(searchTerm: string) {
  return useQuery({
    queryKey: [PAGE_KEYS.TAX_RECORDS, 'search', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.TAX_RECORDS)
        .select('*')
        .or(
          `client_name.ilike.%${searchTerm}%,reference_number.ilike.%${searchTerm}%`,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length > 2, // Only search if term is long enough
  });
}
```

### Optimistic Updates

```typescript
export function useOptimisticUpdateTaxRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<TaxRecord>;
    }) => {
      const { data, error } = await supabase
        .from(TABLES.TAX_RECORDS)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [PAGE_KEYS.TAX_RECORDS] });

      // Snapshot the previous value
      const previousRecords = queryClient.getQueryData([PAGE_KEYS.TAX_RECORDS]);

      // Optimistically update
      queryClient.setQueryData([PAGE_KEYS.TAX_RECORDS], (old: TaxRecord[]) =>
        old.map((record) =>
          record.id === id ? { ...record, ...updates } : record,
        ),
      );

      return { previousRecords };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousRecords) {
        queryClient.setQueryData(
          [PAGE_KEYS.TAX_RECORDS],
          context.previousRecords,
        );
      }
      toast.error('Failed to update record');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [PAGE_KEYS.TAX_RECORDS] });
    },
  });
}
```

## Best Practices

1. **Always use React Query** - Never make direct Supabase calls in components
2. **Error Handling** - Always handle errors and show user-friendly messages
3. **Loading States** - Use isLoading, isPending for UI feedback
4. **Type Safety** - Generate and use Supabase database types
5. **Query Keys** - Use consistent, hierarchical query keys
6. **Invalidation** - Invalidate related queries after mutations
7. **Optimistic Updates** - For better UX on updates
8. **Real-time** - Use subscriptions sparingly (performance impact)
9. **Enum-backed Values** - Use `@lib/enums` constants for tables, keys, modules, actions
10. **Audit Coverage** - Every mutation path writes an audit entry

## Environment Variables

Ensure these are set in `.env`:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

## Testing Checklist

When implementing Supabase features:

- [ ] Error handling implemented
- [ ] Loading states shown in UI
- [ ] Success/error toasts displayed
- [ ] Query keys follow convention
- [ ] Related queries invalidated after mutations
- [ ] TypeScript types properly defined
- [ ] Network errors handled gracefully
- [ ] Session persistence works in Electron
- [ ] Table names and query keys are enum-backed
- [ ] Mutation flows include audit log writes with enum-backed module/action values
