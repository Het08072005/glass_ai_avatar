import React from 'react';
import { Link } from 'react-router-dom';

const getColor = (colorName) => {
  const map = {
    // Basic & Monochrome
    'black': '#000000', 'matte-black': '#282828', 'matte black': '#282828',
    'white': '#ffffff', 'off-white': '#f5f5f5', 'off white': '#f5f5f5', 'ivory': '#fffff0',

    // Reds
    'red': '#ff0000', 'maroon': '#800000', 'burgundy': '#800020', 'wine': '#722f37',
    'ruby-red': '#9b111e',

    // Blues
    'blue': '#0000ff', 'navy': '#000080', 'royal-blue': '#4169e1', 'royal blue': '#4169e1',
    'sky-blue': '#87ceeb', 'sky blue': '#87ceeb', 'teal': '#008080', 'turquoise': '#40e0d0',
    'midnight-blue': '#191970', 'dark-blue': '#00008b', 'navy-blue': '#000080',

    // Greens
    'green': '#008000', 'olive': '#808000', 'dark-green': '#006400', 'dark green': '#006400',
    'lime': '#00ff00', 'mint': '#98ff98', 'emerald-green': '#50c878', 'green-solid': '#008000',

    // Greys
    'grey': '#808080', 'gray': '#808080', 'dark-grey': '#a9a9a9', 'dark grey': '#a9a9a9',
    'light-grey': '#d3d3d3', 'light grey': '#d3d3d3', 'smoke': '#738276', 'gunmetal': '#2a3439',
    'carbon-grey': '#625d5d', 'black-iron': '#48494b',

    // Browns
    'brown': '#a52a2a', 'dark-brown': '#654321', 'dark brown': '#654321',
    'chocolate': '#d2691e', 'coffee': '#6f4e37', 'bronze': '#cd7f32', 'copper': '#b87333',

    // Pinks/Purples
    'pink': '#ffc0cb', 'hot-pink': '#ff69b4', 'hot pink': '#ff69b4', 'rose': '#ff007f',
    'peach': '#ffe5b4', 'purple': '#800080', 'violet': '#ee82ee', 'lavender': '#e6e6fa',
    'rose-gold': '#b76e79', 'rose gold': '#b76e79', 'rose-tint': '#ffdae9',

    // Yellows/Oranges
    'yellow': '#ffff00', 'mustard': '#ffdb58', 'orange': '#ffa500', 'rust': '#b7410e',
    'gold': '#ffd700', 'amber-tortoise': '#ffbf00', 'champagne': '#f7e7ce', 'matte-gold': '#cfb53b',

    // Metallics (extra)
    'silver': '#c0c0c0', 'matte-silver': '#cfcfcf', 'brushed-chrome': '#e5e4e2',
    'dark-chrome': '#7a7a7a', 'onyx-black': '#0f0f0f',

    // Transparent/Clear
    'clear': '#f0f8ff', 'transparent': '#f0f8ff', 'crystal': '#e0ffff', 'crystal-clear': '#f0f8ff',

    // Patterns/Complex
    'tortoise': 'linear-gradient(45deg, #3e2723 25%, #d7ccc8 25%, #3e2723 50%, #d7ccc8 50%, #3e2723 75%, #d7ccc8 75%, #3e2723 100%)',
    'dark-tortoise': '#3e2723', 'havana': '#964b00', 'beige': '#f5f5dc', 'cream': '#fffdd0', 'tan': '#d2b48c',

    // Gradients & Mirrors
    'gradient-black': 'linear-gradient(to bottom, #000 0%, #999 100%)', 'gradient black': 'linear-gradient(to bottom, #000 0%, #999 100%)',
    'gradient-brown': 'linear-gradient(to bottom, #654321 0%, #d2b48c 100%)', 'gradient brown': 'linear-gradient(to bottom, #654321 0%, #d2b48c 100%)',
    'gradient-grey': 'linear-gradient(to bottom, #444 0%, #ccc 100%)', 'gradient grey': 'linear-gradient(to bottom, #444 0%, #ccc 100%)',
    'grey-gradient': 'linear-gradient(to bottom, #444 0%, #ccc 100%)',
    'brown-gradient': 'linear-gradient(to bottom, #654321 0%, #d2b48c 100%)',
    'smoke-gradient': 'linear-gradient(to bottom, #738276 0%, #d3d3d3 100%)',

    'smoke-black': '#333333', 'smoke black': '#333333',
    'smoke-grey': '#708090', 'smoke grey': '#708090',
    'smoke-brown': '#594a42', 'smoke brown': '#594a42',

    'mirror-silver': 'conic-gradient(#c0c0c0, #ffffff, #c0c0c0)', 'mirror silver': 'conic-gradient(#c0c0c0, #ffffff, #c0c0c0)',
    'mirror-blue': 'conic-gradient(#0000ff, #87ceeb, #0000ff)', 'mirror blue': 'conic-gradient(#0000ff, #87ceeb, #0000ff)',
    'mirror-green': 'conic-gradient(#008000, #98ff98, #008000)', 'mirror green': 'conic-gradient(#008000, #98ff98, #008000)',
    'mirror-gold': 'conic-gradient(#ffd700, #ffffe0, #ffd700)', 'mirror gold': 'conic-gradient(#ffd700, #ffffe0, #ffd700)',
    'blue-mirror': 'linear-gradient(135deg, #003366, #66ccff)',

    'polarized-grey': '#555555', 'polarized grey': '#555555',
    'polarized-brown': '#8b4513', 'polarized brown': '#8b4513',
    'polarized-green': '#2e8b57', 'polarized green': '#2e8b57',

    'black-gold': 'linear-gradient(90deg, black 50%, gold 50%)', 'black gold': 'linear-gradient(90deg, black 50%, gold 50%)',
    'black-silver': 'linear-gradient(90deg, black 50%, silver 50%)', 'black silver': 'linear-gradient(90deg, black 50%, silver 50%)',
    'blue-gold': 'linear-gradient(90deg, blue 50%, gold 50%)', 'blue gold': 'linear-gradient(90deg, blue 50%, gold 50%)'
  };
  return map[colorName?.toLowerCase()] || colorName;
};

