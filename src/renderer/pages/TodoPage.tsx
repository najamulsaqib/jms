import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import DataTable, {
  type DataTableColumn,
  type SortState,
} from '../components/table/DataTable';
import Button from '../components/ui/Button';
import SelectField from '../components/ui/SelectField';
import TextField from '../components/ui/TextField';
import { useTodos } from '../hooks/useTodos';
import { type Todo } from '../types/todo';

type TodoStatusFilter = 'all' | 'open' | 'done';

function sortRows(rows: Todo[], sortState: SortState): Todo[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    let comparison = 0;

    if (sortState.key === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortState.key === 'status') {
      comparison = Number(a.completed) - Number(b.completed);
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
  const [statusFilter, setStatusFilter] = useState<TodoStatusFilter>('all');
  const [sortState, setSortState] = useState<SortState>({
    key: 'createdAt',
    direction: 'desc',
  });

  const filtered = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return todos.filter((todo) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open' && !todo.completed) ||
        (statusFilter === 'done' && todo.completed);

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableValues = [
        todo.id,
        todo.title,
        todo.completed ? 'done' : 'open',
        todo.completed ? 'completed' : 'not completed',
        todo.createdAt,
        new Date(todo.createdAt).toLocaleString(),
      ];

      return searchableValues.some((value) =>
        String(value).toLowerCase().includes(normalizedSearch),
      );
    });
  }, [searchQuery, statusFilter, todos]);

  const sortedTodos = useMemo(
    () => sortRows(filtered, sortState),
    [filtered, sortState],
  );

  const columns: DataTableColumn<Todo>[] = [
    {
      id: 'title',
      header: 'Title',
      sortable: true,
      render: (todo) => <span className="todo-title-cell">{todo.title}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (todo) => (
        <span className={todo.completed ? 'status-badge done' : 'status-badge open'}>
          {todo.completed ? 'Done' : 'Open'}
        </span>
      ),
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
            onClick={() => deleteTodo(todo.id)}
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
            <p className="dashboard-eyebrow">Work Queue</p>
            <h1>Task Dashboard</h1>
            <p className="todo-subtitle">
              Professional view with sorting and reusable table actions.
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
            placeholder="Search all fields..."
          />
          <SelectField
            id="status-filter"
            label="Filter by status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TodoStatusFilter)
            }
            options={[
              { label: 'All', value: 'all' },
              { label: 'Open', value: 'open' },
              { label: 'Done', value: 'done' },
            ]}
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
      </section>
    </main>
  );
}
