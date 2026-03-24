import { useCallback, useEffect, useState } from 'react';
import { todoApi } from '../services/todo.api';
import { type Todo } from '../types/todo';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await todoApi.list();
      setTodos(items);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load todos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTodo = useCallback(async (title: string) => {
    setSubmitting(true);
    setError(null);

    try {
      const newTodo = await todoApi.create({ title });
      setTodos((current) => [newTodo, ...current]);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create todo.';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  return {
    todos,
    loading,
    submitting,
    error,
    addTodo,
    reload: loadTodos,
  };
}
