import Button from '@components/ui/Button';
import TextField from '@components/ui/TextField';
import Card from '@components/ui/Card';
import { useAuth, type UserInfo } from '@contexts/AuthContext';
import { useAdminProfile } from '@hooks/useTeamManagement';
import {
  CheckIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  KeyIcon,
  PencilSquareIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

function formatDate(value?: string | null) {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Oliver',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Amelia',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Nova',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Orion',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Ethan',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Ava',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Leo',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Chloe',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Sun',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Cloud',
  'https://api.dicebear.com/9.x/micah/svg?seed=Jordan',
  'https://api.dicebear.com/9.x/micah/svg?seed=Taylor',
  'https://api.dicebear.com/9.x/big-smile/svg?seed=Happy',
  'https://api.dicebear.com/9.x/big-smile/svg?seed=Joy',
  'https://api.dicebear.com/9.x/croodles/svg?seed=Sketch',
  'https://api.dicebear.com/9.x/croodles/svg?seed=Doodle',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Chris',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Jess',
  'https://api.dicebear.com/9.x/personas/svg?seed=Kai',
  'https://api.dicebear.com/9.x/personas/svg?seed=Riley',
];

type ProfileDraft = {
  fullName: string;
  companyName: string;
  address: string;
  phoneNumber: string;
  description: string;
  avatarUrl: string;
};

type FormErrors = {
  profile: string | null;
  password: string | null;
};

type PasswordDraft = {
  newPassword: string;
  confirmPassword: string;
};

type UiState = {
  isEditing: boolean;
  saving: boolean;
  updatingPassword: boolean;
  showPasswordForm: boolean;
};

function createProfileDraft(userInfo: UserInfo | null): ProfileDraft {
  return {
    fullName: userInfo?.fullName ?? '',
    companyName: userInfo?.companyName ?? '',
    address: userInfo?.address ?? '',
    phoneNumber: userInfo?.phoneNumber ?? '',
    description: userInfo?.description ?? '',
    avatarUrl: userInfo?.avatarUrl ?? '',
  };
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-200 py-3 last:border-b-0">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 wrap-break-word">
        {value || 'Not set'}
      </dd>
    </div>
  );
}

