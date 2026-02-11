import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-[#050505]">

      {/* Hero Section */}
      <section className="relative h-[70vh] sm:h-[80vh] md:h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=2080&auto=format&fit=crop"
            className="w-full h-full object-cover scale-105 opacity-60"
            alt="Luxury Eyewear"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black"></div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 relative z-10 w-full reveal">
          <div className="max-w-2xl">
            <span className="text-[#c5a059] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-[10px] sm:text-xs font-semibold mb-4 sm:mb-6 block">Legacy Collection 2026</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-serif text-white mb-6 sm:mb-8 leading-tight">
              Define Your <br />
              <span className="italic text-gradient">Perspective.</span>
            </h1>
            <p className="text-white/60 text-sm sm:text-base md:text-lg mb-8 sm:mb-12 max-w-md font-light leading-relaxed">
              Meticulously crafted eyewear from the world's most prestigious designers. Engineered for clarity, designed for presence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <Link to="/products" className="bg-[#c5a059] text-black px-8 sm:px-10 py-3 sm:py-4 text-[10px] sm:text-xs tracking-widest uppercase font-bold hover:bg-[#d4b476] transition-all premium-shadow text-center">
                Explore Collection
              </Link>
              <Link to="/products?category=sunglasses" className="border border-white/20 text-white px-8 sm:px-10 py-3 sm:py-4 text-[10px] sm:text-xs tracking-widest uppercase font-bold hover:bg-white/10 transition-all text-center">
                The Summer Edit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Showcase */}
      <section className="py-12 sm:py-16 md:py-24 border-y border-white/5 bg-[#0a0a0a]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-serif text-white mb-4">Masterpiece Brands</h2>
            <div className="w-12 h-0.5 bg-[#c5a059] mx-auto"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8 md:gap-12 opacity-40 hover:opacity-100 transition-opacity duration-700 items-center grayscale hover:grayscale-0">
            {['Ray-Ban', 'Tom Ford', 'Gucci', 'Prada', 'Oakley', 'Versace'].map(brand => (
              <div key={brand} className="text-center text-base sm:text-lg md:text-xl font-serif text-white tracking-widest cursor-pointer hover:text-[#c5a059] transition-colors">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Grid */}
      <section className="py-16 sm:py-24 md:py-32">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-12">

            <div className="md:col-span-8 group relative overflow-hidden bg-zinc-900 aspect-[16/9]">
              <img
                src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?q=80&w=2070&auto=format&fit=crop"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80"
                alt="Editorial"
              />
              <div className="absolute inset-0 bg-black/40 p-6 sm:p-8 md:p-12 flex flex-col justify-end">
                <span className="text-[#c5a059] text-[10px] sm:text-xs tracking-widest uppercase mb-2">Editor's Pick</span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif text-white mb-4 sm:mb-6">The Aviator Renaissance</h3>
                <Link to="/products?frame_shape=aviator" className="text-white text-[10px] sm:text-xs tracking-widest uppercase border-b border-white/40 pb-1 w-fit hover:border-[#c5a059] transition-colors">Shop Now</Link>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-6 sm:gap-8 md:gap-12">
              <div className="flex-1 bg-zinc-900 p-6 sm:p-8 md:p-12 flex flex-col justify-center border border-white/5 hover:border-[#c5a059]/30 transition-colors">
                <h4 className="text-xl sm:text-2xl font-serif text-white mb-3 sm:mb-4">Blue Cut Precision</h4>
                <p className="text-white/40 text-xs sm:text-sm font-light mb-6 sm:mb-8">Ultimate screen protection for the modern digital workspace.</p>
                <Link to="/products?blue_cut=true" className="text-[#c5a059] text-[10px] sm:text-xs tracking-widest uppercase font-bold">Explore Optics</Link>
              </div>
              <div className="flex-1 bg-[#c5a059] p-6 sm:p-8 md:p-12 flex flex-col justify-center">
                <h4 className="text-xl sm:text-2xl font-serif text-black mb-3 sm:mb-4">Virtual Styling</h4>
                <p className="text-black/60 text-xs sm:text-sm font-bold mb-6 sm:mb-8 italic">Find your match with AI precision.</p>
                <button className="bg-black text-white px-6 sm:px-8 py-2 sm:py-3 text-[9px] sm:text-[10px] tracking-widest uppercase font-bold self-start">Start Fitting</button>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
