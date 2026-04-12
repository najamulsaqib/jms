import LoadingSpinner from '@components/common/LoadingSpinner';
import DataTable, { DataTableColumn } from '@components/table/DataTable';
import Pagination from '@components/table/Pagination';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { Chip } from '@components/ui/Chip';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import DropdownMenu from '@components/ui/DropdownMenu';
import {
  NoSymbolIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/20/solid';
import {
  CheckBadgeIcon,
  UserCircleIcon,
  UserMinusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useTeamManagement } from '@hooks/useTeamManagement';
import { PAGE_SIZE } from '@lib/enums';
import type { ManagedUser } from '@services/teamManagement.api';
import { useState } from 'react';
import UserModal from './UserModal';
import UserPermissionsModal from './UserPermissionsModal';

type ModalState =
  | { mode: 'add' }
  | { mode: 'edit'; user: ManagedUser }
  | { mode: 'view'; user: ManagedUser }
  | null;

export default function TeamManagementSection() {
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: PAGE_SIZE.TABLES,
  });

  const {
    managedUsers,
    total,
    activeCount,
    bannedCount,
    isLoading,
    error,
    banUser,
    isBanningUser,
    deleteUser,
    isDeletingUser,
  } = useTeamManagement(pagination);

  const [modal, setModal] = useState<ModalState>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] =
    useState<ManagedUser | null>(null);
  const [banConfirmUser, setBanConfirmUser] = useState<ManagedUser | null>(
    null,
  );
  const [permissionsUser, setPermissionsUser] = useState<ManagedUser | null>(
    null,
  );

  const handleConfirmDelete = () => {
    if (!deleteConfirmUser) return;
    deleteUser(deleteConfirmUser.userId, {
      onSuccess: () => setDeleteConfirmUser(null),
    });
  };

  const handleConfirmBan = () => {
    if (!banConfirmUser) return;
    banUser(
      { userId: banConfirmUser.userId, ban: !banConfirmUser.isBanned },
      { onSuccess: () => setBanConfirmUser(null) },
    );
  };

  const columns: DataTableColumn<ManagedUser>[] = [
    {
      id: 'actions',
      header: '',
      align: 'right',
      pinned: 'left',
      render: (user) => (
        <DropdownMenu
          buttonVariant="ghost"
          items={[
            {
              label: 'View Profile',
              icon: UserIcon,
              onClick: () => setModal({ mode: 'view', user }),
            },
            {
              label: 'Edit Details',
              icon: PencilSquareIcon,
              onClick: () => setModal({ mode: 'edit', user }),
            },
            {
              label: 'Manage Permissions',
              icon: ShieldCheckIcon,
              onClick: () => setPermissionsUser(user),
              divider: true,
            },
            {
              label: user.isBanned ? 'Unban User' : 'Ban User',
              icon: NoSymbolIcon,
              onClick: () => setBanConfirmUser(user),
            },
            {
              label: 'Delete User',
              icon: TrashIcon,
              variant: 'danger',
              onClick: () => setDeleteConfirmUser(user),
            },
          ]}
        />
      ),
    },
    {
      id: 'member',
      header: 'Member',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="items-center justify-center rounded-full border border-blue-100 bg-blue-50 overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || user.email}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="h-8 w-8 text-blue-400">
                <UserCircleIcon className="h-8 w-8" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.fullName || 'No name provided'}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      render: (user) =>
        user.isBanned ? (
          <Chip variant="red" size="sm" rounded="full">
            Banned
          </Chip>
        ) : (
          <Chip variant="green" size="sm" rounded="full">
            Active
          </Chip>
        ),
    },
    {
      id: 'email',
      header: 'Email',
      render: (user) => <span className="text-slate-600">{user.email}</span>,
    },
    {
      id: 'role',
      header: 'Role',
      render: (user) => (
        <Chip variant={user.role === 'admin' ? 'blue' : 'grey'} size="sm">
          {user.role}
        </Chip>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      render: (user) =>
        new Date(user.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
  ];

  if (isLoading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="lg">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card padding="none">
        <div className="border-b border-slate-200 bg-linear-to-r from-slate-50 to-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Team Members
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Manage account access, profile details, and permission controls.
              </p>
            </div>
            <Button icon={PlusIcon} onClick={() => setModal({ mode: 'add' })}>
              Add Team Member
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <UsersIcon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Total Members
                </span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {total}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckBadgeIcon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Active Members
                </span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {activeCount}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-red-600">
                <UserMinusIcon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Banned Members
                </span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {bannedCount}
              </p>
            </div>
          </div>
        </div>

        {managedUsers.length === 0 ? (
          <div className="m-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <UsersIcon className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-800">
              No team members found
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Add your first team member to start assigning account access.
            </p>
            <div className="mt-4 flex justify-center">
              <Button icon={PlusIcon} onClick={() => setModal({ mode: 'add' })}>
                Invite First Member
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={managedUsers}
              getRowId={(user) => user.userId}
            />
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={total}
              onPageChange={(page) =>
                setPagination((prev) => ({ ...prev, page }))
              }
              onPageSizeChange={(size) => {
                setPagination((prev) => ({ ...prev, pageSize: size, page: 0 }));
              }}
            />
          </>
        )}
      </Card>

      <UserModal
        open={modal !== null}
        user={modal && modal.mode !== 'add' ? modal.user : null}
        mode={modal?.mode ?? 'add'}
        onClose={() => setModal(null)}
      />

      <UserPermissionsModal
        open={permissionsUser !== null}
        user={permissionsUser}
        onClose={() => setPermissionsUser(null)}
      />

      <ConfirmDialog
        title="Delete User"
        message={`Are you sure you want to permanently delete ${deleteConfirmUser?.email}? This cannot be undone.`}
        isOpen={!!deleteConfirmUser}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmUser(null)}
        busy={isDeletingUser}
        confirmLabel="Delete"
        confirmVariant="danger"
      />

      <ConfirmDialog
        title={banConfirmUser?.isBanned ? 'Unban User' : 'Ban User'}
        message={
          banConfirmUser?.isBanned
            ? `Unban ${banConfirmUser?.email}? They will be able to sign in again.`
            : `Ban ${banConfirmUser?.email}? They will be immediately signed out and unable to log in.`
        }
        isOpen={!!banConfirmUser}
        onConfirm={handleConfirmBan}
        onCancel={() => setBanConfirmUser(null)}
        busy={isBanningUser}
        confirmLabel={banConfirmUser?.isBanned ? 'Unban' : 'Ban'}
        confirmVariant={banConfirmUser?.isBanned ? 'primary' : 'danger'}
      />
    </>
  );
}
