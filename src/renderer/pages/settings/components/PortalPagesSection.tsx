import React, { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import IconButton from '@components/ui/IconButton';
import TextField from '@components/ui/TextField';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import { usePortalPages } from '@hooks/usePortalPages';
import type {
  CreatePortalPageInput,
  PortalPage,
} from '@shared/portalPage.contracts';

type FormValues = {
  name: string;
  url: string;
  isActive: boolean;
};

const emptyForm: FormValues = { name: '', url: '', isActive: true };

function PortalFormDialog({
  isOpen,
  initial,
  isSaving,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  initial: FormValues;
  isSaving: boolean;
  onSave: (values: FormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Partial<FormValues>>({});

  const set =
    (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({
        ...v,
        [field]:
          e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      }));

  const validate = (): Partial<FormValues> => {
    const errs: Partial<FormValues> = {};
    if (!values.name.trim()) errs.name = 'Name is required.';
    if (!values.url.trim()) {
      errs.url = 'URL is required.';
    } else {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(values.url)) {
        errs.url = 'Enter a valid URL (e.g. https://example.com).';
      }
    }
    return errs;
  };

  const handleClose = () => {
    if (isSaving) return;
    setValues(initial);
    setErrors({});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave(values);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-slate-900 mb-4">
            {initial.name ? 'Edit Portal' : 'Add Portal'}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              id="portal-name"
              label="Name"
              placeholder="e.g. My Website"
              value={values.name}
              onChange={set('name')}
              error={errors.name}
              autoFocus
            />
            <TextField
              id="portal-url"
              label="URL"
              placeholder="https://example.com"
              value={values.url}
              onChange={set('url')}
              error={errors.url}
            />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={set('isActive')}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Active</span>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" busy={isSaving}>
                Save
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default function PortalPagesSection() {
  const {
    portalPages,
    loading,
    error,
    addPortalPage,
    updatePortalPage,
    deletePortalPage,
    isSaving,
    deletingId,
  } = usePortalPages();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PortalPage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortalPage | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (page: PortalPage) => {
    setEditing(page);
    setFormOpen(true);
  };

  const handleSave = async (values: {
    name: string;
    url: string;
    isActive: boolean;
  }) => {
    const payload: CreatePortalPageInput = {
      name: values.name.trim(),
      url: values.url.trim(),
      isActive: values.isActive,
    };

    const ok = editing
      ? await updatePortalPage(editing.id, payload)
      : await addPortalPage(payload);

    if (ok) setFormOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deletePortalPage(deleteTarget.id);
    if (ok) setDeleteTarget(null);
  };

  const formInitial: FormValues = editing
    ? { name: editing.name, url: editing.url, isActive: editing.isActive }
    : emptyForm;

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Web Portals
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Configure the portals available in the browser view.
          </p>
        </div>
        <Button size="sm" icon={PlusIcon} onClick={openAdd}>
          Add Portal
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
      ) : portalPages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <GlobeAltIcon className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">
            No portals configured yet. Add one to get started.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 -mx-5 -mb-5">
          {portalPages.map((page) => (
            <div
              key={page.id}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <GlobeAltIcon className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {page.name}
                </p>
                <p className="text-xs text-slate-400 truncate">{page.url}</p>
              </div>
              <span
                className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  page.isActive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {page.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <IconButton
                  icon={<PencilIcon className="h-4 w-4" />}
                  onClick={() => openEdit(page)}
                  variant="subtle"
                  title="Edit"
                />
                <IconButton
                  icon={<TrashIcon className="h-4 w-4 text-red-500" />}
                  onClick={() => setDeleteTarget(page)}
                  disabled={deletingId === page.id}
                  variant="danger"
                  title="Delete"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <PortalFormDialog
        key={editing?.id ?? 'new'}
        isOpen={formOpen}
        initial={formInitial}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Portal"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        busy={deletingId === deleteTarget?.id}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
