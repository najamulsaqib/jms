import { FormEvent, useState } from 'react';

type TodoFormProps = {
  onSubmit: (title: string) => Promise<boolean>;
  submitting: boolean;
};

export default function TodoForm({ onSubmit, submitting }: TodoFormProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const created = await onSubmit(title);
    if (created) {
      setTitle('');
    }
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        className="todo-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Write your next todo"
        maxLength={140}
      />
      <button className="todo-button" type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Add'}
      </button>
    </form>
  );
}
