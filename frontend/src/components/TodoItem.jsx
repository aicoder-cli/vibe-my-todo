function TodoItem({ todo, onToggleComplete, onDeleteTodo }) {
  const categoryColors = {
    '工作': '#4CAF50',
    '学习': '#2196F3',
    '生活': '#FF9800',
    '其他': '#9C27B0'
  };

  const priorityColors = {
    'low': '#8BC34A',
    'medium': '#FFC107',
    'high': '#F44336'
  };

  const priorityLabels = {
    'low': '低',
    'medium': '中',
    'high': '高'
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id)}
        className="todo-checkbox"
      />
      <div className="todo-content">
        <span className="todo-text">{todo.text}</span>
        <div className="todo-meta">
          <span
            className="todo-category"
            style={{ backgroundColor: categoryColors[todo.category] }}
          >
            {todo.category}
          </span>
          <span
            className="todo-priority"
            style={{ backgroundColor: priorityColors[todo.priority] }}
          >
            {priorityLabels[todo.priority]}
          </span>
          {todo.due_date && (
            <span className="todo-due-date">
              📅 {formatDate(todo.due_date)}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onDeleteTodo(todo.id)}
        className="delete-btn"
      >
        删除
      </button>
    </div>
  );
}

export default TodoItem;
