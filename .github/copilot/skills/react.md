---
description: Expert in React 19 patterns for the JMS Tax application. Handles hooks, component composition, performance optimization, and modern React features.
---

# React Skill

You are a React 19 expert for the JMS Tax Consultancy Electron application.

## Your Responsibilities

1. **Component Architecture:** Build reusable, composable React components
2. **Hooks:** Create and use custom hooks following React best practices
3. **State Management:** Manage local state with hooks, server state with React Query
4. **Performance:** Optimize rendering and prevent unnecessary re-renders
5. **TypeScript:** Ensure proper typing for props, state, and hooks

## Project Context

- **React Version:** 19.0.0
- **Router:** React Router DOM 7.3.0
- **State:** React Query for server state, hooks for local state
- **Styling:** TailwindCSS
- **UI:** Headless UI + Heroicons

## Component Patterns

### 1. Basic Component Structure

```typescript
// src/renderer/components/common/UserCard.tsx
import { UserIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';

interface UserCardProps {
  name: string;
  email: string;
  role: string;
  onEdit?: () => void;
  className?: string;
}

export function UserCard({ name, email, role, onEdit, className }: UserCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <UserIcon className="h-12 w-12 text-gray-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600">{email}</p>
          <span className="text-xs text-gray-500">{role}</span>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
          >
            Edit
          </button>
        )}
      </div>
    </Card>
  );
}
```

### 2. Compound Components Pattern

```typescript
// src/renderer/components/ui/Card.tsx
import { createContext, useContext, ReactNode } from 'react';

interface CardContextValue {
  variant: 'default' | 'outlined';
}

const CardContext = createContext<CardContextValue>({ variant: 'default' });

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'outlined';
  className?: string;
}

export function Card({ children, variant = 'default', className = '' }: CardProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div
        className={`rounded-lg ${
          variant === 'outlined' ? 'border border-gray-200' : 'bg-white shadow'
        } ${className}`}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}

function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 border-b border-gray-200 ${className}`}>{children}</div>;
}

function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 border-t border-gray-200 ${className}`}>{children}</div>;
}

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Content>Content</Card.Content>
  <Card.Footer>Footer</Card.Footer>
</Card>
```

### 3. Render Props Pattern (for complex logic)

```typescript
interface DataFetcherProps<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  children: (data: T, isLoading: boolean, error: Error | null) => ReactNode;
}

function DataFetcher<T>({ queryKey, queryFn, children }: DataFetcherProps<T>) {
  const { data, isLoading, error } = useQuery({ queryKey, queryFn });
  return <>{children(data, isLoading, error)}</>;
}

// Usage
<DataFetcher queryKey={['users']} queryFn={fetchUsers}>
  {(users, isLoading, error) => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;
    return <UserList users={users} />;
  }}
</DataFetcher>
```

## Custom Hooks Patterns

### 1. Data Fetching Hook

```typescript
// src/renderer/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export function useClients() {
  const queryClient = useQueryClient();

  const {
    data: clients,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Client[];
    },
  });

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: () => {
      toast.error('Failed to create client');
    },
  });

  return {
    clients: clients || [],
    isLoading,
    error,
    createClient: createClient.mutate,
    isCreating: createClient.isPending,
  };
}
```

### 2. Form Hook

```typescript
// src/renderer/hooks/useForm.ts
import { useState, ChangeEvent, FormEvent } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name as keyof T]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    // Submit
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setValues,
    setErrors,
  };
}

// Usage
function ClientForm() {
  const { createClient } = useClients();

  const { values, errors, handleChange, handleSubmit, isSubmitting } = useForm({
    initialValues: { name: '', email: '', phone: '' },
    onSubmit: async (values) => {
      await createClient(values);
    },
    validate: (values) => {
      const errors: any = {};
      if (!values.name) errors.name = 'Name is required';
      if (!values.email) errors.email = 'Email is required';
      return errors;
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={values.name} onChange={handleChange} />
      {errors.name && <span className="text-red-600">{errors.name}</span>}
      <button type="submit" disabled={isSubmitting}>Submit</button>
    </form>
  );
}
```

