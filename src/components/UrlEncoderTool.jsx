import React, { useState } from 'react';
import {
  ArrowLeft, Link, Copy, Check, Trash2, RefreshCw, FileText, Sparkles
} from 'lucide-react';

export default function UrlEncoderTool({ onBack }) {
  const [activeTab, setActiveTab] = useState('encode');
  const [input, setInput] = useState('https://example.com/search?q=hello world&lang=en');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const output = React.useMemo(() => {
    setError(null);
    if (!input.trim()) return '';
    try {
      if (activeTab === 'encode') {
        return encodeURIComponent(input);
      } else {
        return decodeURIComponent(input);
      }
    } catch {
      setError(activeTab === 'encode' ? 'Encoding failed.' : 'Invalid URL-encoded string.');
      return '';
    }
  }, [input, activeTab]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    if (!output) return;
    setInput(output);
    setActiveTab(activeTab === 'encode' ? 'decode' : 'encode');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-4">

        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors group mb-6">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Tools
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
            <Link className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900">URL Encoder / Decoder</h1>
              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Developer Tool</span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">Encode or decode URLs and query strings instantly — 100% browser-based.</p>
          </div>
        </div>

        {/* Tab + Swap */}
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab('encode')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'encode' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Encode (Text → URL)
            </button>
            <button
              onClick={() => setActiveTab('decode')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'decode' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Decode (URL → Text)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSwap}
              disabled={!output}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all disabled:opacity-40"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Swap
            </button>
            <button
              onClick={() => setInput('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Input */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                {activeTab === 'encode' ? 'Plain Text Input' : 'URL-Encoded Input'}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">{input.length} chars</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTab === 'encode' ? 'Paste plain text or URL here...' : 'Paste URL-encoded string here...'}
              className="w-full h-64 p-4 font-mono text-xs text-gray-800 focus:outline-none resize-none bg-white leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Output */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                {activeTab === 'encode' ? 'URL-Encoded Output' : 'Decoded Text Output'}
              </span>
              <button
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors text-xs font-semibold disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="w-full h-64 p-4 font-mono text-xs bg-gray-900 text-emerald-400 overflow-auto leading-relaxed break-all">
              {error ? (
                <span className="text-red-400">⚠️ {error}</span>
              ) : output ? (
                output
              ) : (
                <span className="text-gray-600">Result will appear here...</span>
              )}
            </div>
          </div>

        </div>

        {/* Quick Reference */}
        <div className="mt-6 p-5 rounded-2xl bg-orange-50/60 border border-orange-100">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">Common URL Encodings</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { char: 'Space', code: '%20' },
              { char: '&', code: '%26' },
              { char: '=', code: '%3D' },
              { char: '#', code: '%23' },
              { char: '+', code: '%2B' },
              { char: '/', code: '%2F' },
              { char: '?', code: '%3F' },
              { char: '@', code: '%40' },
            ].map((item) => (
              <div key={item.char} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-orange-100">
                <span className="text-xs font-bold text-gray-700">{item.char}</span>
                <span className="text-xs font-mono text-orange-500">{item.code}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
