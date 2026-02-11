import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axios';

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

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const resp = await axios.get(`/products/${id}`);
        setProduct(resp.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchProduct();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-12">
      <h1 className="text-4xl font-serif text-white mb-6 uppercase tracking-widest">Piece Not Found</h1>
      <Link to="/products" className="text-[#c5a059] border border-[#c5a059]/30 px-10 py-4 text-[10px] uppercase tracking-widest hover:bg-[#c5a059] hover:text-black transition-all">Return to Gallery</Link>
    </div>
  );

  const images = product.images || ['https://via.placeholder.com/800'];

  return (
    <div className="bg-[#050505] min-h-screen pb-16 sm:pb-24 md:pb-32">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Navigation Breadcrumb */}
        <div className="flex gap-2 sm:gap-4 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-white/40 mb-10 sm:mb-16 font-light overflow-x-auto">
          <Link to="/" className="hover:text-white transition-colors whitespace-nowrap">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-white transition-colors whitespace-nowrap">Archive</Link>
          <span>/</span>
          <span className="text-white/60 italic lowercase truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-16 md:gap-20">

          {/* Gallery - 7 cols */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className="glass rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 md:p-12 flex items-center justify-center relative group min-h-[300px] sm:min-h-[400px] md:min-h-[450px]">
              {/* Reduced Image height as requested */}
              <img
                src={images[activeImage]}
                className="max-h-[250px] sm:max-h-[300px] md:max-h-[350px] w-full object-contain transition-transform duration-1000 group-hover:scale-105"
                alt={product.name}
              />

              <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-6 sm:left-8 md:left-10 flex gap-2 sm:gap-3 md:gap-4">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 border transition-all rounded-lg sm:rounded-xl p-1 overflow-hidden ${activeImage === i ? 'border-[#c5a059] scale-110' : 'border-white/10 opacity-40 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-contain" alt="thumb" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="glass p-6 sm:p-10 md:p-12 rounded-2xl sm:rounded-[2rem]">
                <h4 className="text-[#c5a059] text-[10px] tracking-widest uppercase mb-3 sm:mb-4">Design Philosophy</h4>
                <p className="text-white/40 text-xs sm:text-sm font-light leading-relaxed italic">
                  "Every curve and angle in the {product.brand} collection is a testament to timeless elegance and structural integrity."
                </p>
              </div>
              <div className="glass p-6 sm:p-10 md:p-12 rounded-2xl sm:rounded-[2rem] flex items-center justify-center border-dashed border-[#c5a059]/20">
                <div className="text-center">
                  <span className="text-white/20 text-[10px] uppercase tracking-[0.4em] text-center block mb-2">Occasions</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {product.occasion?.map(o => (
                      <span key={o} className="text-[#c5a059] text-[9px] uppercase tracking-wider">{o}</span>
                    )) || <span className="text-white/40 text-[9px]">Universal</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Extended Tags Section */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
              {product.tags?.map(tag => (
                <span key={tag} className="px-2.5 sm:px-3 py-1 rounded-full border border-white/5 text-[8px] sm:text-[9px] text-white/40 uppercase tracking-widest hover:border-[#c5a059]/30 hover:text-[#c5a059] transition-all cursor-default">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Details - 5 cols */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8 md:space-y-10 reveal">
            <div>
              <span className="text-[#c5a059] text-[10px] tracking-[0.5em] uppercase font-bold block mb-3 sm:mb-4">{product.brand}</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-4 sm:mb-6 leading-tight">{product.name}</h1>

              <div className="flex flex-col gap-2 mb-6 sm:mb-8">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="text-2xl sm:text-3xl font-light tracking-[0.1em] text-white/90">${product.price_usd}</span>
                  <span className="h-px w-8 sm:w-12 bg-white/10"></span>
                  <span className="text-white/40 text-xs tracking-widest uppercase">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                </div>
                {product.power_price_usd > 0 && (
                  <span className="text-white/30 text-[10px] tracking-widest uppercase">
                    +${product.power_price_usd} for Prescription Lenses
                  </span>
                )}
              </div>
            </div>

            {/* Colors Section in Details */}
            <div className="flex gap-12 border-b border-white/5 pb-8">
              {/* Frame Colors */}
              {product.frame_colors?.length > 0 && (
                <div>
                  <span className="text-[#c5a059] text-[9px] uppercase tracking-widest block mb-3 font-bold">Frame Hues</span>
                  <div className="flex gap-3">
                    {product.frame_colors.map((c, i) => (
                      <div key={i} className="group relative">
                        <div className="w-6 h-6 rounded-full border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-help transition-transform group-hover:scale-110"
                          style={{ background: getColor(c) }} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-[#c5a059]/30 text-[#c5a059] text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity uppercase tracking-wider z-10">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Lens Colors */}
              {product.lens_colors?.length > 0 && (
                <div>
                  <span className="text-[#c5a059] text-[9px] uppercase tracking-widest block mb-3 font-bold">Lens Tints</span>
                  <div className="flex gap-3">
                    {product.lens_colors.map((c, i) => (
                      <div key={i} className="group relative">
                        <div className="w-6 h-6 rounded-full border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-help transition-transform group-hover:scale-110 overflow-hidden"
                          style={{ background: getColor(c) }}>
                          {c.includes('gradient') && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />}
                        </div>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-[#c5a059]/30 text-[#c5a059] text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity uppercase tracking-wider z-10">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-white/50 text-sm font-light leading-relaxed max-w-md">
              {product.description || `The ${product.name} by ${product.brand} exemplifies luxury and precision.`}
            </p>

            <div className="space-y-4">
              <button className="w-full bg-[#c5a059] text-black py-4 text-xs tracking-[0.2em] uppercase font-bold hover:bg-white transition-all premium-shadow">
                Acquire Piece
              </button>
            </div>

            {/* Extended Technical Specs */}
            <div className="pt-10 border-t border-white/5 space-y-8">
              <h3 className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold">Technical Specifications</h3>

              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-[11px] font-light">
                <div className="flex justify-between border-b border-white/5 py-2">
                  <span className="text-white/40 uppercase tracking-widest">Face Shape</span>
                  <span className="text-white/80">{product.face_shapes?.join(', ') || 'Universal'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-2">
                  <span className="text-white/40 uppercase tracking-widest">Frame Shape</span>
                  <span className="text-white/80">{product.frame_shapes?.join(', ') || 'Novelty'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-2">
                  <span className="text-white/40 uppercase tracking-widest">Frame Material</span>
                  <span className="text-white/80">{product.frame_materials?.join(', ')}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-2">
                  <span className="text-white/40 uppercase tracking-widest">Lens Material</span>
                  <span className="text-white/80">{product.lens_materials?.join(', ') || 'Crystal'}</span>
                </div>

                <div className="flex justify-between border-b border-white/5 py-2">
                  <span className="text-white/40 uppercase tracking-widest">Lens Size</span>
                  <span className="text-white/80">{product.lens_size_mm ? `${product.lens_size_mm.join(' / ')} mm` : 'Standard'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-2">
                  <span className="text-white/40 uppercase tracking-widest">Bridge</span>
                  <span className="text-white/80">{product.bridge_size_mm ? `${product.bridge_size_mm.join(' / ')} mm` : 'Standard'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-2">
                  <span className="text-white/40 uppercase tracking-widest">Arm Length</span>
                  <span className="text-white/80">{product.arm_size_mm ? `${product.arm_size_mm.join(' / ')} mm` : 'Standard'}</span>
                </div>
              </div>
            </div>

            <div className="p-6 glass bg-[#c5a059]/5 border-[#c5a059]/10 rounded-2xl flex items-center gap-5 mt-4">
              <div className="w-10 h-10 rounded-full border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] text-base">★</div>
              <div>
                <span className="text-white text-xs font-bold block mb-1">Authenticity Guaranteed</span>
                <span className="text-white/40 text-[9px] uppercase tracking-widest font-light">Hand-inspected optical mastery</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
