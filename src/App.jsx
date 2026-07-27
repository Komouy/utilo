import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Grid, QrCode, Flame, ChevronRight, ChevronDown, FileBox, Menu, X, 
  ImageIcon, Sparkles, Code2, Binary, Layers, LayoutGrid, KeyRound, Type, Link, AlignLeft,
  Sun, Moon, Star, Command, CornerDownLeft
} from 'lucide-react';
import QRCodeGeneratorTool from './components/QRCodeGeneratorTool';
import ImageConverterTool from './components/ImageConverterTool';
import BackgroundRemoverTool from './components/BackgroundRemoverTool';
import JsonFormatterTool from './components/JsonFormatterTool';
import Base64Tool from './components/Base64Tool';
import PasswordGeneratorTool from './components/PasswordGeneratorTool';
import WordCounterTool from './components/WordCounterTool';
import UrlEncoderTool from './components/UrlEncoderTool';
import LoremIpsumTool from './components/LoremIpsumTool';
import RequestToolPage from './components/RequestToolPage';
import alatinLogo from './assets/alatin.png';

const ALL_TOOLS = [
  {
    id: 'json-formatter',
    title: 'JSON Formatter & Validator',
    desc: 'Format, beautify, validate, and minify JSON data instantly — 100% browser-based',
    icon: <Code2 className="w-7 h-7" />,
    category: 'Developer Tools',
    badge: 'New',
    badgeColor: 'green'
  },
  {
    id: 'base64',
    title: 'Base64 Encoder / Decoder',
    desc: 'Encode and decode text or files to Base64 & URL-Safe format instantly',
    icon: <Binary className="w-7 h-7" />,
    category: 'Developer Tools',
    badge: 'New',
    badgeColor: 'green'
  },
  {
    id: 'bg-remover',
    title: 'Background Remover AI',
    desc: 'Remove image backgrounds automatically using AI — 100% fast in browser',
    icon: <Sparkles className="w-7 h-7" />,
    category: 'Media & Images',
    badge: 'Popular',
    badgeColor: 'orange'
  },
  {
    id: 'image-converter',
    title: 'Image Converter',
    desc: 'Convert images to JPG, PNG, or WebP directly in browser — no server upload',
    icon: <ImageIcon className="w-7 h-7" />,
    category: 'Media & Images',
    badge: 'Popular',
    badgeColor: 'orange'
  },
  {
    id: 'qr-code',
    title: 'QR Code Generator',
    desc: 'Create custom QR codes for URL, Wi-Fi, Phone, Email, and WhatsApp instantly',
    icon: <QrCode className="w-7 h-7" />,
    category: 'Utilities & Generators',
  },
  {
    id: 'password-generator',
    title: 'Password Generator',
    desc: 'Generate strong, cryptographically secure passwords with custom length and character types',
    icon: <KeyRound className="w-7 h-7" />,
    category: 'Utilities & Generators',
    badge: 'New',
    badgeColor: 'green'
  },
  {
    id: 'word-counter',
    title: 'Word Counter',
    desc: 'Count words, characters, sentences, paragraphs and estimate reading time instantly',
    icon: <Type className="w-7 h-7" />,
    category: 'Utilities & Generators',
    badge: 'New',
    badgeColor: 'green'
  },
  {
    id: 'lorem-ipsum',
    title: 'Lorem Ipsum Generator',
    desc: 'Generate customizable placeholder text for designs, mockups and prototypes',
    icon: <AlignLeft className="w-7 h-7" />,
    category: 'Utilities & Generators',
    badge: 'New',
    badgeColor: 'green'
  },
  {
    id: 'url-encoder',
    title: 'URL Encoder / Decoder',
    desc: 'Encode and decode URLs and query strings instantly — 100% browser-based',
    icon: <Link className="w-7 h-7" />,
    category: 'Developer Tools',
    badge: 'New',
    badgeColor: 'green'
  }
];

