import React, { useState, useEffect } from 'react';
import Button from '@components/ui/Button';
import { Chip } from '@components/ui/Chip';
import IconButton from '@components/ui/IconButton';
import Modal from '@components/ui/Modal';
import TextField from '@components/ui/TextField';
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/20/solid';
import { useTeamManagement } from '@hooks/useTeamManagement';
import { useTeamPermissions } from '@hooks/useUserPermissions';
import type { ManagedUser } from '@services/teamManagement.api';
import type { UpdateUserPermissionsInput } from '@shared/userPermissions.contracts';

interface UserModalProps {
  open: boolean;
  user?: ManagedUser | null;
  mode?: 'add' | 'edit' | 'view';
  onClose: () => void;
  onEdit?: () => void;
}

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
};

type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
};

function validateForm(data: FormData, isEditMode: boolean): FormErrors {
  const errors: FormErrors = {};

  if (!isEditMode) {
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!data.confirmPassword) {
      errors.confirmPassword = 'Please confirm password';
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  if (!data.fullName) {
    errors.fullName = 'Full name is required';
  }

  return errors;
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-600">
        {value}
      </div>
    </div>
  );
}

const PERMISSION_LABELS: {
  key: keyof UpdateUserPermissionsInput;
  label: string;
  description: string;
}[] = [
  {
    key: 'canCreate',
    label: 'Create Records',
    description: 'Add new tax records',
  },
  {
    key: 'canUpdate',
    label: 'Update Records',
    description: 'Edit existing records',
  },
  {
    key: 'canDelete',
    label: 'Delete Records',
    description: 'Delete individual records',
  },
  {
    key: 'canBulkOperations',
    label: 'Bulk Operations',
    description: 'Bulk updates, CSV import',
  },
  {
    key: 'canExport',
    label: 'Export Data',
    description: 'Export CSV and PDF reports',
  },
];

function PermissionToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          checked ? 'bg-blue-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function PermissionsSection({ userId }: { userId: string }) {
  const { permissions, loading, updatePermissions } =
    useTeamPermissions(userId);

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!permissions)
    return (
      <div className="flex justify-center py-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );

  const handleToggle = async (
    key: keyof UpdateUserPermissionsInput,
    value: boolean,
  ) => {
    await updatePermissions({ [key]: value });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
        <ShieldCheckIcon className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-semibold text-slate-800">
          Permissions
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {PERMISSION_LABELS.map(({ key, label, description }) => (
          <PermissionToggle
            key={key}
            label={label}
            description={description}
            checked={!!(permissions as unknown as Record<string, boolean>)[key]}
            onChange={(next) => handleToggle(key, next)}
          />
        ))}
      </div>
    </div>
  );
}

export default function UserModal({
  open,
  user,
  mode = user ? 'edit' : 'add',
  onClose,
  onEdit,
}: UserModalProps) {
  const { createUser, updateUser, isCreatingUser, isUpdatingUser } =
    useTeamManagement();

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isBusy = isEditMode ? isUpdatingUser : isCreatingUser;

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setFormData({
      email: user?.email ?? '',
      password: '',
      confirmPassword: '',
      fullName: user?.fullName ?? '',
    });
    setErrors({});
    setShowPassword(false);
  }, [user, open]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateForm(formData, isEditMode);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      if (isEditMode && user) {
        await updateUser(
          {
            userId: user.userId,
            payload: { fullName: formData.fullName.trim() },
          },
          { onSuccess: () => onClose() },
        );
      } else {
        await createUser(
          {
            email: formData.email.trim(),
            password: formData.password,
            fullName: formData.fullName.trim(),
          },
          { onSuccess: () => onClose() },
        );
      }
    } catch {
      // Error is handled by toast in the hook
    }
  };

  // ── View mode ────────────────────────────────────────────────────────────
  if (isViewMode && user) {
    const footer = (
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Close
        </Button>
        {onEdit && (
          <Button onClick={onEdit} className="flex-1">
            Edit
          </Button>
        )}
      </div>
    );

    return (
      <Modal
        isOpen={open}
        onClose={onClose}
        title="User Profile"
        size="sm"
        footer={footer}
      >
        <div className="space-y-4">
          <ProfileField label="Email" value={user.email} />
          <ProfileField label="Full Name" value={user.fullName || '—'} />
          <ProfileField label="Company" value={user.companyName || '—'} />
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <div className="pt-0.5">
              {user.isBanned ? (
                <Chip variant="red" size="sm">
                  Banned
                </Chip>
              ) : (
                <Chip variant="green" size="sm">
                  Active
                </Chip>
              )}
            </div>
          </div>
          <ProfileField
            label="Member since"
            value={new Date(user.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          />
        </div>
      </Modal>
    );
  }

  // ── Add / Edit mode ──────────────────────────────────────────────────────
  const footer = (
    <div className="flex gap-3">
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={isBusy}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button type="submit" form="user-form" busy={isBusy} className="flex-1">
        {isEditMode ? 'Update User' : 'Create User'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEditMode ? 'Edit User' : 'Add User'}
      size={isEditMode ? 'md' : 'sm'}
      footer={footer}
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        {isEditMode ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <div className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-600">
              {user?.email}
            </div>
          </div>
        ) : (
          <TextField
            id="email"
            label="Email"
            type="email"
            placeholder="user@example.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            disabled={isBusy}
            required
          />
        )}

        <TextField
          id="fullName"
          label="Full Name"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          error={errors.fullName}
          disabled={isBusy}
          required
        />

        {isEditMode && user && <PermissionsSection userId={user.userId} />}

        {!isEditMode && (
          <>
            <TextField
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              disabled={isBusy}
              hint="Minimum 6 characters"
              suffix={
                <IconButton
                  icon={
                    showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-slate-500" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-slate-500" />
                    )
                  }
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  variant="subtle"
                  size="sm"
                  disabled={isBusy}
                />
              }
              required
            />

            <TextField
              id="confirmPassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              disabled={isBusy}
              suffix={
                <IconButton
                  icon={
                    showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-slate-500" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-slate-500" />
                    )
                  }
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  variant="subtle"
                  size="sm"
                  disabled={isBusy}
                />
              }
              required
            />
          </>
        )}
      </form>
    </Modal>
  );
}