function UserAvatar({
  avatarUrl,
  size = 'md',
}: {
  avatarUrl: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';

  if (!avatarUrl) {
    return <UserCircleIcon className={`${sizeClass} text-blue-500`} />;
  }

  return (
    <img
      src={avatarUrl}
      alt="User avatar"
      className={`${sizeClass} rounded-full object-cover`}
    />
  );
}

export { UserAvatar };

export default function UserInfoSection() {
  const { updateProfile, updatePassword, userInfo } = useAuth();
  const isAdmin = userInfo?.isAdmin ?? false;
  const { adminProfile } = useAdminProfile();

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() =>
    createProfileDraft(userInfo),
  );
  const [formErrors, setFormErrors] = useState<FormErrors>({
    profile: null,
    password: null,
  });
  const [passwordDraft, setPasswordDraft] = useState<PasswordDraft>({
    newPassword: '',
    confirmPassword: '',
  });
  const [uiState, setUiState] = useState<UiState>({
    isEditing: false,
    saving: false,
    updatingPassword: false,
    showPasswordForm: false,
  });

  const resetState = useCallback(() => {
    setProfileDraft(createProfileDraft(userInfo));
    setFormErrors({ profile: null, password: null });
    setPasswordDraft({ newPassword: '', confirmPassword: '' });
    setUiState((prev) => ({
      ...prev,
      isEditing: false,
      saving: false,
      updatingPassword: false,
      showPasswordForm: false,
    }));
  }, [userInfo]);

  useEffect(() => {
    if (!uiState.isEditing) {
      resetState();
    }
  }, [resetState, uiState.isEditing]);

  const startEditing = () => {
    resetState();
    setUiState((prev) => ({ ...prev, isEditing: true }));
  };

  const cancelEditing = () => {
    if (uiState.saving || uiState.updatingPassword) return;
    resetState();
  };

  const handleSave = async () => {
    const trimmedName = profileDraft.fullName.trim();

    if (!trimmedName) {
      setFormErrors((prev) => ({ ...prev, profile: 'Name is required.' }));
      return;
    }

    setUiState((prev) => ({ ...prev, saving: true }));
    setFormErrors((prev) => ({ ...prev, profile: null }));

    try {
      await updateProfile({
        fullName: trimmedName,
        companyName: profileDraft.companyName.trim(),
        address: profileDraft.address.trim(),
        phoneNumber: profileDraft.phoneNumber.trim(),
        description: profileDraft.description.trim(),
        avatarUrl: profileDraft.avatarUrl,
      });
      setUiState((prev) => ({ ...prev, isEditing: false }));
      toast.success('Profile updated successfully');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile.';
      setFormErrors((prev) => ({ ...prev, profile: message }));
      toast.error('Failed to update profile');
    } finally {
      setUiState((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleUpdatePassword = async () => {
    const trimmedPassword = passwordDraft.newPassword.trim();

    if (!trimmedPassword) {
      setFormErrors((prev) => ({
        ...prev,
        password: 'New password is required.',
      }));
      return;
    }

    if (trimmedPassword.length < 8) {
      setFormErrors((prev) => ({
        ...prev,
        password: 'Password must be at least 8 characters.',
      }));
      return;
    }

    if (trimmedPassword !== passwordDraft.confirmPassword.trim()) {
      setFormErrors((prev) => ({
        ...prev,
        password: 'Passwords do not match.',
      }));
      return;
    }

    setUiState((prev) => ({ ...prev, updatingPassword: true }));
    setFormErrors((prev) => ({ ...prev, password: null }));

    try {
      await updatePassword({ newPassword: trimmedPassword });
      setPasswordDraft({ newPassword: '', confirmPassword: '' });
      setUiState((prev) => ({ ...prev, showPasswordForm: false }));
      toast.success('Password updated successfully');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update password.';
      setFormErrors((prev) => ({ ...prev, password: message }));
      toast.error('Failed to update password');
    } finally {
      setUiState((prev) => ({ ...prev, updatingPassword: false }));
    }
  };

  return (
    <Card
      padding="lg"
      className="overflow-hidden border-slate-200 bg-linear-to-b from-white to-slate-50"
    >
      <div className="flex items-start gap-4 border-b border-slate-200 pb-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 shadow-sm">
          <UserAvatar avatarUrl={userInfo?.avatarUrl ?? ''} size="lg" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
            {!uiState.isEditing ? (
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
                  disabled={uiState.saving || uiState.updatingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  icon={CheckIcon}
                  onClick={handleSave}
                  busy={uiState.saving}
                  disabled={uiState.updatingPassword}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Keep your profile details clean and current so your account stays up
            to date.
          </p>
        </div>
      </div>

      {uiState.isEditing ? (
        <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Profile details
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Update the information shown on your account profile.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                Editable fields
              </span>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Avatar
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
                {AVATAR_OPTIONS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() =>
                      setProfileDraft((prev) => ({ ...prev, avatarUrl: url }))
                    }
                    disabled={uiState.saving || uiState.updatingPassword}
                    className={`relative rounded-xl border p-0.5 transition-all focus:outline-none ${
                      profileDraft.avatarUrl === url
                        ? 'border-blue-500 shadow-md ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={url}
                      alt="Avatar option"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    {profileDraft.avatarUrl === url && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 shadow">
                        <CheckIcon className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {profileDraft.avatarUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setProfileDraft((prev) => ({ ...prev, avatarUrl: '' }))
                  }
                  disabled={uiState.saving || uiState.updatingPassword}
                  className="mt-2 text-xs font-medium text-slate-500 transition-colors hover:text-red-500"
                >
                  Remove avatar
                </button>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TextField
                id="fullName"
                label="Full name"
                value={profileDraft.fullName}
                onChange={(event) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Enter your full name"
                error={formErrors.profile ?? undefined}
                disabled={uiState.saving || uiState.updatingPassword}
              />
              {isAdmin && (
                <TextField
                  id="companyName"
                  label="Company name"
                  value={profileDraft.companyName}
                  onChange={(event) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      companyName: event.target.value,
                    }))
                  }
                  placeholder="Enter your company name"
                  disabled={uiState.saving || uiState.updatingPassword}
                />
              )}
              {isAdmin && (
                <TextField
                  id="phoneNumber"
                  label="Phone number"
                  value={profileDraft.phoneNumber}
                  onChange={(event) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      phoneNumber: event.target.value,
                    }))
                  }
                  placeholder="Enter your phone number"
                  disabled={uiState.saving || uiState.updatingPassword}
                />
              )}
              {isAdmin && (
                <TextField
                  id="address"
                  label="Address"
                  value={profileDraft.address}
                  onChange={(event) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      address: event.target.value,
                    }))
                  }
                  placeholder="Enter your address"
                  disabled={uiState.saving || uiState.updatingPassword}
                />
              )}
            </div>

            {isAdmin && (
              <div className="mt-3">
                <TextField
                  id="description"
                  label="Description"
                  value={profileDraft.description}
                  onChange={(event) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Short bio or notes"
                  disabled={uiState.saving || uiState.updatingPassword}
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hidden 2xl:block">
            <p className="text-sm font-semibold text-slate-900">
              Profile preview
            </p>
            <p className="mt-1 text-xs text-slate-500">
              A clean snapshot of the values that will be saved.
            </p>

            <dl className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 px-4">
              <ProfileRow label="Full name" value={profileDraft.fullName} />
              {isAdmin && (
                <ProfileRow
                  label="Company name"
                  value={profileDraft.companyName}
                />
              )}
              {isAdmin && (
                <ProfileRow
                  label="Phone number"
                  value={profileDraft.phoneNumber}
                />
              )}
              {isAdmin && (
                <ProfileRow label="Address" value={profileDraft.address} />
              )}
              {isAdmin && (
                <ProfileRow
                  label="Description"
                  value={profileDraft.description}
                />
              )}
              <ProfileRow
                label="Email address"
                value={userInfo?.email ?? 'Not signed in'}
              />
              <ProfileRow
                label="Member since"
                value={formatDate(userInfo?.createdAt)}
              />
              <ProfileRow
                label="Provider"
                value={userInfo?.provider ?? 'unknown'}
              />
            </dl>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                Status
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircleIcon className="h-4 w-4" />
                  Session active
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                  <CloudArrowUpIcon className="h-4 w-4 text-blue-500" />
                  Profile sync
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Profile table
            </p>
            <p className="mt-1 text-xs text-slate-500">
              A clean summary of the values saved in your profile.
            </p>

            <dl className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 px-4">
              <ProfileRow
                label="Full name"
                value={userInfo?.fullName ?? 'Not set'}
              />
              {isAdmin && (
                <ProfileRow
                  label="Company name"
                  value={userInfo?.companyName ?? 'Not set'}
                />
              )}
              {isAdmin && (
                <ProfileRow
                  label="Phone number"
                  value={userInfo?.phoneNumber ?? 'Not set'}
                />
              )}
              {isAdmin && (
                <ProfileRow
                  label="Address"
                  value={userInfo?.address ?? 'Not set'}
                />
              )}
              {isAdmin && (
                <ProfileRow
                  label="Description"
                  value={userInfo?.description ?? 'Not set'}
                />
              )}
              <ProfileRow
                label="Email address"
                value={userInfo?.email ?? 'Not signed in'}
              />
              <ProfileRow
                label="Member since"
                value={formatDate(userInfo?.createdAt)}
              />
              <ProfileRow
                label="Provider"
                value={userInfo?.provider ?? 'unknown'}
              />
            </dl>

            {!isAdmin && adminProfile && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-3">
                  Company
                </p>
                <dl className="divide-y divide-blue-100">
                  {adminProfile.fullName && (
                    <ProfileRow label="Admin name" value={adminProfile.fullName} />
                  )}
                  {adminProfile.companyName && (
                    <ProfileRow label="Company name" value={adminProfile.companyName} />
                  )}
                  {adminProfile.phoneNumber && (
                    <ProfileRow label="Phone" value={adminProfile.phoneNumber} />
                  )}
                  {adminProfile.address && (
                    <ProfileRow label="Address" value={adminProfile.address} />
                  )}
                  {adminProfile.description && (
                    <ProfileRow label="Description" value={adminProfile.description} />
                  )}
                </dl>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hidden 2xl:block">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 shadow-sm">
                <UserAvatar avatarUrl={userInfo?.avatarUrl ?? ''} size="lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {userInfo?.fullName || 'Profile not completed'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {isAdmin
                    ? userInfo?.companyName || 'No company name added yet'
                    : adminProfile?.companyName || 'No company name added yet'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircleIcon className="h-4 w-4" />
                    Session active
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    <CloudArrowUpIcon className="h-4 w-4 text-blue-500" />
                    Provider: {userInfo?.provider ?? 'unknown'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-sm font-semibold text-slate-900">
                How to update your profile
              </p>
              {isAdmin ? (
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-600">
                  <li>Click the Edit button at the top of this card.</li>
                  <li>
                    Update your name, avatar, phone, address, and description.
                  </li>
                  <li>Click Save to apply your changes.</li>
                </ol>
              ) : (
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-600">
                  <li>Click the Edit button at the top of this card.</li>
                  <li>Update your display name or choose a new avatar.</li>
                  <li>Click Save to apply your changes.</li>
                </ol>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Tip: you can use Change password below to update account
                security.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Security
            </p>
            <h4 className="mt-1 text-xl font-semibold text-slate-900">
              Password controls
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Change your password only when needed. The form stays hidden until
              you open it.
            </p>
          </div>
          {!uiState.showPasswordForm ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={KeyIcon}
              onClick={() =>
                setUiState((prev) => ({
                  ...prev,
                  showPasswordForm: true,
                }))
              }
            >
              Change password
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={XMarkIcon}
              onClick={() => {
                setUiState((prev) => ({
                  ...prev,
                  showPasswordForm: false,
                }));
                setPasswordDraft({ newPassword: '', confirmPassword: '' });
                setFormErrors((prev) => ({ ...prev, password: null }));
              }}
              disabled={uiState.updatingPassword}
            >
              Close
            </Button>
          )}
        </div>

        {uiState.showPasswordForm && (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <TextField
                id="newPassword"
                label="New password"
                type="password"
                value={passwordDraft.newPassword}
                onChange={(event) =>
                  setPasswordDraft((prev) => ({
                    ...prev,
                    newPassword: event.target.value,
                  }))
                }
                placeholder="Enter a new password"
                disabled={uiState.saving || uiState.updatingPassword}
              />
              <TextField
                id="confirmPassword"
                label="Confirm new password"
                type="password"
                value={passwordDraft.confirmPassword}
                onChange={(event) =>
                  setPasswordDraft((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
                placeholder="Re-enter the new password"
                error={formErrors.password ?? undefined}
                disabled={uiState.saving || uiState.updatingPassword}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-600">
                Password changes take effect immediately after you click update.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleUpdatePassword}
                busy={uiState.updatingPassword}
                disabled={uiState.saving}
              >
                Update Password
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
