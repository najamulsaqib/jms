import Button from '@components/ui/Button';
import TextField from '@components/ui/TextField';
import Card from '@components/ui/Card';
import { useAuth } from '@contexts/AuthContext';
import {
  CheckIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  IdentificationIcon,
  PencilSquareIcon,
  SparklesIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ComponentType } from 'react';

function formatDate(value?: string | null) {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function UserInfoSection() {
  const { updateProfile, updatePassword, userInfo } = useAuth();
  const currentFullName = userInfo?.fullName ?? '';
  const currentCompanyName = userInfo?.companyName ?? '';
  const currentAddress = userInfo?.address ?? '';
  const currentPhoneNumber = userInfo?.phoneNumber ?? '';
  const currentDescription = userInfo?.description ?? '';

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentFullName);
  const [companyName, setCompanyName] = useState(currentCompanyName);
  const [address, setAddress] = useState(currentAddress);
  const [phoneNumber, setPhoneNumber] = useState(currentPhoneNumber);
  const [description, setDescription] = useState(currentDescription);
  const [nameError, setNameError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setFullName(currentFullName);
      setCompanyName(currentCompanyName);
      setAddress(currentAddress);
      setPhoneNumber(currentPhoneNumber);
      setDescription(currentDescription);
      setNameError(null);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
    }
  }, [
    currentAddress,
    currentCompanyName,
    currentDescription,
    currentFullName,
    currentPhoneNumber,
    isEditing,
  ]);

  const startEditing = () => {
    setFullName(currentFullName);
    setCompanyName(currentCompanyName);
    setAddress(currentAddress);
    setPhoneNumber(currentPhoneNumber);
    setDescription(currentDescription);
    setNameError(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFullName(currentFullName);
    setCompanyName(currentCompanyName);
    setAddress(currentAddress);
    setPhoneNumber(currentPhoneNumber);
    setDescription(currentDescription);
    setNameError(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  const handleSave = async () => {
    const trimmed = fullName.trim();

    if (!trimmed) {
      setNameError('Name is required.');
      return;
    }

    setSaving(true);
    setNameError(null);

    try {
      await updateProfile({
        fullName: trimmed,
        companyName,
        address,
        phoneNumber,
        description,
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile.';
      setNameError(message);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    const trimmedPassword = newPassword.trim();

    if (!trimmedPassword) {
      setPasswordError('New password is required.');
      return;
    }

    if (trimmedPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    setPasswordError(null);

    try {
      await updatePassword({ newPassword: trimmedPassword });
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update password.';
      setPasswordError(message);
      toast.error('Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <Card padding="lg" className="border-slate-200">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
          <UserCircleIcon className="h-8 w-8 text-blue-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">
                User info
              </h3>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                Profile
              </span>
            </div>
            {!isEditing ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={PencilSquareIcon}
                onClick={startEditing}
                disabled={!userInfo}
              >
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={XMarkIcon}
                  onClick={cancelEditing}
                  disabled={saving || updatingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  icon={CheckIcon}
                  onClick={handleSave}
                  busy={saving}
                  disabled={updatingPassword}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Your account details and session metadata.
          </p>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">
              Profile details
            </p>
            <TextField
              id="fullName"
              label="Full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              error={nameError ?? undefined}
              disabled={saving || updatingPassword}
            />
            <div className="mt-3">
              <TextField
                id="companyName"
                label="Company name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Enter your company name"
                disabled={saving || updatingPassword}
              />
            </div>
            <div className="mt-3">
              <TextField
                id="address"
                label="Address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Enter your address"
                disabled={saving || updatingPassword}
              />
            </div>
            <div className="mt-3">
              <TextField
                id="phoneNumber"
                label="Phone number"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Enter your phone number"
                disabled={saving || updatingPassword}
              />
            </div>
            <div className="mt-3">
              <TextField
                id="description"
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short bio or notes"
                disabled={saving || updatingPassword}
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5 space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              Update password
            </p>
            <TextField
              id="newPassword"
              label="New password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter a new password"
              disabled={saving || updatingPassword}
            />
            <TextField
              id="confirmPassword"
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter the new password"
              error={passwordError ?? undefined}
              disabled={saving || updatingPassword}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleUpdatePassword}
                busy={updatingPassword}
                disabled={saving}
              >
                Update Password
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <InfoRow
          label="Full name"
          value={currentFullName || 'Not set'}
          icon={UserCircleIcon}
        />
        <InfoRow
          label="Email address"
          value={userInfo?.email ?? 'Not signed in'}
          icon={IdentificationIcon}
        />
        <InfoRow
          label="Company name"
          value={currentCompanyName || 'Not set'}
          icon={IdentificationIcon}
        />
        <InfoRow
          label="Address"
          value={currentAddress || 'Not set'}
          icon={IdentificationIcon}
        />
        <InfoRow
          label="Phone number"
          value={currentPhoneNumber || 'Not set'}
          icon={IdentificationIcon}
        />
        <InfoRow
          label="Description"
          value={currentDescription || 'Not set'}
          icon={IdentificationIcon}
        />
        <InfoRow
          label="Member since"
          value={formatDate(userInfo?.createdAt)}
          icon={SparklesIcon}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <CheckCircleIcon className="h-4 w-4" />
          Session active
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
          <CloudArrowUpIcon className="h-4 w-4 text-blue-500" />
          Provider: {userInfo?.provider ?? 'unknown'}
        </span>
      </div>
    </Card>
  );
}
