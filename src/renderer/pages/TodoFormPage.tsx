import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import CheckboxField from '../components/ui/CheckboxField';
import TextField from '../components/ui/TextField';
import { todoApi } from '../services/todo.api';

export default function TodoFormPage() {
  const { todoId } = useParams<{ todoId: string }>();
  const navigate = useNavigate();

  const parsedId = useMemo(() => {
    if (!todoId) {
      return null;
    }

    const id = Number(todoId);
    return Number.isNaN(id) ? null : id;
  }, [todoId]);

  const isEditMode = parsedId !== null;

  const [title, setTitle] = useState('');
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTodo = async () => {
      if (!isEditMode || parsedId === null) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const todo = await todoApi.getById(parsedId);
        if (!mounted) {
          return;
        }
        setTitle(todo.title);
        setCompleted(todo.completed);
      } catch (err) {
        if (!mounted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Failed to load entry.';
        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTodo();

    return () => {
      mounted = false;
    };
  }, [isEditMode, parsedId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditMode && parsedId !== null) {
        await todoApi.update(parsedId, { title, completed });
        setSuccess('Entry updated successfully.');
      } else {
        const created = await todoApi.create({ title });
        navigate(`/todos/${created.id}/edit`, { replace: true });
        setSuccess('Entry created. You are now editing this record.');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save entry.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-card form-card">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Entry Form</p>
            <h1>{isEditMode ? 'Edit Entry' : 'Create Entry'}</h1>
            <p className="todo-subtitle">
              {isEditMode
                ? 'Update your record using reusable field components.'
                : 'Create a record, then continue in edit mode on the same page.'}
            </p>
          </div>
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/')}
          >
            Back to Table
          </Button>
        </header>

        {loading ? (
          <p className="todo-empty">Loading entry...</p>
        ) : (
          <form className="entry-form" onSubmit={handleSubmit}>
            <TextField
              id="todo-title"
              label="Title"
              hint="Use a concise professional task name"
              value={title}
              maxLength={140}
              placeholder="Quarterly budget review"
              onChange={(event) => setTitle(event.target.value)}
              required
            />

            <CheckboxField
              id="todo-completed"
              label="Mark as completed"
              hint="Availability in edit mode"
              checked={completed}
              onChange={(event) => setCompleted(event.target.checked)}
              disabled={!isEditMode}
            />

            <div className="form-actions">
              <Button type="submit" size="lg" busy={saving}>
                {isEditMode ? 'Save Changes' : 'Create Entry'}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {error ? <p className="todo-error">{error}</p> : null}
        {success ? <p className="todo-success">{success}</p> : null}
      </section>
    </main>
  );
}
