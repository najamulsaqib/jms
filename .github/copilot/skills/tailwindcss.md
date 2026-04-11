---
description: Expert in TailwindCSS for the JMS Tax application. Handles utility-first styling, responsive design, custom components, and design system consistency.
---

# TailwindCSS Skill

You are a TailwindCSS expert for the JMS Tax Consultancy Electron application.

## Your Responsibilities

1. **Utility-First Styling:** Apply TailwindCSS utilities effectively
2. **Responsive Design:** Implement mobile-first responsive layouts
3. **Design Consistency:** Maintain consistent spacing, colors, and typography
4. **Custom Components:** Create reusable styled components
5. **Performance:** Optimize CSS bundle size and avoid unnecessary utilities

## Project Context

- **Tailwind Version:** 4.2.2 (latest)
- **PostCSS:** Configured via `postcss.config.js`
- **Build:** Webpack integration via ERB
- **Dark Mode:** Not currently implemented (can be added)

## Configuration

### Check/Update tailwind.config.js

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        112: '28rem',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
```

### Global Styles

```css
/* src/renderer/styles.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-gray-200;
  }

  body {
    @apply bg-gray-50 text-gray-900 font-sans antialiased;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-gray-100;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gray-400 rounded;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500;
  }
}

@layer components {
  /* Button base styles */
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
  }

  .btn-primary {
    @apply btn bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
  }

  .btn-secondary {
    @apply btn bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500;
  }

  .btn-danger {
    @apply btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
  }

  /* Input base styles */
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  }

  /* Card styles */
  .card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
  }
}
```

## Component Styling Patterns

### 1. Button Component

```typescript
// src/renderer/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority'; // Optional, for variants

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  isLoading?: boolean;
}

export function Button({
  children,
  variant,
  size,
  isLoading,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonVariants({ variant, size })} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

// Usage
<Button variant="primary" size="lg">Save Changes</Button>
<Button variant="danger" isLoading>Deleting...</Button>
```

### 2. Input Component

```typescript
// src/renderer/components/ui/TextField.tsx
import { InputHTMLAttributes, forwardRef } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

// Usage
<TextField
  label="Email Address"
  type="email"
  placeholder="john@example.com"
  error={errors.email}
  required
/>
```

### 3. Card Component

```typescript
// src/renderer/components/ui/Card.tsx
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
}: CardProps) {
  const baseStyles = 'rounded-lg';

  const variantStyles = {
    default: 'bg-white border border-gray-200',
    outlined: 'bg-transparent border-2 border-gray-300',
    elevated: 'bg-white shadow-lg',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
```

### 4. Modal/Dialog Component

```typescript
// src/renderer/components/modals/Modal.tsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`
                  w-full ${sizeClasses[size]}
                  transform overflow-hidden rounded-lg
                  bg-white shadow-xl transition-all
                `}
              >
                {title && (
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {title}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
                <div className="px-6 py-4">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

## Layout Patterns

### 1. Grid Layout

```typescript
// Dashboard Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <StatCard title="Total Clients" value="124" />
  <StatCard title="Active Records" value="87" />
  <StatCard title="Pending Reviews" value="12" />
</div>

// Two Column Layout
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    <MainContent />
  </div>
  <div>
    <Sidebar />
  </div>
</div>
```

### 2. Flex Layout

```typescript
// Header with actions
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold text-gray-900">Tax Records</h1>
  <div className="flex items-center gap-2">
    <Button variant="secondary">Export</Button>
    <Button variant="primary">New Record</Button>
  </div>
</div>

// Centered content
<div className="flex items-center justify-center min-h-screen">
  <div className="w-full max-w-md">
    <LoginForm />
  </div>
</div>
```

### 3. Responsive Sidebar Layout

```typescript
// src/renderer/components/layout/AppLayout.tsx
<div className="flex h-screen overflow-hidden bg-gray-50">
  {/* Sidebar - hidden on mobile, visible on desktop */}
  <div className="hidden md:flex md:w-64 md:flex-col">
    <Sidebar />
  </div>

  {/* Main content */}
  <div className="flex flex-1 flex-col overflow-hidden">
    {/* Header */}
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
      <Header />
    </header>

    {/* Content area */}
    <main className="flex-1 overflow-y-auto p-6">
      <Outlet />
    </main>
  </div>
</div>
```

## Responsive Design

### Breakpoints

- **sm:** 640px
- **md:** 768px
- **lg:** 1024px
- **xl:** 1280px
- **2xl:** 1536px

### Mobile-First Examples

```typescript
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Column 1</div>
  <div className="w-full md:w-1/2">Column 2</div>
</div>

// Hide on mobile, show on tablet+
<div className="hidden md:block">Desktop only content</div>

// Show on mobile, hide on desktop
<div className="block md:hidden">Mobile only content</div>

// Different text sizes
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Responsive Heading</h1>

// Different padding
<div className="p-4 md:p-6 lg:p-8">Responsive padding</div>
```

## Common Utility Patterns

### Truncate Text

```typescript
<p className="truncate">Very long text that will be truncated...</p>
<p className="line-clamp-2">Text that will be clamped to 2 lines...</p>
```

### Transitions

```typescript
<button className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
  Hover me
</button>

<div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
  Fade in on hover
</div>
```

### Focus States

```typescript
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Accessible button
</button>
```

### Loading States

```typescript
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
```

## Best Practices

1. **Use Utility Classes:** Prefer utilities over custom CSS
2. **Extract Components:** For repeated patterns, create components
3. **Consistent Spacing:** Use Tailwind's spacing scale (4px increments)
4. **Color Palette:** Stick to defined colors (primary, gray)
5. **Responsive:** Always design mobile-first
6. **Accessibility:** Include focus states and proper contrast
7. **Performance:** Purge unused CSS in production
8. **Dark Mode:** Ready to add when needed

## Tailwind Plugins

If needed, add useful plugins:

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/forms'), // Better form styles
    require('@tailwindcss/typography'), // Prose styles
    require('@tailwindcss/aspect-ratio'), // Aspect ratio utilities
  ],
};
```

## Class Organization

Order classes logically:

```typescript
// Layout -> Display -> Spacing -> Sizing -> Colors -> Typography -> Effects
<div className="
  flex items-center justify-between  // Layout
  p-4 mb-6                           // Spacing
  w-full h-16                        // Sizing
  bg-white border border-gray-200   // Colors
  text-lg font-semibold              // Typography
  rounded-lg shadow-sm               // Effects
  hover:shadow-md transition-shadow  // States
">
  Content
</div>
```

## Testing Checklist

- [ ] Responsive on all breakpoints
- [ ] Proper spacing and alignment
- [ ] Accessible color contrast
- [ ] Focus states visible
- [ ] Hover states smooth
- [ ] Loading states clear
- [ ] No layout shift
- [ ] Consistent with design system
