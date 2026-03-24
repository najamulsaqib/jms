import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import TodoPage from './pages/TodoPage';
import TodoFormPage from './pages/TodoFormPage';
import './App.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TodoPage />} />
        <Route path="/todos/new" element={<TodoFormPage />} />
        <Route path="/todos/:todoId/edit" element={<TodoFormPage />} />
      </Routes>
    </Router>
  );
}
