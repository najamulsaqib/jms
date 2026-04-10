import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@components/ui/Button';
import TextField from '@components/ui/TextField';
import IconButton from '@components/ui/IconButton';
import { useTeamManagement } from '@hooks/useTeamManagement';
import type { ManagedUser } from '@services/teamManagement.api';

interface EditUserModalProps {
  open: boolean;
  user: ManagedUser;
  onClose: () => void;
}

type FormData = {
  fullName: string;
  companyName: string;
};

type FormErrors = {
  fullName?: string;
  companyName?: string;
};

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.fullName) {
    errors.fullName = 'Full name is required';
  }

  if (!data.companyName) {
    errors.companyName = 'Company name is required';
  }

  return errors;
}

export default function EditUserModal({
  open,
  user,
  onClose,
}: EditUserModalProps) {
  const { updateUser, isUpdatingUser } = useTeamManagement();
  const [formData, setFormData] = useState<FormData>({
    fullName: user.fullName,
    companyName: user.companyName,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setFormData({
      fullName: user.fullName,
      companyName: user.companyName,
    });
    setErrors({});
  }, [user, open]);

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
      await updateUser(
        {
          userId: user.userId,
          payload: {
            fullName: formData.fullName.trim(),
            companyName: formData.companyName.trim(),
          },
        },
        {
          onSuccess: () => {
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
          <h2 className="text-lg font-semibold text-slate-900">Edit User</h2>
          <IconButton
            icon={<XMarkIcon className="h-5 w-5" />}
            onClick={onClose}
            aria-label="Close modal"
          />
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-600">
                {user.email}
              </div>
            </div>

            <TextField
              id="fullName"
              label="Full Name"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              error={errors.fullName}
              disabled={isUpdatingUser}
              required
            />

            <TextField
              id="companyName"
              label="Company Name"
              placeholder="Acme Inc."
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              error={errors.companyName}
              disabled={isUpdatingUser}
              required
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isUpdatingUser}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" busy={isUpdatingUser} className="flex-1">
              Update User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
