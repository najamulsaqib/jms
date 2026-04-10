import LoadingSpinner from '@components/common/LoadingSpinner';
import DataTable, { DataTableColumn } from '@components/table/DataTable';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/20/solid';
import { useTeamManagement } from '@hooks/useTeamManagement';
import type { ManagedUser } from '@services/teamManagement.api';
import { useState } from 'react';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';

export default function TeamManagementSection() {
  const { managedUsers, isLoading, error, deleteUser, isDeletingUser } =
    useTeamManagement();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] =
    useState<ManagedUser | null>(null);

  const handleEditClick = (user: ManagedUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteClick = (user: ManagedUser) => {
    setDeleteConfirmUser(user);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmUser) {
      deleteUser(deleteConfirmUser.userId, {
        onSuccess: () => {
          setDeleteConfirmUser(null);
        },
      });
    }
  };

  const columns: DataTableColumn<ManagedUser>[] = [
    {
      id: 'email',
      header: 'Email',
      render: (user: ManagedUser) => user.email,
    },
    {
      id: 'fullName',
      header: 'Full Name',
      render: (user: ManagedUser) => user.fullName || '—',
    },
    {
      id: 'companyName',
      header: 'Company',
      render: (user: ManagedUser) => user.companyName || '—',
    },
    {
      id: 'createdAt',
      header: 'Created',
      render: (user: ManagedUser) =>
        new Date(user.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      id: 'actions',
      header: '',
      size: '80px',
      render: (user: ManagedUser) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditClick(user)}
            className="text-slate-600 hover:text-slate-900 rounded p-1"
            title="Edit user"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(user)}
            className="text-red-600 hover:text-red-900 rounded p-1"
            title="Delete user"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
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
      <Card padding="lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Team Members
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Manage users that access your account
            </p>
          </div>
          <Button icon={PlusIcon} onClick={() => setShowAddModal(true)}>
            Add User
          </Button>
        </div>

        {managedUsers.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">
              No team members yet. Add your first user to get started.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={managedUsers}
            getRowId={(user) => user.userId}
          />
        )}
      </Card>

      <AddUserModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {selectedUser && (
        <EditUserModal
          open={showEditModal}
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      <ConfirmDialog
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirmUser?.email}? This action cannot be undone.`}
        isOpen={!!deleteConfirmUser}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmUser(null)}
        busy={isDeletingUser}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </>
  );
}
