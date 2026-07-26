import React, { useState } from 'react';
import { 
  ArrowLeft, Binary, Copy, Download, Trash2, Check, RefreshCw, 
  FileText, Upload, Sparkles
} from 'lucide-react';

export default function Base64Tool({ onBack }) {
  const [activeTab, setActiveTab] = useState('encode'); // 'encode' | 'decode'
  const [inputText, setInputText] = useState('Hello UtiloBox Developer!');
  const [urlSafe, setUrlSafe] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Compute Base64 result
  const outputText = React.useMemo(() => {
    setError(null);
    if (!inputText) return '';

    try {
      if (activeTab === 'encode') {
        // UTF-8 friendly encoding
        const bytes = new TextEncoder().encode(inputText);
        let binString = '';
        bytes.forEach((b) => (binString += String.fromCharCode(b)));
        let encoded = btoa(binString);
        if (urlSafe) {
          encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        return encoded;
      } else {
        // Base64 Decode
        let str = inputText.trim();
        if (urlSafe) {
          str = str.replace(/-/g, '+').replace(/_/g, '/');
          while (str.length % 4) {
            str += '=';
          }
        }
        const binString = atob(str);
        const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      }
    } catch (err) {
      setError(activeTab === 'encode' ? 'Failed to encode text.' : 'Invalid Base64 string format.');
      return '';
    }
  }, [inputText, activeTab, urlSafe]);

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setInputText(event.target?.result || '');
    };

    if (activeTab === 'encode') {
      reader.readAsDataURL(file); // Convert image/file directly to Base64 data URL
    } else {
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-4">

        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors group mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Tools
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
            <Binary className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900">Base64 Encoder & Decoder</h1>
              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Developer Tool
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Encode and decode text or files to Base64 format instantly & securely.
            </p>
          </div>
        </div>

        {/* Options & Tab Bar */}
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab('encode')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'encode'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Encode (Text ➔ Base64)
            </button>
            <button
              onClick={() => setActiveTab('decode')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'decode'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Decode (Base64 ➔ Text)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={urlSafe}
                onChange={(e) => setUrlSafe(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400"
              />
              URL-Safe Base64
            </label>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-gray-500" />
              Upload File
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => setInputText('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Main Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Input */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                {activeTab === 'encode' ? 'Raw Text Input' : 'Base64 String Input'}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {inputText.length} Characters
              </span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={activeTab === 'encode' ? 'Type or paste text to encode...' : 'Paste Base64 string to decode...'}
              className="w-full h-80 p-4 font-mono text-xs text-gray-800 focus:outline-none resize-none bg-white leading-relaxed"
            />
          </div>

          {/* Right: Output */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Result Output
              </span>
              <button
                onClick={handleCopy}
                disabled={!outputText}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors text-xs font-semibold disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="w-full h-80 p-4 font-mono text-xs bg-gray-900 text-emerald-400 overflow-auto leading-relaxed break-all">
              {error ? (
                <div className="text-red-400 font-sans text-xs flex items-center gap-2 pt-4">
                  ⚠️ {error}
                </div>
              ) : outputText ? (
                outputText
              ) : (
                <span className="text-gray-600 font-sans">Result will appear here...</span>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
