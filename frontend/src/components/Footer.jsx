import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#172337] text-white pt-16 pb-10 border-t-8 border-[#2874f0]">
      <div className="max-w-[1248px] mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-4 font-medium">

        {/* About Section */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-gray-400 text-[12px] font-black uppercase tracking-[0.2em] mb-6 italic">ABOUT</h4>
          <ul className="space-y-2 text-[12px] font-bold">
            {['Contact Us', 'About Us', 'ShadeHub Stories', 'Press', 'Elite Membership', 'Wholesale Inquiry'].map(item => (
              <li key={item}><Link to="/" className="hover:underline hover:text-[#2874f0] transition-colors">{item}</Link></li>
            ))}
          </ul>
        </div>

        {/* Help Section */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-gray-400 text-[12px] font-black uppercase tracking-[0.2em] mb-6 italic">HELP</h4>
          <ul className="space-y-2 text-[12px] font-bold">
            {['Payments', 'Shipping', 'Cancellation', 'FAQ', 'Optical Guide', 'Eye Exams'].map(item => (
              <li key={item}><Link to="/" className="hover:underline hover:text-[#2874f0] transition-colors">{item}</Link></li>
            ))}
          </ul>
        </div>

        {/* Policy Section */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-gray-400 text-[12px] font-black uppercase tracking-[0.2em] mb-6 italic">POLICY</h4>
          <ul className="space-y-2 text-[12px] font-bold">
            {['Return Policy', 'Terms of Use', 'Security', 'Privacy', 'Sitemap', 'CSR Policy'].map(item => (
              <li key={item}><Link to="/" className="hover:underline hover:text-[#2874f0] transition-colors">{item}</Link></li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:block lg:col-span-1 h-20 border-l border-gray-700 mx-10 mt-10"></div>

        {/* Mail Us Section */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-gray-400 text-[12px] font-black uppercase tracking-[0.2em] mb-6 italic border-b border-gray-700 pb-2">ARCHIVE HEADQUARTERS</h4>
          <div className="text-[12px] leading-relaxed font-medium italic text-gray-400 uppercase tracking-tighter decoration-gray-700 underline underline-offset-4">
            ShadeHub Digital Solutions Private Limited,<br />
            Level 10, The Vision Tower, Sector 44,<br />
            Gurugram, HR - 122003, India<br />
            <span className="text-white block mt-4 font-black">Digital Verification Required for Access</span>
          </div>
          <div className="pt-4 flex items-center gap-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Global Partner</span>
              <span className="text-[14px] font-black italic tracking-tighter text-white">Elite Vision Network</span>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-[1248px] mx-auto px-4 mt-20 pt-8 border-t border-gray-800 flex flex-col lg:flex-row justify-between items-center gap-8 text-[11px] font-black text-gray-500 tracking-[0.2em]">
        <div className="flex flex-wrap justify-center lg:justify-start gap-8 uppercase italic underline decoration-gray-800 underline-offset-8">
          <span className="flex items-center gap-2 group cursor-pointer hover:text-white transition-colors">🛒 <span className="group-hover:text-[#2874f0]">Marketplace Seller</span></span>
          <span className="flex items-center gap-2 group cursor-pointer hover:text-white transition-colors">⭐️ <span className="group-hover:text-[#2874f0]">AD Network</span></span>
          <span className="flex items-center gap-2 group cursor-pointer hover:text-white transition-colors">🎁 <span className="group-hover:text-[#2874f0]">Vision Token</span></span>
          <span className="flex items-center gap-2 group cursor-pointer hover:text-white transition-colors">❓ <span className="group-hover:text-[#2874f0]">Atelier Help</span></span>
        </div>

        <div className="uppercase italic tracking-[0.4em] text-white/40">
          © 2026 ShadeHub Digital Archive
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {['VERIFIED', 'ENCRYPTED', 'AUTHENTIC', 'GLOBAL'].map(p => (
            <span key={p} className="bg-gray-800/50 px-3 py-1 rounded-[2px] text-[9px] font-black text-gray-500 border border-gray-700/50 italic tracking-widest">{p}</span>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;