import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

export type SelectOption = {
  label: string;
  value: string;
};

type BaseProps = {
  id?: string;
  /** When omitted, no label or error/hint wrapper is rendered — useful for inline filter use. */
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /**
   * Applied to the outermost element.
   * Use this to control width/flex in a filter bar, e.g. `"flex-1 min-w-32"`.
   */
  className?: string;
  /** `"md"` (default) — standard form field. `"sm"` — compact for filter bars. */
  size?: 'sm' | 'md';
  /** `"light"` (default) — white background. `"dark"` — slate-800 background for dark toolbars. */
  variant?: 'light' | 'dark';
};

type SingleProps = BaseProps & {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

type MultiProps = BaseProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

export type SelectFieldProps = SingleProps | MultiProps;

export default function SelectField({
  id,
  label,
  hint,
  error,
  options,
  placeholder = 'Select…',
  disabled = false,
  className = '',
  size = 'md',
  variant = 'light',
  multiple = false,
  value,
  onChange,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMulti = multiple === true;
  const isCompact = size === 'sm';
  const isDark = variant === 'dark';

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return undefined;
    const close = () => {
      setOpen(false);
      setQuery('');
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      close();
    };
    const handleScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const filteredOptions = useMemo(
    () =>
      query === ''
        ? options
        : options.filter((opt) =>
            opt.label.toLowerCase().includes(query.toLowerCase()),
          ),
    [query, options],
  );

  const displayValue = useMemo(() => {
    if (isMulti) {
      const v = value as string[];
      if (v.length === 0) return '';
      if (v.length === 1)
        return options.find((o) => o.value === v[0])?.label ?? '';
      return `${v.length} selected`;
    }
    return options.find((o) => o.value === (value as string))?.label ?? '';
  }, [value, options, isMulti]);

  const handleSelect = useCallback(
    (optValue: string) => {
      if (isMulti) {
        const current = value as string[];
        const next = current.includes(optValue)
          ? current.filter((v) => v !== optValue)
          : [...current, optValue];
        (onChange as (v: string[]) => void)(next);
      } else {
        (onChange as (v: string) => void)(optValue);
        setOpen(false);
        setQuery('');
      }
    },
    [isMulti, value, onChange],
  );

  const openDropdown = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 200) {
      // Open upward: bottom edge of dropdown sits just above the input
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    } else {
      // Open downward: top edge of dropdown sits just below the input
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen(true);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    openDropdown();
  };

  const handleToggle = () => {
    if (disabled) return;
    if (open) {
      setOpen(false);
      setQuery('');
    } else {
      openDropdown();
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Enter' && open && filteredOptions.length === 1) {
      handleSelect(filteredOptions[0].value);
    }
  };

  const inputBase = [
    'block w-full rounded-lg border pr-8',
    'focus:outline-none focus:ring-2 transition-colors',
    isCompact ? 'pl-3 py-1.5 text-xs' : 'pl-3 py-2.5 text-sm',
    isDark
      ? [
          'bg-slate-800 text-white placeholder:text-slate-400',
          'disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:border-red-400 focus:ring-red-500/30'
            : 'border-slate-600 focus:border-blue-500 focus:ring-blue-500/30',
        ].join(' ')
      : [
          'bg-white text-slate-900 shadow-sm',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20',
        ].join(' '),
  ].join(' ');

  const dropdownClasses = isDark
    ? 'border-slate-600 bg-slate-800'
    : 'border-slate-200 bg-white';

  const optionBaseClasses = isDark ? 'text-slate-200' : 'text-slate-900';
  const optionHoverClasses = isDark
    ? 'hover:bg-slate-700 hover:text-white'
    : 'hover:bg-blue-50 hover:text-blue-900';
  const emptyTextClasses = isDark ? 'text-slate-400' : 'text-slate-500';
  const checkboxIdleClasses = isDark
    ? 'border-slate-500 bg-slate-700'
    : 'border-slate-300 bg-white';

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className={`rounded-lg border shadow-lg ${dropdownClasses}`}
        >
          <div className="max-h-80 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className={`px-3 py-2 text-sm ${emptyTextClasses}`}>
                No options match &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const selected = isMulti
                  ? (value as string[]).includes(opt.value)
                  : (value as string) === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none ${optionBaseClasses} ${optionHoverClasses}`}
                  >
                    {isMulti ? (
                      <>
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            selected
                              ? 'border-blue-500 bg-blue-500'
                              : checkboxIdleClasses
                          }`}
                        >
                          {selected && (
                            <CheckIcon className="h-3 w-3 text-white" />
                          )}
                        </span>
                        <span className={selected ? 'font-medium' : ''}>
                          {opt.label}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckIcon
                          className={`h-4 w-4 shrink-0 ${selected ? 'text-blue-500' : 'invisible'}`}
                        />
                        <span className={selected ? 'font-medium' : ''}>
                          {opt.label}
                        </span>
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  const combobox = (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        id={id}
        type="text"
        className={inputBase}
        value={open ? query : displayValue}
        onChange={handleInputChange}
        onClick={() => !open && openDropdown()}
        onKeyDown={handleKeyDown}
        placeholder={open ? displayValue || placeholder : placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={handleToggle}
        disabled={disabled}
        className="absolute inset-y-0 right-0 flex items-center pr-2 focus:outline-none disabled:cursor-not-allowed"
        aria-label="Toggle dropdown"
      >
        <ChevronUpDownIcon
          className="h-4 w-4 text-slate-400"
          aria-hidden="true"
        />
      </button>
      {dropdown}
    </div>
  );

  if (!label) {
    return <div className={className}>{combobox}</div>;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
      {combobox}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
