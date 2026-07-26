import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Grid, QrCode, Flame, ChevronRight, ChevronDown, FileBox, Menu, X, 
  ImageIcon, Sparkles, Code2, Binary, Layers, LayoutGrid, KeyRound, Type, Link, AlignLeft
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

function Header({ onHomeClick, onRequestTool, onSelectCategory, selectedCategory }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
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
      <div className="relative border border-gray-200/60 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full shadow-sm transition-all duration-300">
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
              Utilo<span className="text-gray-900">Box</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <button 
              onClick={() => { 
                onHomeClick(); 
                onSelectCategory('All'); 
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              className="hover:text-orange-500 transition-colors font-semibold"
            >
              All Tools
            </button>

            {/* Dropdown Kategori */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-semibold ${
                  selectedCategory !== 'All' || dropdownOpen
                    ? 'bg-orange-50 text-orange-500'
                    : 'hover:text-orange-500'
                }`}
              >
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-orange-500' : 'text-gray-400'}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl border border-gray-100 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
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
                      className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-orange-50/70 transition-colors ${
                        selectedCategory === cat.name ? 'bg-orange-50/90 text-orange-600 font-bold' : 'text-gray-700'
                      }`}
                    >
                      <div className="mt-0.5">{cat.icon}</div>
                      <div>
                        <div className="text-xs font-bold">{cat.name}</div>
                        <div className="text-[11px] text-gray-400 font-normal">{cat.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onRequestTool}
              className="hover:text-orange-500 transition-colors font-medium"
            >
              Request & Contact
            </button>
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
          <div className="md:hidden border-t border-gray-100 px-4 pt-3 pb-4 space-y-2 rounded-b-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => {
                onHomeClick();
                onSelectCategory('All');
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-orange-500 bg-orange-50/80 hover:bg-orange-100/80 transition-colors flex items-center justify-between"
            >
              <span>All Tools</span>
              <ChevronRight className="w-4 h-4 text-orange-400" />
            </button>

            {/* Mobile Categories Accordion/List */}
            <div className="bg-gray-50/70 rounded-xl p-2 space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
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
                      : 'text-gray-700 hover:bg-gray-100'
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
              className="w-full text-left px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50/60 transition-colors flex items-center justify-between"
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

function Hero({ searchQuery, setSearchQuery, toolCount }) {
  return (
    <section className="text-center py-12 md:py-16 px-4 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
        All the tools you need, <br /> in <span className="text-orange-500">one place</span>
      </h1>
      <p className="text-gray-500 text-base md:text-lg mb-8 max-w-2xl mx-auto">
        The complete web tools collection — QR Code, JSON Formatter, Base64, Image Converter, & AI Background Remover. Free, fast, 100% local in browser.
      </p>
      
      <div className="relative max-w-2xl mx-auto mb-8 group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-gray-400">
          <Search className="h-5 w-5" />
        </div>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tools, e.g. 'JSON', 'QR Code', 'Base64'..." 
          className="w-full pl-14 pr-12 py-4 rounded-full border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 shadow-sm text-gray-700 transition-all text-base"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-2 right-3 p-2 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm font-medium">
        <span className="flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
          <Grid className="w-4 h-4 text-orange-400" /> {toolCount} Tools Available
        </span>
        <span className="flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
          <Flame className="w-4 h-4 text-orange-400" /> 100% Free
        </span>
        <span className="flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
          <FileBox className="w-4 h-4 text-orange-400" /> No Server Upload
        </span>
      </div>
    </section>
  );
}

function ToolCard({ title, desc, icon, badge, badgeColor = "red", category, onClick }) {
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
      <div className="relative z-10 p-6 bg-white rounded-[22px] flex flex-col h-full w-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 group-hover:scale-110 transition-all duration-300">
              {icon}
            </div>
            {badge && (
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                badgeColor === 'red' ? 'bg-red-50 text-red-500 border border-red-100' : 
                badgeColor === 'green' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                'bg-orange-50 text-orange-500 border border-orange-100'
              }`}>
                {badge}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
            {category}
          </span>
          <h3 className="font-bold text-gray-900 group-hover:text-orange-500 mb-2 text-lg transition-colors">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        </div>

        <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-orange-500 group-hover:translate-x-1 transition-transform">
          <span>Open Tool</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-orange-100 selection:text-orange-900 pb-20">
      <Header 
        onHomeClick={() => setActiveTool(null)} 
        onRequestTool={() => setActiveTool('request-tool')} 
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        selectedCategory={selectedCategory}
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
            />

            {/* Tools Section */}
            <section className="mb-20 px-6 max-w-7xl mx-auto">
              
              {/* Category Filter Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="text-orange-500">
                    <Flame className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Tool Catalog</h2>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-105'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
                      title={tool.title} 
                      desc={tool.desc}
                      icon={tool.icon}
                      category={tool.category}
                      badge={tool.badge}
                      badgeColor={tool.badgeColor}
                      onClick={() => setActiveTool(tool.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
                  <p className="text-gray-500 text-base font-medium">No tools found matching "{searchQuery}"</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="mt-4 px-5 py-2.5 rounded-full bg-orange-50 text-orange-600 font-bold text-xs hover:bg-orange-100 transition-all"
                  >
                    Show All Tools
                  </button>
                </div>
              )}
              <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

