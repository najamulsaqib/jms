import React, { useEffect, useState } from 'react';
import Button from '@components/ui/Button';
import IconButton from '@components/ui/IconButton';
import Modal from '@components/ui/Modal';
import TextField from '@components/ui/TextField';
import {
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  NoSymbolIcon,
} from '@heroicons/react/20/solid';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useTeamManagement } from '@hooks/useTeamManagement';
import type { ManagedUser } from '@services/teamManagement.api';

interface UserModalProps {
  open: boolean;
  user?: ManagedUser | null;
  mode?: 'add' | 'edit' | 'view';
  onClose: () => void;
}

type Mode = 'add' | 'edit' | 'view';

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

function UserProfileHero({ user }: { user: ManagedUser }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br p-4 ${
        user.isBanned
          ? 'from-rose-50 via-white to-red-100'
          : 'from-sky-50 via-white to-emerald-50'
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-xl ${
          user.isBanned ? 'bg-rose-300/30' : 'bg-sky-200/30'
        }`}
      />
      <div
        className={`pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full blur-xl ${
          user.isBanned ? 'bg-red-300/30' : 'bg-emerald-200/30'
        }`}
      />

      <div className="relative flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
            <div className="overflow-hidden rounded-full border border-sky-100 bg-sky-50">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || user.email}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <span className="block h-20 w-20 text-sky-400">
                  <UserCircleIcon className="h-20 w-20" />
                </span>
              )}
            </div>
          </div>

          <span
            className={`absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm ${
              user.isBanned
                ? 'bg-red-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {user.isBanned ? (
              <NoSymbolIcon className="h-3.5 w-3.5" />
            ) : (
              <CheckCircleIcon className="h-3.5 w-3.5" />
            )}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Account status
          </p>
          <div
            className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              user.isBanned
                ? 'bg-red-100 text-red-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {user.isBanned ? 'Banned user' : 'Active user'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserModal({
  open,
  user,
  mode = user ? 'edit' : 'add',
  onClose,
}: UserModalProps) {
  const { createUser, updateUser, isCreatingUser, isUpdatingUser } =
    useTeamManagement();

  const [activeMode, setActiveMode] = useState<Mode>(mode);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const isViewMode = activeMode === 'view';
  const isEditMode = activeMode === 'edit';
  const isBusy = isEditMode ? isUpdatingUser : isCreatingUser;

  useEffect(() => {
    if (!open) return;
    setActiveMode(mode);
  }, [open, mode, user?.userId]);

  useEffect(() => {
    setFormData({
      email: user?.email ?? '',
      password: '',
      confirmPassword: '',
      fullName: user?.fullName ?? '',
    });
    setErrors({});
    setShowPassword(false);
  }, [user, open, activeMode]);

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

  if (isViewMode && !user) {
    return null;
  }

  const currentUser = user as ManagedUser;

  const modalTitle = isViewMode
    ? 'User Profile'
    : isEditMode
      ? 'Edit User'
      : 'Add User';

  const passwordToggle = (
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
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={modalTitle}
      size="md"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            size="sm"
          >
            Close
          </Button>
          {isViewMode ? (
            <Button
              type="button"
              onClick={() => setActiveMode('edit')}
              className="flex-1"
              size="sm"
            >
              Edit
            </Button>
          ) : (
            <Button
              type="submit"
              form="user-form"
              busy={isBusy}
              className="flex-1"
              size="sm"
            >
              {isEditMode ? 'Update User' : 'Create User'}
            </Button>
          )}
        </div>
      }
    >
      {isViewMode ? (
        <div className="space-y-4">
          <UserProfileHero user={currentUser} />

          <ProfileField label="Email" value={currentUser.email} />
          <ProfileField label="Full Name" value={currentUser.fullName || '—'} />
          <ProfileField
            label="Member since"
            value={new Date(currentUser.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          />
        </div>
      ) : (
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          {isEditMode && user && <UserProfileHero user={user} />}

          {isEditMode ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
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
                suffix={passwordToggle}
                required
              />

              <TextField
                id="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange('confirmPassword', e.target.value)
                }
                error={errors.confirmPassword}
                disabled={isBusy}
                suffix={passwordToggle}
                required
              />
            </>
          )}
        </form>
      )}
    </Modal>
  );
}
