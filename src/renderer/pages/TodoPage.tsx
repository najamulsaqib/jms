import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import DataTable, {
  type DataTableColumn,
  type SortState,
} from '../components/table/DataTable';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TextField from '../components/ui/TextField';
import { useTodos } from '../hooks/useTodos';
import { type Todo } from '../types/todo';

function sortRows(rows: Todo[], sortState: SortState): Todo[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    let comparison = 0;

    if (sortState.key === 'id') {
      comparison = a.id - b.id;
    } else if (sortState.key === 'referenceNumber') {
      comparison = a.referenceNumber.localeCompare(b.referenceNumber);
    } else if (sortState.key === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortState.key === 'cnic') {
      comparison = a.cnic.localeCompare(b.cnic);
    } else if (sortState.key === 'email') {
      comparison = a.email.localeCompare(b.email);
    } else if (sortState.key === 'reference') {
      comparison = a.reference.localeCompare(b.reference);
    } else if (sortState.key === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else {
      comparison =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return sortState.direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export default function TodoPage() {
  const navigate = useNavigate();
  const { todos, loading, deletingId, error, deleteTodo } = useTodos();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<SortState>({
    key: 'id',
    direction: 'asc',
  });
  const [pendingDeleteTodo, setPendingDeleteTodo] = useState<Todo | null>(null);

  const requestDelete = (todo: Todo) => {
    setPendingDeleteTodo(todo);
  };

  const cancelDelete = () => {
    if (deletingId !== null) {
      return;
    }

    setPendingDeleteTodo(null);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteTodo) {
      return;
    }

    const deleted = await deleteTodo(pendingDeleteTodo.id);
    if (deleted) {
      setPendingDeleteTodo(null);
    }
  };

  const filtered = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return todos.filter((todo) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchableValues = [
        todo.referenceNumber,
        todo.id,
        todo.name,
        todo.cnic,
        todo.email,
        todo.reference,
        todo.status,
        todo.notes,
        todo.createdAt,
        new Date(todo.createdAt).toLocaleString(),
      ];

      return searchableValues.some((value) =>
        String(value).toLowerCase().includes(normalizedSearch),
      );
    });
  }, [searchQuery, todos]);

  const sortedTodos = useMemo(
    () => sortRows(filtered, sortState),
    [filtered, sortState],
  );

  const columns: DataTableColumn<Todo>[] = [
    {
      id: 'referenceNumber',
      header: 'Reference #',
      sortable: true,
      render: (todo) => <span className="todo-title-cell">{todo.referenceNumber}</span>,
    },
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      render: (todo) => <span className="todo-title-cell">{todo.name}</span>,
    },
    {
      id: 'cnic',
      header: 'CNIC',
      sortable: true,
      render: (todo) => <span>{todo.cnic}</span>,
    },
    {
      id: 'email',
      header: 'Email',
      sortable: true,
      render: (todo) => <span>{todo.email}</span>,
    },
    {
      id: 'reference',
      header: 'Reference',
      sortable: true,
      render: (todo) => <span>{todo.reference}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (todo) => <span>{todo.status}</span>,
    },
    {
      id: 'createdAt',
      header: 'Created',
      sortable: true,
      align: 'right',
      render: (todo) => (
        <span className="date-cell">
          {new Date(todo.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      render: (todo) => (
        <div className="table-actions">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => navigate(`/todos/${todo.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="button"
            busy={deletingId === todo.id}
            onClick={() => requestDelete(todo)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              Dashboard
            </p>
            <h1>Tax Records</h1>
            <p className="todo-subtitle">
              Manage client tax records, including reference numbers, CNICs, contact details, and filing status. Add new entries or edit existing ones to keep your records up to date.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={() => navigate('/todos/new')}
          >
            Add New Entry
          </Button>
        </header>

        <div className="dashboard-filters">
          <TextField
            id="search-filter"
            label="Search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search reference #, id, name, CNIC, email, notes..."
          />
        </div>

        {error ? <p className="todo-error">{error}</p> : null}
        {loading ? (
          <p className="todo-empty">Loading records...</p>
        ) : (
          <DataTable
            columns={columns}
            rows={sortedTodos}
            getRowId={(row) => row.id}
            sortState={sortState}
            onSortChange={setSortState}
            emptyMessage="No entries found. Add your first record."
          />
        )}

        <ConfirmDialog
          isOpen={pendingDeleteTodo !== null}
          title="Delete this record?"
          message={
            pendingDeleteTodo
              ? `This action cannot be undone. The record for ${pendingDeleteTodo.name} will be permanently deleted.`
              : ''
          }
          cancelLabel="Keep record"
          confirmLabel="Delete permanently"
          confirmVariant="danger"
          busy={
            pendingDeleteTodo !== null && deletingId === pendingDeleteTodo.id
          }
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      </section>
    </main>
  );
}
