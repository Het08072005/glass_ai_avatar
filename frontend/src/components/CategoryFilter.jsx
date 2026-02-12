import React from 'react';

const CategoryFilter = ({ selectedCategory, setSelectedCategory }) => {
  const categories = ['all', 'male', 'female', 'unisex'];

  return (
    <div className="space-y-3">
      <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Gender</h3>
      <div className="flex flex-col gap-2">
        {categories.map((category) => (
          <label key={category} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="category"
              value={category}
              checked={selectedCategory === category}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span className={`text-sm ${selectedCategory === category ? 'text-black font-bold' : 'text-gray-600'} group-hover:text-blue-600 transition-colors capitalize`}>
              {category}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;