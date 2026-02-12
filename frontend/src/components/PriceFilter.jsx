import React from 'react';

const PriceFilter = ({ minPrice, setMinPrice, maxPrice, setMaxPrice }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Price Range</h3>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full border border-gray-200 rounded-sm px-2 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition-all shadow-inner bg-gray-50"
          />
        </div>
        <span className="text-gray-400 text-xs">to</span>
        <div className="flex-1">
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full border border-gray-200 rounded-sm px-2 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition-all shadow-inner bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};

export default PriceFilter;