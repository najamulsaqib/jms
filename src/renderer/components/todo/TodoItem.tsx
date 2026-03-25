import { type Todo } from '../../types/todo';

type TodoItemProps = {
  todo: Todo;
};

export default function TodoItem({ todo }: TodoItemProps) {
  return (
    <li className="todo-item">
      <p>{todo.name}</p>
      <small>Created {new Date(todo.createdAt).toLocaleString()}</small>
    </li>
  );
}
