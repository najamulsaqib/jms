type Database = any;
import { type CreateTodoInput, type Todo } from '../../shared/todo.contracts';

type TodoRow = {
  id: number;
  title: string;
  completed: number;
  created_at: string;
};

function mapTodoRow(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  };
}

export class TodoRepository {
  constructor(private readonly db: Database) {}

  listTodos(): Todo[] {
    const rows = this.db
      .prepare(
        'SELECT id, title, completed, created_at FROM todos ORDER BY id DESC',
      )
      .all() as TodoRow[];

    return rows.map(mapTodoRow);
  }

  createTodo(input: CreateTodoInput): Todo {
    const title = input.title.trim();
    if (!title) {
      throw new Error('Title is required.');
    }

    const insertResult = this.db
      .prepare('INSERT INTO todos (title) VALUES (?)')
      .run(title);

    const row = this.db
      .prepare(
        'SELECT id, title, completed, created_at FROM todos WHERE id = ?',
      )
      .get(insertResult.lastInsertRowid) as TodoRow | undefined;

    if (!row) {
      throw new Error('Failed to create todo.');
    }

    return mapTodoRow(row);
  }
}
