import React, { useState } from 'react';
import { 
  Search, Grid, QrCode, Flame, ChevronRight, FileBox, Menu, X
} from 'lucide-react';
import QRCodeGeneratorTool from './components/QRCodeGeneratorTool';
import alatinLogo from './assets/alatin.png';

function Header({ onHomeClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-3 sm:top-4 z-50 max-w-5xl mx-auto px-3 sm:px-4 mb-4 sm:mb-6">
      <div className="relative border border-gray-200/60 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between py-2.5 px-4 sm:px-6 md:px-8">
          <button 
            onClick={() => {
              onHomeClick();
              setMobileMenuOpen(false);
            }} 
            className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group"
          >
            <img src={alatinLogo} alt="Utilo Logo" className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105" />
            <span className="text-xl sm:text-2xl font-extrabold text-orange-500 tracking-tight">
              Uti<span className="text-gray-900">lo</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <button 
              onClick={onHomeClick} 
              className="text-orange-500 bg-orange-50/80 px-4 py-1.5 rounded-full transition-colors hover:bg-orange-100/80 font-semibold"
            >
              Tools
            </button>
            <a href="#" className="hover:text-gray-900 transition-colors">Categories</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Favorites</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Blog</a>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50/60 rounded-full transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-gray-800" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 pt-3 pb-4 space-y-1.5 rounded-b-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => {
                onHomeClick();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-orange-500 bg-orange-50/80 hover:bg-orange-100/80 transition-colors flex items-center justify-between"
            >
              <span>Tools</span>
              <ChevronRight className="w-4 h-4 text-orange-400" />
            </button>
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Categories
            </a>
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Favorites
            </a>
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Blog
            </a>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero({ onOpenQrTool }) {
  return (
    <section className="text-center py-16 px-4 max-w-4xl mx-auto">
      <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
        All the tools you need, <br /> in <span className="text-orange-500">one place</span>
      </h1>
      <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
        The complete web tools collection — PDF, QR Code, image converter, and more. Free, fast, no install required.
      </p>
      
      <div className="relative max-w-2xl mx-auto mb-8 group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-gray-400">
          <Search className="h-5 w-5" />
        </div>
        <input 
          type="text" 
          placeholder="Search tools, e.g. 'QR Code'..." 
          className="w-full pl-14 pr-32 py-4 rounded-full border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 shadow-sm text-gray-700 transition-all text-base"
        />
        <div className="absolute inset-y-2 right-2">
          <button 
            onClick={onOpenQrTool}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg h-full"
          >
            Search
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
        <span className="flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
          <Grid className="w-4 h-4 text-orange-400" /> 1 Tool available
        </span>
        <span className="flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
          <Flame className="w-4 h-4 text-orange-400" /> 100% free
        </span>
        <span className="flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
          <FileBox className="w-4 h-4 text-orange-400" /> No installation
        </span>
      </div>
    </section>
  );
}

function ToolCard({ title, desc, icon, badge, badgeColor = "red", onClick }) {
  return (
    <div 
      onClick={onClick}
      className="group relative p-[2px] rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1 cursor-pointer overflow-hidden bg-gray-200"
    >
      {/* Animated rotating orange gradient border beam */}
      <div className="absolute -inset-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
        <div className="w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent_0_220deg,#ff7300_280deg,#fdba74_360deg)] animate-spin-border" />
      </div>

      {/* Inner card content container */}
      <div className="relative z-10 p-6 bg-white rounded-[22px] flex flex-col h-full w-full">
        <div className="flex justify-between items-start mb-5">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 group-hover:scale-110 transition-all duration-300">
            {icon}
          </div>
          {badge && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              badgeColor === 'red' ? 'bg-red-50 text-red-500 border border-red-100' : 
              badgeColor === 'green' ? 'bg-green-50 text-green-600 border border-green-100' : 
              'bg-orange-50 text-orange-500 border border-orange-100'
            }`}>
              {badge}
            </span>
          )}
        </div>
        <h3 className="font-bold text-orange-500 mb-2 text-lg">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTool, setActiveTool] = useState(null);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-orange-100 selection:text-orange-900 pb-20">
      <Header onHomeClick={() => setActiveTool(null)} />
      
      <main>
        {activeTool === 'qr-code' ? (
          <QRCodeGeneratorTool onBack={() => setActiveTool(null)} />
        ) : (
          <>
            <Hero onOpenQrTool={() => setActiveTool('qr-code')} />

            {/* Tools Section (Only 1 tool: QR Code Generator) */}
            <section className="mb-20 px-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="text-orange-500">
                    <Flame className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Available Tools</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <ToolCard 
                  title="QR Code Generator" 
                  desc="Create QR codes from URL, Wi-Fi, Phone, Email, or WhatsApp instantly"
                  icon={<QrCode className="w-7 h-7" />}
                  onClick={() => setActiveTool('qr-code')}
                />
              </div>
              <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
