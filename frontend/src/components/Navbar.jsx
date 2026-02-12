import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[1000] glass-dark border-b border-white/5 text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex flex-col group -space-y-1">
          <span className="text-xl sm:text-2xl font-serif tracking-widest text-gradient uppercase">ShadeHub</span>
          <span className="text-[8px] sm:text-[9px] tracking-[0.3em] uppercase opacity-50 font-light ml-0.5 group-hover:opacity-100 transition-opacity hidden sm:block">Premium Optical</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-12 text-[11px] lg:text-[13px] tracking-widest uppercase font-light">
          <Link to="/products" className="hover:text-[#c5a059] transition-colors relative group">
            Collections <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#c5a059] group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link to="/products?category=mens" className="hover:text-[#c5a059] transition-colors hidden lg:block">Men</Link>
          <Link to="/products?category=womens" className="hover:text-[#c5a059] transition-colors hidden lg:block">Women</Link>
          <Link to="/virtual-tryon" className="hover:text-[#c5a059] transition-colors relative group">
            Try On <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#c5a059] group-hover:w-full transition-all duration-300"></span>
          </Link>

          <div className="flex items-center gap-4 lg:gap-8 border-l border-white/10 pl-4 lg:pl-10">
            <button className="hover:text-[#c5a059] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </button>
            <Link to="/cart" className="relative group hover:text-[#c5a059] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
              <span className="absolute -top-2 -right-2 bg-[#c5a059] text-black text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-lg">0</span>
            </Link>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:text-[#c5a059] transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-dark border-t border-white/5">
          <nav className="flex flex-col px-4 py-4 space-y-4 text-sm tracking-widest uppercase">
            <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#c5a059] transition-colors py-2">Collections</Link>
            <Link to="/products?category=mens" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#c5a059] transition-colors py-2">Men</Link>
            <Link to="/products?category=womens" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#c5a059] transition-colors py-2">Women</Link>
            <Link to="/virtual-tryon" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#c5a059] transition-colors py-2">Virtual Try-On</Link>
            <div className="flex items-center gap-6 border-t border-white/10 pt-4">
              <button className="hover:text-[#c5a059] transition-colors flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <span>Account</span>
              </button>
              <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="relative hover:text-[#c5a059] transition-colors flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                <span>Cart (0)</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
