import React, { useState, useCallback } from 'react';
import {
  ArrowLeft, AlignLeft, Copy, Check, RefreshCw, Sliders
} from 'lucide-react';

const LOREM_WORDS = [
  'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do',
  'eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim',
  'ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi',
  'aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit',
  'voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint',
  'occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt',
  'mollit','anim','id','est','laborum','cras','mattis','consectetur','purus','sit',
  'suscipit','praesent','commodo','cursus','magna','vel','scelerisque','nisl','volutpat',
  'viverra','maecenas','accumsan','lacus','vel','facilisis','volutpat','est','velit',
  'egestas','dui','id','ornare','arcu','odio','ut','sem','nulla','pharetra','diam',
];

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function generateSentence(minWords = 6, maxWords = 14) {
  const len = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
  const words = Array.from({ length: len }, () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  return capitalize(words.join(' ')) + '.';
}

function generateParagraph(minSentences = 3, maxSentences = 6) {
  const len = minSentences + Math.floor(Math.random() * (maxSentences - minSentences + 1));
  return Array.from({ length: len }, () => generateSentence()).join(' ');
}

function generateWords(count) {
  const words = Array.from({ length: count }, () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  return capitalize(words.join(' ')) + '.';
}

export default function LoremIpsumTool({ onBack }) {
  const [type, setType]       = useState('paragraphs'); // paragraphs | sentences | words
  const [count, setCount]     = useState(3);
  const [startLorem, setStartLorem] = useState(true);
  const [output, setOutput]   = useState('');
  const [copied, setCopied]   = useState(false);

  const generate = useCallback(() => {
    let result = '';
    if (type === 'paragraphs') {
      const paras = Array.from({ length: count }, (_, i) => {
        if (i === 0 && startLorem) return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + generateParagraph(2, 4);
        return generateParagraph();
      });
      result = paras.join('\n\n');
    } else if (type === 'sentences') {
      const sentences = Array.from({ length: count }, (_, i) => {
        if (i === 0 && startLorem) return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
        return generateSentence();
      });
      result = sentences.join(' ');
    } else {
      result = generateWords(count);
      if (startLorem) result = 'Lorem ipsum dolor sit amet ' + result;
    }
    setOutput(result);
    setCopied(false);
  }, [type, count, startLorem]);

  // Auto-generate when options change
  React.useEffect(() => { generate(); }, [generate]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TYPE_OPTIONS = [
    { key: 'paragraphs', label: 'Paragraphs' },
    { key: 'sentences',  label: 'Sentences'  },
    { key: 'words',      label: 'Words'      },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-4">

        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors group mb-6">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Tools
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
            <AlignLeft className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Lorem Ipsum Generator</h1>
            <p className="text-gray-500 text-sm mt-0.5">Generate placeholder text for designs, mockups, and prototypes.</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-5 flex flex-wrap items-center gap-4">

          {/* Type selector */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setType(opt.key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${type === opt.key ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-semibold text-gray-600">Count:</span>
            <input
              type="number"
              min={1}
              max={type === 'words' ? 500 : 20}
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-orange-400 text-center"
            />
          </div>

          {/* Start with Lorem */}
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={startLorem}
              onChange={(e) => setStartLorem(e.target.checked)}
              className="w-4 h-4 rounded accent-orange-500"
            />
            Start with "Lorem ipsum"
          </label>

          {/* Generate Button */}
          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-sm shadow-orange-500/20 hover:-translate-y-0.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generate
          </button>
        </div>

        {/* Output */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Generated Text</span>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors text-xs font-semibold disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          <div className="p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[200px] max-h-[480px] overflow-auto">
            {output || <span className="text-gray-300">Click Generate to create text...</span>}
          </div>
        </div>

      </div>
    </div>
  );
}
