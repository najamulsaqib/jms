import { type ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/20/solid';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  hideHeader?: boolean;
  bodyClassName?: string;
  /** Tailwind max-height class applied to the panel, e.g. 'max-h-[85vh]'. Body becomes scrollable. */
  maxHeight?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  hideHeader = false,
  bodyClassName = 'px-6 py-6',
  maxHeight,
}: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={closeOnBackdrop ? onClose : () => undefined}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={`w-full ${sizeClasses[size]} rounded-xl bg-white shadow-2xl overflow-hidden ${maxHeight ? `${maxHeight} flex flex-col` : ''}`}
        >
          {!hideHeader && (
            <div className="px-6 py-4 border-b border-slate-200 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogTitle className="text-lg font-semibold text-slate-900">
                    {title}
                  </DialogTitle>
                  {description && (
                    <p className="text-sm text-slate-600 mt-1">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-0.5 shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className={`${bodyClassName}${maxHeight ? ' overflow-y-auto flex-1 min-h-0' : ''}`}>
            {children}
          </div>

          {footer && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
              {footer}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
