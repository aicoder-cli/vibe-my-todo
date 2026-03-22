function FilterBar({ filter, setFilter, selectedCategory, setSelectedCategory, categories }) {
  const filters = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '未完成' },
    { value: 'completed', label: '已完成' }
  ];

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">状态：</span>
        {filters.map((f) => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="filter-group">
        <span className="filter-label">分类：</span>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
        >
          <option value="all">全部</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default FilterBar;
