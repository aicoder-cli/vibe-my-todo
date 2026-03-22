import { useState } from 'react';

function TodoForm({ onAddTodo }) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('工作');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const categories = ['工作', '学习', '生活', '其他'];
  const priorities = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      const todoData = {
        text: text.trim(),
        category,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null
      };
      onAddTodo(todoData);
      setText('');
      setDueDate('');
    }
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="添加新的待办事项..."
        className="todo-input"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="category-select"
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="priority-select"
      >
        {priorities.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <input
        type="datetime-local"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="due-date-input"
      />
      <button type="submit" className="add-btn">
        添加
      </button>
    </form>
  );
}

export default TodoForm;