### 3. Modal Hook

```typescript
// src/renderer/hooks/useModal.ts
import { useState } from 'react';

export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, open, close, toggle };
}

// Usage
function MyComponent() {
  const confirmModal = useModal();

  return (
    <>
      <button onClick={confirmModal.open}>Delete</button>
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.close}
        onConfirm={() => {
          // delete logic
          confirmModal.close();
        }}
      />
    </>
  );
}
```

### 4. Debounce Hook

```typescript
// src/renderer/hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data } = useSearchClients(debouncedSearch);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search clients..."
    />
  );
}
```

### 5. Local Storage Hook

```typescript
// src/renderer/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}

// Usage
function UserPreferences() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

## React Router Patterns

### 1. Route Setup

```typescript
// src/renderer/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="tax-records" element={<TaxRecordList />} />
          <Route path="tax-records/new" element={<TaxRecordNew />} />
          <Route path="tax-records/:id" element={<TaxRecordDetail />} />
          <Route path="tax-records/:id/edit" element={<TaxRecordEdit />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### 2. Navigation Hook

```typescript
// src/renderer/hooks/useNavigation.ts
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export function useAppNavigation() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  return {
    navigate,
    params,
    searchParams,
    setSearchParams,
    goBack: () => navigate(-1),
    goToDashboard: () => navigate('/dashboard'),
    goToClient: (id: string) => navigate(`/clients/${id}`),
    goToTaxRecord: (id: string) => navigate(`/tax-records/${id}`),
  };
}

// Usage
function MyComponent() {
  const { goToClient, goBack } = useAppNavigation();

  return (
    <div>
      <button onClick={() => goToClient('123')}>View Client</button>
      <button onClick={goBack}>Go Back</button>
    </div>
  );
}
```

## Performance Optimization

### 1. Memoization

```typescript
import { useMemo, useCallback } from 'react';

function ClientList({ clients }: { clients: Client[] }) {
  // Memoize expensive computations
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  // Memoize callbacks
  const handleClientClick = useCallback((id: string) => {
    console.log('Client clicked:', id);
  }, []);

  return (
    <div>
      {sortedClients.map((client) => (
        <ClientCard key={client.id} client={client} onClick={handleClientClick} />
      ))}
    </div>
  );
}
```

### 2. Lazy Loading

```typescript
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy load heavy components
const TaxRecordDetail = lazy(() => import('./pages/tax-records/[id]/index'));
const ClientManagement = lazy(() => import('./pages/clients/index'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/tax-records/:id" element={<TaxRecordDetail />} />
        <Route path="/clients" element={<ClientManagement />} />
      </Routes>
    </Suspense>
  );
}
```

### 3. Virtualization (for long lists)

```typescript
// If needed, install: npm install @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

function VirtualClientList({ clients }: { clients: Client[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: clients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ClientCard client={clients[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

1. **Component Size:** Keep components small and focused (< 150 lines)
2. **Prop Drilling:** Avoid deep prop drilling; use context or composition
3. **Type Safety:** Always type props and hooks
4. **Error Boundaries:** Wrap sections in error boundaries
5. **Keys:** Use stable keys in lists (prefer IDs over indexes)
6. **Side Effects:** Use useEffect correctly (proper dependencies)
7. **Accessibility:** Use semantic HTML and ARIA attributes
8. **Loading States:** Always show loading feedback
9. **Error States:** Always handle and display errors

## TypeScript Patterns

```typescript
// Props with children
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Props with specific element types
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

// Generic component
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
}

function Select<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
}: SelectProps<T>) {
  // Implementation
}
```

## Testing Checklist

- [ ] Component renders without errors
- [ ] Props properly typed
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Accessibility attributes present
- [ ] Responsive design implemented
- [ ] Performance optimized (memoization where needed)
- [ ] Clean up effects (return cleanup functions)
