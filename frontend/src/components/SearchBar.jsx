import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onSearch, onChange }) => {
  const [input, setInput] = useState(value || '');

  useEffect(() => {
    setInput(value || '');
  }, [value]);

  const triggerSearch = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    if (onSearch) onSearch(input);

    // WS trigger for agent
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws';
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'search', query: input }));
        setTimeout(() => ws.close(), 100);
      };
    } catch (e) {
      console.error("WS error:", e);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (onChange) onChange(val);
  };

  const handleClear = () => {
    setInput('');
    if (onChange) onChange('');
    if (onSearch) onSearch('');
  };

  return (
    <form onSubmit={triggerSearch} className="w-full max-w-2xl mx-auto px-4">
      <div className="relative flex items-center bg-white rounded-sm border border-gray-200 shadow-sm focus-within:shadow-md transition-shadow h-10 sm:h-12">
        <input
          type="text"
          value={input}
          onChange={handleChange}
          placeholder="Search for products, brands and more"
          className="w-full h-full px-4 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />

        <div className="flex items-center h-full">
          {input && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}

          <button
            type="submit"
            className="h-full px-6 flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Search size={20} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;