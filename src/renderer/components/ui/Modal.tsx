import { type ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

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
          className={`w-full ${sizeClasses[size]} rounded-xl bg-white shadow-2xl overflow-hidden`}
        >
          {!hideHeader && (
            <div className="px-6 py-4 border-b border-slate-200">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {title}
              </DialogTitle>
              {description && (
                <p className="text-sm text-slate-600 mt-1">{description}</p>
              )}
            </div>
          )}

          <div className={bodyClassName}>{children}</div>

          {footer && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              {footer}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
