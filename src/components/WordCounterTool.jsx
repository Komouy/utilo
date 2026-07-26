import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Type, Copy, Check, Trash2, FileText, AlignLeft, Hash
} from 'lucide-react';

export default function WordCounterTool({ onBack }) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words       = trimmed === '' ? 0 : trimmed.split(/\s+/).filter(Boolean).length;
    const chars       = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const sentences   = trimmed === '' ? 0 : (trimmed.match(/[^.!?]*[.!?]+/g) || [trimmed]).filter(s => s.trim()).length;
    const paragraphs  = trimmed === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim()).length || (trimmed ? 1 : 0);
    const readingTime = Math.max(1, Math.ceil(words / 200)); // avg 200 wpm
    return { words, chars, charsNoSpace, sentences, paragraphs, readingTime };
  }, [text]);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const STAT_CARDS = [
    { label: 'Words',          value: stats.words,         icon: <Type className="w-4 h-4" />,      color: 'orange' },
    { label: 'Characters',     value: stats.chars,         icon: <Hash className="w-4 h-4" />,      color: 'blue' },
    { label: 'No Spaces',      value: stats.charsNoSpace,  icon: <Hash className="w-4 h-4" />,      color: 'purple' },
    { label: 'Sentences',      value: stats.sentences,     icon: <AlignLeft className="w-4 h-4" />, color: 'green' },
    { label: 'Paragraphs',     value: stats.paragraphs,    icon: <FileText className="w-4 h-4" />,  color: 'teal' },
    { label: 'Read Time (min)',value: stats.readingTime,   icon: <Type className="w-4 h-4" />,      color: 'rose' },
  ];

  const COLOR_MAP = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    green:  'bg-emerald-50 text-emerald-600 border-emerald-100',
    teal:   'bg-teal-50 text-teal-600 border-teal-100',
    rose:   'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-4">

        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors group mb-6">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Tools
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
            <Type className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Word Counter</h1>
            <p className="text-gray-500 text-sm mt-0.5">Count words, characters, sentences & estimate reading time instantly.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${COLOR_MAP[s.color]} text-center`}>
              <div className="text-2xl font-extrabold tabular-nums">{s.value.toLocaleString()}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mt-1 opacity-80">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Textarea */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Text</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!text}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors text-xs font-semibold disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setText('')}
                disabled={!text}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-xs font-semibold disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your text here..."
            className="w-full h-72 p-5 text-sm text-gray-800 focus:outline-none resize-none bg-white leading-relaxed"
          />
        </div>

      </div>
    </div>
  );
}
