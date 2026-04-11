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
  TrashIcon,
  UserIcon,
} from '@heroicons/react/20/solid';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useTeamManagement } from '@hooks/useTeamManagement';
import { PAGE_SIZE } from '@lib/enums';
import type { ManagedUser } from '@services/teamManagement.api';
import { useState } from 'react';
import UserModal from './UserModal';

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
      id: 'status',
      header: 'Status',
      render: (user) =>
        user.isBanned ? (
          <Chip variant="red" size="sm">
            Banned
          </Chip>
        ) : (
          <Chip variant="green" size="sm">
            Active
          </Chip>
        ),
    },
    {
      id: 'email',
      header: 'Email',
      render: (user) => user.email,
    },
    {
      id: 'fullName',
      header: 'Full Name',
      render: (user) => (
        <div className="flex items-center gap-2">
          <div className="items-center justify-center rounded-full border border-blue-100 bg-blue-50 overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || user.email}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="h-7 w-7 text-blue-400">
                <UserCircleIcon className="h-7 w-7" />
              </span>
            )}
          </div>
          <span>{user.fullName || '—'}</span>
        </div>
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
    {
      id: 'actions',
      header: '',
      render: (user) => (
        <DropdownMenu
          items={[
            {
              label: 'View Profile',
              icon: UserIcon,
              onClick: () => setModal({ mode: 'view', user }),
            },
            {
              label: 'Edit',
              icon: PencilSquareIcon,
              onClick: () => setModal({ mode: 'edit', user }),
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
        <div className="mb-6 flex items-center justify-between p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Team Members
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Manage users that access your account
            </p>
          </div>
          <Button icon={PlusIcon} onClick={() => setModal({ mode: 'add' })}>
            Add User
          </Button>
        </div>

        {managedUsers.length === 0 ? (
          <div className="mx-6 mb-6 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">
              No team members yet. Add your first user to get started.
            </p>
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
        onEdit={
          modal?.mode === 'view'
            ? () => setModal({ mode: 'edit', user: modal.user })
            : undefined
        }
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