const CATEGORIES_LIST = [
  { name: 'All', icon: <LayoutGrid className="w-4 h-4 text-orange-500" />, desc: 'All web tools' },
  { name: 'Developer Tools', icon: <Code2 className="w-4 h-4 text-orange-500" />, desc: 'JSON, Base64, URL Encoder' },
  { name: 'Media & Images', icon: <ImageIcon className="w-4 h-4 text-orange-500" />, desc: 'AI Remove BG, Converter' },
  { name: 'Utilities & Generators', icon: <QrCode className="w-4 h-4 text-orange-500" />, desc: 'QR Code, Password, Lorem Ipsum' },
];

const CATEGORIES = CATEGORIES_LIST.map((c) => c.name);

function Header({ onHomeClick, onRequestTool, onSelectCategory, selectedCategory, theme, onToggleTheme, onOpenCommandPalette }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-3 sm:top-4 z-50 max-w-5xl mx-auto px-3 sm:px-4 mb-4 sm:mb-6">
      <div className="relative border border-gray-200/60 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl sm:rounded-full shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between py-2.5 px-4 sm:px-6 md:px-8">
          <button 
            onClick={() => {
              onHomeClick();
              onSelectCategory('All');
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group"
          >
            <img src={alatinLogo} alt="UtiloBox Logo" className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105" />
            <span className="text-xl sm:text-2xl font-extrabold text-orange-500 tracking-tight">
              Utilo<span className="text-gray-900 dark:text-slate-100">Box</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600 dark:text-slate-300">
            <button 
              onClick={() => { 
                onHomeClick(); 
                onSelectCategory('All'); 
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors font-semibold"
            >
              All Tools
            </button>

            {/* Dropdown Kategori */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-semibold ${
                  selectedCategory !== 'All' || dropdownOpen
                    ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400'
                    : 'hover:text-orange-500 dark:hover:text-orange-400'
                }`}
              >
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-orange-500' : 'text-gray-400'}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-gray-50 dark:border-slate-800 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    Select Category
                  </div>
                  {CATEGORIES_LIST.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        onHomeClick();
                        onSelectCategory(cat.name);
                        setDropdownOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-orange-50/70 dark:hover:bg-slate-800/60 transition-colors ${
                        selectedCategory === cat.name ? 'bg-orange-50/90 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold' : 'text-gray-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="mt-0.5">{cat.icon}</div>
                      <div>
                        <div className="text-xs font-bold">{cat.name}</div>
                        <div className="text-[11px] text-gray-400 dark:text-slate-400 font-normal">{cat.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onRequestTool}
              className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors font-medium"
            >
              Request & Contact
            </button>

            {/* Quick Search Ctrl+K Button */}
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 text-xs font-semibold transition-all border border-gray-200/50 dark:border-slate-700/50"
              title="Search tools (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-gray-400 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full text-gray-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </nav>

          {/* Mobile Actions & Menu Toggle */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onOpenCommandPalette}
              className="p-2 text-gray-600 dark:text-slate-300 hover:text-orange-500 rounded-full"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleTheme}
              className="p-2 text-gray-600 dark:text-slate-300 rounded-full"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-slate-300 hover:text-orange-500 rounded-full transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 dark:text-slate-100" /> : <Menu className="w-5 h-5 dark:text-slate-100" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-slate-800 px-4 pt-3 pb-4 space-y-2 rounded-b-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => {
                onHomeClick();
                onSelectCategory('All');
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-orange-500 bg-orange-50/80 dark:bg-orange-500/10 transition-colors flex items-center justify-between"
            >
              <span>All Tools</span>
              <ChevronRight className="w-4 h-4 text-orange-400" />
            </button>

            <div className="bg-gray-50/70 dark:bg-slate-800/40 rounded-xl p-2 space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Categories
              </div>
              {CATEGORIES_LIST.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    onHomeClick();
                    onSelectCategory(cat.name);
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className={selectedCategory === cat.name ? 'text-white' : ''}>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                onRequestTool();
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl font-medium text-gray-600 dark:text-slate-300 hover:text-orange-500 transition-colors flex items-center justify-between"
            >
              <span>Request & Contact</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function HeroBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2.5 + 1.5,
      alpha: Math.random() * 0.6 + 0.3,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');

      // Grid mesh lines
      ctx.strokeStyle = isDark ? 'rgba(255, 115, 0, 0.12)' : 'rgba(255, 115, 0, 0.15)';
      ctx.lineWidth = 1;

      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Floating nodes & connecting lines
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(251, 146, 60, ${p.alpha})`
          : `rgba(249, 115, 22, ${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = isDark
              ? `rgba(251, 146, 60, ${(1 - dist / 130) * 0.35})`
              : `rgba(249, 115, 22, ${(1 - dist / 130) * 0.3})`;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none -z-10 rounded-3xl"
    />
  );
}

function Hero({ searchQuery, setSearchQuery, toolCount, onOpenCommandPalette }) {
  return (
    <section className="relative text-center py-12 md:py-20 px-4 max-w-4xl mx-auto overflow-hidden rounded-3xl my-2">
      {/* Animated Canvas Particle Grid in the background */}
      <HeroBackground />

      {/* Bold Moving Glow Orbs in Background */}
      <div className="absolute -top-10 left-10 w-72 h-72 bg-gradient-to-tr from-orange-500/35 via-amber-400/25 to-transparent rounded-full blur-2xl animate-float-slow pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-bl from-amber-500/30 via-orange-500/25 to-transparent rounded-full blur-2xl animate-float-reverse pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-orange-500/15 dark:bg-orange-500/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Headline */}
      <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight leading-tight mb-6 pt-4">
        All the tools you need, <br /> in <span className="text-orange-500 dark:text-orange-400">one place</span>
      </h1>
      
      <p className="text-gray-500 dark:text-slate-400 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
        The complete web tools collection — QR Code, JSON Formatter, Base64, Image Converter, & AI Background Remover. Fast, private, and 100% local in browser.
      </p>
      
      {/* Search Input Bar */}
      <div className="relative max-w-2xl mx-auto mb-8 group">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
            <Search className="h-5 w-5" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools, e.g. 'JSON', 'QR Code', 'Base64'..." 
            className="w-full pl-14 pr-24 py-4 rounded-full border border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-md text-gray-700 dark:text-slate-100 transition-all text-base placeholder-gray-400 dark:placeholder-slate-500"
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onOpenCommandPalette}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-[11px] font-mono text-gray-400 dark:text-slate-400 border border-gray-200 dark:border-slate-700/60 hover:text-orange-500 dark:hover:text-orange-400 transition-all shadow-sm"
              >
                <span>Ctrl + K</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Stats Chips */}
      <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm font-medium">
        <span className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 px-4 py-2 rounded-full border border-gray-200/80 dark:border-slate-800 shadow-sm cursor-default">
          <Grid className="w-4 h-4 text-orange-500" /> {toolCount} Tools Available
        </span>
        <span className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 px-4 py-2 rounded-full border border-gray-200/80 dark:border-slate-800 shadow-sm cursor-default">
          <Flame className="w-4 h-4 text-orange-500" /> 100% Free
        </span>
        <span className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 px-4 py-2 rounded-full border border-gray-200/80 dark:border-slate-800 shadow-sm cursor-default">
          <FileBox className="w-4 h-4 text-orange-500" /> No Server Upload
        </span>
      </div>
    </section>
  );
}

function ToolCard({ id, title, desc, icon, badge, badgeColor = "red", category, isFavorite, onToggleFavorite, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="group relative p-[2px] rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1 cursor-pointer overflow-hidden bg-gray-200 dark:bg-slate-800"
    >
      {/* Animated rotating orange gradient border beam */}
      <div className="absolute -inset-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
        <div className="w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent_0_220deg,#ff7300_280deg,#fdba74_360deg)] animate-spin-border" />
      </div>

      {/* Inner card content container */}
      <div className="relative z-10 p-6 bg-white dark:bg-slate-900 rounded-[22px] flex flex-col h-full w-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-all duration-300">
              {icon}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Favorite Star Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(id);
                }}
                className={`p-1.5 rounded-full transition-all duration-200 hover:scale-110 ${
                  isFavorite 
                    ? 'text-amber-400 bg-amber-50 dark:bg-amber-500/10' 
                    : 'text-gray-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>

              {badge && (
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  badgeColor === 'red' ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20' : 
                  badgeColor === 'green' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 
                  'bg-orange-50 dark:bg-orange-500/10 text-orange-500 border border-orange-100 dark:border-orange-500/20'
                }`}>
                  {badge}
                </span>
              )}
            </div>
          </div>
          
          <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">
            {category}
          </span>
          <h3 className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-orange-500 dark:group-hover:text-orange-400 mb-2 text-lg transition-colors">{title}</h3>
          <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>

        <div className="mt-5 pt-3 border-t border-gray-50 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-orange-500 dark:text-orange-400 group-hover:translate-x-1 transition-transform">
          <span>Open Tool</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function CommandPaletteModal({ isOpen, onClose, tools, favorites, onToggleFavorite, onSelectTool }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return tools;
    const q = query.toLowerCase();
    return tools.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [tools, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      onSelectTool(filtered[selectedIndex].id);
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Input Bar */}
        <div className="relative border-b border-gray-100 dark:border-slate-800 px-5 py-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-orange-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search tool..."
            className="w-full bg-transparent text-gray-900 dark:text-slate-100 focus:outline-none text-base placeholder-gray-400 dark:placeholder-slate-500 font-medium"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
          {filtered.length > 0 ? (
            filtered.map((tool, idx) => {
              const isFav = favorites.includes(tool.id);
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tool.id}
                  onClick={() => {
                    onSelectTool(tool.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-50 dark:bg-orange-500/10 text-orange-500'}`}>
                      {tool.icon}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-sm truncate flex items-center gap-2">
                        <span>{tool.title}</span>
                        {tool.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400'}`}>
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs truncate font-normal ${isSelected ? 'text-orange-100' : 'text-gray-400 dark:text-slate-400'}`}>
                        {tool.desc}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(tool.id);
                      }}
                      className={`p-1.5 rounded-lg transition-transform hover:scale-110 ${
                        isFav 
                          ? 'text-amber-400' 
                          : isSelected ? 'text-white/60 hover:text-white' : 'text-gray-300 dark:text-slate-600 hover:text-amber-400'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-medium bg-white/20 px-2 py-0.5 rounded-md">
                        <span>Open</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-400 dark:text-slate-500 text-sm">
              No matching tools found for "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-gray-100 dark:border-slate-800 px-5 py-2.5 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="flex items-center gap-1 text-orange-500">
            <Command className="w-3.5 h-3.5" />
            <span className="font-bold">UtiloBox Command</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Persistent Theme state ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('utilobox-theme') || 'light';
  });

  // Persistent Favorites state (array of tool IDs)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('utilobox-favorites');
      return saved ? JSON.parse(saved) : ['bg-remover', 'json-formatter'];
    } catch {
      return ['bg-remover', 'json-formatter'];
    }
  });

  useEffect(() => {
    localStorage.setItem('utilobox-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('utilobox-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Global Ctrl + K key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFavorite = (toolId) => {
    setFavorites((prev) => 
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const favoriteTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => favorites.includes(tool.id));
  }, [favorites]);

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      const matchCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0f17] font-sans selection:bg-orange-100 dark:selection:bg-orange-950 selection:text-orange-900 dark:selection:text-orange-300 pb-20 transition-colors duration-200">
      <Header 
        onHomeClick={() => setActiveTool(null)} 
        onRequestTool={() => setActiveTool('request-tool')} 
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        selectedCategory={selectedCategory}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />
      
      <main>
        {activeTool === 'qr-code' ? (
          <QRCodeGeneratorTool onBack={() => setActiveTool(null)} />
        ) : activeTool === 'image-converter' ? (
          <ImageConverterTool onBack={() => setActiveTool(null)} />
        ) : activeTool === 'request-tool' ? (
          <RequestToolPage onBack={() => setActiveTool(null)} />
        ) : activeTool === 'bg-remover' ? (
          <BackgroundRemoverTool onBack={() => setActiveTool(null)} />
        ) : activeTool === 'json-formatter' ? (
          <JsonFormatterTool onBack={() => setActiveTool(null)} />
        ) : activeTool === 'base64' ? (
          <Base64Tool onBack={() => setActiveTool(null)} />
        ) : activeTool === 'password-generator' ? (
          <PasswordGeneratorTool onBack={() => setActiveTool(null)} />
        ) : activeTool === 'word-counter' ? (
          <WordCounterTool onBack={() => setActiveTool(null)} />
        ) : activeTool === 'url-encoder' ? (
          <UrlEncoderTool onBack={() => setActiveTool(null)} />
        ) : activeTool === 'lorem-ipsum' ? (
          <LoremIpsumTool onBack={() => setActiveTool(null)} />
        ) : (
          <>
            <Hero 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              toolCount={ALL_TOOLS.length} 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            />

            {/* Favorites Section */}
            {favoriteTools.length > 0 && !searchQuery && selectedCategory === 'All' && (
              <section className="mb-12 px-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-lg">
                    <Star className="w-5 h-5 fill-amber-400" />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-100">Favorites & Quick Access</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    {favoriteTools.length} Pinned
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {favoriteTools.map((tool) => (
                    <ToolCard 
                      key={`fav-${tool.id}`}
                      id={tool.id}
                      title={tool.title} 
                      desc={tool.desc}
                      icon={tool.icon}
                      category={tool.category}
                      badge={tool.badge}
                      badgeColor={tool.badgeColor}
                      isFavorite={true}
                      onToggleFavorite={toggleFavorite}
                      onClick={() => setActiveTool(tool.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Main Tools Catalog Section */}
            <section className="mb-20 px-6 max-w-7xl mx-auto">
              
              {/* Category Filter Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="text-orange-500">
                    <Flame className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">Tool Catalog</h2>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-105'
                          : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredTools.map((tool) => (
                    <ToolCard 
                      key={tool.id}
                      id={tool.id}
                      title={tool.title} 
                      desc={tool.desc}
                      icon={tool.icon}
                      category={tool.category}
                      badge={tool.badge}
                      badgeColor={tool.badgeColor}
                      isFavorite={favorites.includes(tool.id)}
                      onToggleFavorite={toggleFavorite}
                      onClick={() => setActiveTool(tool.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8">
                  <p className="text-gray-500 dark:text-slate-400 text-base font-medium">No tools found matching "{searchQuery}"</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="mt-4 px-5 py-2.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all"
                  >
                    Show All Tools
                  </button>
                </div>
              )}
              <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-800 to-transparent"></div>
            </section>
          </>
        )}
      </main>

      <Footer onSelectTool={(id) => setActiveTool(id)} onRequestTool={() => setActiveTool('request-tool')} />

      {/* Global Command Palette Modal */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        tools={ALL_TOOLS}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onSelectTool={(id) => setActiveTool(id)}
      />
    </div>
  );
}

function Footer({ onSelectTool, onRequestTool }) {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-900 pt-12 pb-8 mt-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <img src={alatinLogo} alt="UtiloBox Logo" className="h-7 w-auto object-contain" />
              <span className="text-xl font-extrabold text-orange-500 tracking-tight">
                Utilo<span className="text-gray-900 dark:text-slate-100">Box</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
              All the tools you need, in one place. 100% free, fast, and private browser-based utilities.
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              © {new Date().getFullYear()} UtiloBox. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3">Developer Tools</h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-slate-400">
              <li><button onClick={() => onSelectTool('json-formatter')} className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">JSON Formatter</button></li>
              <li><button onClick={() => onSelectTool('base64')} className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Base64 Encoder/Decoder</button></li>
              <li><button onClick={() => onSelectTool('url-encoder')} className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">URL Encoder/Decoder</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3">Media & Utilities</h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-slate-400">
              <li><button onClick={() => onSelectTool('bg-remover')} className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Background Remover AI</button></li>
              <li><button onClick={() => onSelectTool('image-converter')} className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Image Converter</button></li>
              <li><button onClick={() => onSelectTool('qr-code')} className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">QR Code Generator</button></li>
              <li><button onClick={() => onSelectTool('password-generator')} className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Password Generator</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3">Support & Feedback</h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-3">
              Found a bug or need a new tool? Contact us directly.
            </p>
            <button
              onClick={onRequestTool}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all"
            >
              Request Tool & Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
