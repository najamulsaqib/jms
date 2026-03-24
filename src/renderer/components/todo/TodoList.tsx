import { type Todo } from '../../types/todo';
import TodoItem from './TodoItem';

type TodoListProps = {
  todos: Todo[];
};

export default function TodoList({ todos }: TodoListProps) {
  if (!todos.length) {
    return <p className="todo-empty">No todos yet. Add your first one.</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
