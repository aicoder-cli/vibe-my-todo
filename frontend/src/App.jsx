import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { todoAPI } from './services/api';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import FilterBar from './components/FilterBar';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">加载中...</div>;
  return user ? children : <Navigate to="/login" />;
}

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await todoAPI.getTodos();
      setTodos(response.data.data);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (todoData) => {
    try {
      const response = await todoAPI.createTodo(todoData);
      setTodos([response.data.data, ...todos]);
    } catch (err) {
      console.error('Failed to create todo:', err);
    }
  };

  const toggleComplete = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const response = await todoAPI.updateTodo(id, {
        completed: !todo.completed
      });
      setTodos(todos.map(t =>
        t.id === id ? response.data.data : t
      ));
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoAPI.deleteTodo(id);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(todos.map(t => t.category));
    return Array.from(cats);
  }, [todos]);

  const filteredTodos = useMemo(() => {
    let result = [...todos];

    if (filter === 'active') {
      result = result.filter(t => !t.completed);
    } else if (filter === 'completed') {
      result = result.filter(t => t.completed);
    }

    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }

    return result;
  }, [todos, filter, selectedCategory]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;
    return { total, completed, active };
  }, [todos]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-top">
            <h1>待办事项</h1>
            <div className="user-info">
              <span>欢迎, {user?.username}</span>
              <button onClick={logout} className="logout-btn">退出</button>
            </div>
          </div>
          <div className="stats">
            <span>总计: {stats.total}</span>
            <span>未完成: {stats.active}</span>
            <span>已完成: {stats.completed}</span>
          </div>
        </header>

        <TodoForm onAddTodo={addTodo} />

        {todos.length > 0 && (
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
          />
        )}

        <TodoList
          todos={filteredTodos}
          onToggleComplete={toggleComplete}
          onDeleteTodo={deleteTodo}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <TodoApp />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
