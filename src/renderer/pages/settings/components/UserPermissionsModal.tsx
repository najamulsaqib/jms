import LoadingSpinner from '@components/common/LoadingSpinner';
import Button from '@components/ui/Button';
import CheckboxField from '@components/ui/CheckboxField';
import Modal from '@components/ui/Modal';
import { ShieldCheckIcon } from '@heroicons/react/20/solid';
import { useTeamPermissions } from '@hooks/useUserPermissions';
import React, { useEffect, useMemo, useState } from 'react';
import type { ManagedUser } from '@services/teamManagement.api';
import type { UpdateUserPermissionsInput } from '@shared/userPermissions.contracts';
import { toast } from 'sonner';

type UserPermissionsModalProps = {
  open: boolean;
  user: ManagedUser | null;
  onClose: () => void;
};

type PermissionFieldConfig = {
  key: keyof UpdateUserPermissionsInput;
  label: string;
  hint: string;
};

const PERMISSION_FIELDS: PermissionFieldConfig[] = [
  {
    key: 'canCreate',
    label: 'Create Records',
    hint: 'Allow creating tax records and related entries.',
  },
  {
    key: 'canUpdate',
    label: 'Update Records',
    hint: 'Allow editing existing records.',
  },
  {
    key: 'canDelete',
    label: 'Delete Records',
    hint: 'Allow deleting individual records.',
  },
  {
    key: 'canBulkOperations',
    label: 'Bulk Operations',
    hint: 'Allow imports and bulk updates.',
  },
  {
    key: 'canExport',
    label: 'Export Data',
    hint: 'Allow CSV and PDF exports.',
  },
];

export default function UserPermissionsModal({
  open,
  user,
  onClose,
}: UserPermissionsModalProps) {
  const { permissions, loading, updatePermissions } = useTeamPermissions(
    user?.userId ?? null,
  );
  const [formState, setFormState] = useState<UpdateUserPermissionsInput>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!permissions) {
      setFormState({});
      return;
    }

    setFormState({
      canCreate: permissions.canCreate,
      canUpdate: permissions.canUpdate,
      canDelete: permissions.canDelete,
      canBulkOperations: permissions.canBulkOperations,
      canExport: permissions.canExport,
    });
  }, [permissions]);

  const hasChanges = useMemo(() => {
    if (!permissions) return false;

    return PERMISSION_FIELDS.some(({ key }) => {
      const currentValue = Boolean(permissions[key]);
      const nextValue = Boolean(formState[key]);
      return currentValue !== nextValue;
    });
  }, [formState, permissions]);

  const handleToggle = (
    key: keyof UpdateUserPermissionsInput,
    checked: boolean,
  ) => {
    setFormState((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!permissions || !hasChanges) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await updatePermissions(formState);
      toast.success('Permissions updated successfully');
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update permissions';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Manage Permissions"
      description={
        user
          ? `Configure access controls for ${user.fullName || user.email}`
          : 'Configure access controls'
      }
      size="md"
      footer={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="permissions-form"
            busy={isSaving}
            disabled={!hasChanges || loading}
            className="flex-1"
            size="sm"
          >
            Save Permissions
          </Button>
        </div>
      }
    >
      {loading || !permissions ? (
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <form
          id="permissions-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <ShieldCheckIcon className="mt-0.5 h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                Permission changes take effect immediately for this team member.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {PERMISSION_FIELDS.map(({ key, label, hint }) => (
              <div
                key={key}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <CheckboxField
                  id={`permission-${key}`}
                  label={label}
                  hint={hint}
                  checked={Boolean(formState[key])}
                  onChange={(e) => handleToggle(key, e.target.checked)}
                  disabled={isSaving}
                />
              </div>
            ))}
          </div>
        </form>
      )}
    </Modal>
  );
}
