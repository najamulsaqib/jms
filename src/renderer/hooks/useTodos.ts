import { useCallback, useEffect, useState } from 'react';
import { todoApi } from '../services/todo.api';
import {
  type CreateTodoInput,
  type Todo,
  type UpdateTodoInput,
} from '../types/todo';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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

  const addTodo = useCallback(async (payload: CreateTodoInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const newTodo = await todoApi.create(payload);
      setTodos((current) => [newTodo, ...current]);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create record.';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateTodo = useCallback(
    async (id: number, payload: UpdateTodoInput) => {
      setSubmitting(true);
      setError(null);

      try {
        const updatedTodo = await todoApi.update(id, payload);
        setTodos((current) =>
          current.map((todo) => (todo.id === id ? updatedTodo : todo)),
        );
        return updatedTodo;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update todo.';
        setError(message);
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const deleteTodo = useCallback(async (id: number) => {
    setDeletingId(id);
    setError(null);

    try {
      await todoApi.remove(id);
      setTodos((current) => current.filter((todo) => todo.id !== id));
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete todo.';
      setError(message);
      return false;
    } finally {
      setDeletingId(null);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  return {
    todos,
    loading,
    submitting,
    deletingId,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    reload: loadTodos,
  };
}
