import TodoForm from '../components/todo/TodoForm';
import TodoList from '../components/todo/TodoList';
import { useTodos } from '../hooks/useTodos';

export default function TodoPage() {
  const { todos, loading, submitting, error, addTodo } = useTodos();

  return (
    <main className="todo-page">
      <section className="todo-card">
        <h1>Local Todo</h1>
        <p className="todo-subtitle">Stored with better-sqlite3 in your app data folder.</p>

        <TodoForm onSubmit={addTodo} submitting={submitting} />

        {error ? <p className="todo-error">{error}</p> : null}
        {loading ? <p className="todo-empty">Loading todos...</p> : <TodoList todos={todos} />}
      </section>
    </main>
  );
}
