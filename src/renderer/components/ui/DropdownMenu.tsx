import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
import { Fragment, type ComponentType } from 'react';

export interface DropdownMenuItem {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  badge?: string | number;
  divider?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  buttonLabel?: string;
  buttonVariant?: 'icon' | 'text' | 'ghost';
}

export default function DropdownMenu({
  items,
  buttonLabel = 'Options',
  buttonVariant = 'icon',
}: DropdownMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      {buttonVariant === 'ghost' ? (
        <MenuButton className="inline-flex items-center justify-center rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all">
          <EllipsisHorizontalIcon
            className="h-5 w-5"
            aria-label={buttonLabel}
          />
        </MenuButton>
      ) : (
        <MenuButton className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all">
          {buttonVariant === 'icon' ? (
            <EllipsisHorizontalIcon
              className="h-5 w-5 text-slate-600"
              aria-label={buttonLabel}
            />
          ) : (
            <>
              <span>{buttonLabel}</span>
              <EllipsisHorizontalIcon className="h-4 w-4 text-slate-500" />
            </>
          )}
        </MenuButton>
      )}

      <MenuItems
        transition
        anchor="bottom end"
        className="z-50 w-64 divide-y divide-slate-100 rounded-xl bg-white shadow-xl ring-1 ring-slate-900/5 focus:outline-none overflow-hidden origin-top-right transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0"
      >
        <div className="py-1.5">
          {items.map((item, index) => (
            <Fragment key={index}>
              <MenuItem disabled={item.disabled}>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`${
                      focus
                        ? item.variant === 'danger'
                          ? 'bg-red-50'
                          : 'bg-blue-50'
                        : ''
                    } ${
                      item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    } group flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer`}
                  >
                    {item.icon && (
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                          focus
                            ? item.variant === 'danger'
                              ? 'bg-red-100'
                              : 'bg-blue-100'
                            : 'bg-slate-100'
                        } transition-colors`}
                      >
                        <item.icon
                          className={`h-4 w-4 ${
                            focus
                              ? item.variant === 'danger'
                                ? 'text-red-700'
                                : 'text-blue-700'
                              : 'text-slate-600'
                          }`}
                        />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div
                        className={`font-medium ${
                          focus
                            ? item.variant === 'danger'
                              ? 'text-red-900'
                              : 'text-blue-900'
                            : item.variant === 'danger'
                              ? 'text-red-700'
                              : 'text-slate-900'
                        }`}
                      >
                        {item.label}
                      </div>
                    </div>
                    {item.badge !== undefined && (
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-blue-600 text-xs font-semibold text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )}
              </MenuItem>
              {item.divider && index < items.length - 1 && (
                <div className="my-1 border-t border-slate-100" />
              )}
            </Fragment>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
}