const ProductCard = ({ product }) => {
  const { id, name, brand, price_usd, images, rating } = product;
  const mainImage = images?.[0] || 'https://via.placeholder.com/300';

  return (
    <Link
      to={`/products/${id}`}
      className="group relative flex flex-col bg-[#0a0a0a] border border-white/[0.05] rounded-3xl overflow-hidden transition-all duration-500 hover:border-[#c5a059]/30 h-full shadow-lg"
    >
      {/* Compact Gallery Container */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-white flex items-center justify-center p-6 transition-all duration-700">
        <img
          src={mainImage}
          alt={name}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-all duration-1000 ease-out"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x250?text=Premium+Shade'; }}
        />

        {/* Dynamic Badge */}
        <div className="absolute top-3 right-3 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
          <div className="bg-[#c5a059] text-black text-[7px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full">
            NEW
          </div>
        </div>
      </div>

      {/* Tightened Metadata Section */}
      <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#c5a059] text-[8px] font-black uppercase tracking-[0.2em]">
            {brand}
          </span>
          <div className="flex items-center gap-1 opacity-60">
            <span className="text-[#c5a059] text-[10px]">★</span>
            <span className="text-white text-[10px] font-bold">{rating || '4.9'}</span>
          </div>
        </div>

        <h3 className="text-white text-xs font-serif mb-3 leading-tight group-hover:text-[#c5a059] transition-colors duration-500 line-clamp-1 uppercase tracking-wider">
          {name}
        </h3>

        {/* Color Indicators */}
        <div className="flex items-center justify-between mb-4 px-1">
          {product.frame_colors?.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-white text-[6px] uppercase tracking-[0.2em]">Frame</span>
              <div className="flex gap-1.5">
                {product.frame_colors.map((c, i) => (
                  <div key={i} title={`Frame: ${c}`} className="w-2 h-2 rounded-full ring-1 ring-white/10 shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                    style={{ background: getColor(c) }} />
                ))}
              </div>
            </div>
          )}

          {product.lens_colors?.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {product.lens_colors.map((c, i) => (
                  <div key={i} title={`Lens: ${c}`} className="w-2 h-2 rounded-full ring-1 ring-white/10 shadow-[0_0_4px_rgba(0,0,0,0.5)] relative overflow-hidden"
                    style={{ background: getColor(c) }}>
                  </div>
                ))}
              </div>
              <span className="text-white text-[6px] uppercase tracking-[0.2em] text-right">Lens</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-md font-serif text-white tracking-widest">
            ${price_usd}
          </span>
          <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 group-hover:text-[#c5a059] group-hover:border-[#c5a059]/50 transition-all duration-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
