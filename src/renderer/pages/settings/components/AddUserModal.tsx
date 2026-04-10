import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@components/ui/Button';
import TextField from '@components/ui/TextField';
import IconButton from '@components/ui/IconButton';
import { useTeamManagement } from '@hooks/useTeamManagement';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
}

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  companyName: string;
};

type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  companyName?: string;
};

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

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

  if (!data.fullName) {
    errors.fullName = 'Full name is required';
  }

  if (!data.companyName) {
    errors.companyName = 'Company name is required';
  }

  return errors;
}

export default function AddUserModal({ open, onClose }: AddUserModalProps) {
  const { createUser, isCreatingUser } = useTeamManagement();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      await createUser(
        {
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          companyName: formData.companyName.trim(),
        },
        {
          onSuccess: () => {
            setFormData({
              email: '',
              password: '',
              confirmPassword: '',
              fullName: '',
              companyName: '',
            });
            setErrors({});
            onClose();
          },
        },
      );
    } catch {
      // Error is handled by toast in the hook
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Add User</h2>
          <IconButton
            icon={<XMarkIcon className="h-5 w-5" />}
            onClick={onClose}
            aria-label="Close modal"
          />
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <TextField
              id="email"
              label="Email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              disabled={isCreatingUser}
              required
            />

            <TextField
              id="fullName"
              label="Full Name"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              error={errors.fullName}
              disabled={isCreatingUser}
              required
            />

            <TextField
              id="companyName"
              label="Company Name"
              placeholder="Acme Inc."
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              error={errors.companyName}
              disabled={isCreatingUser}
              required
            />

            <TextField
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              disabled={isCreatingUser}
              hint="Minimum 6 characters"
              required
            />

            <TextField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              disabled={isCreatingUser}
              required
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isCreatingUser}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" busy={isCreatingUser} className="flex-1">
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
