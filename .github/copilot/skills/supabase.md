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
    queryKey: ['tax-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_records')
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
    queryKey: ['tax-records', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_records')
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
        .from('tax_records')
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-records'] });
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
        .from('tax_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tax-records'] });
      queryClient.invalidateQueries({ queryKey: ['tax-record', data.id] });
      toast.success('Tax record updated successfully');
    },
  });
}

export function useDeleteTaxRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tax_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-records'] });
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
          table: 'tax_records',
        },
        (payload) => {
          console.log('Change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['tax-records'] });
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

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useAuth() {
  const { data: session, isLoading } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
  });

  const signIn = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Signed in successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Signed out successfully');
    },
  });

  return {
    session,
    isLoading,
    user: session?.user,
    signIn: signIn.mutate,
    signOut: signOut.mutate,
    isSigningIn: signIn.isPending,
  };
}
```

## Advanced Patterns

### Pagination

```typescript
export function usePaginatedTaxRecords(page: number, pageSize: number = 10) {
  return useQuery({
    queryKey: ['tax-records', 'paginated', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('tax_records')
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
    queryKey: ['tax-records', 'search', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_records')
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
        .from('tax_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tax-records'] });

      // Snapshot the previous value
      const previousRecords = queryClient.getQueryData(['tax-records']);

      // Optimistically update
      queryClient.setQueryData(['tax-records'], (old: TaxRecord[]) =>
        old.map((record) =>
          record.id === id ? { ...record, ...updates } : record,
        ),
      );

      return { previousRecords };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousRecords) {
        queryClient.setQueryData(['tax-records'], context.previousRecords);
      }
      toast.error('Failed to update record');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-records'] });
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
