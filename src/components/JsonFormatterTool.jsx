import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Code2, Copy, Download, Trash2, Check, AlertCircle, 
  Sparkles, FileText, Minimize2, FileJson, Search, CheckCircle2
} from 'lucide-react';

const SAMPLE_JSON = `{
  "name": "UtiloBox Web Tools",
  "version": "1.2.0",
  "status": "active",
  "features": [
    "QR Code Generator",
    "Image Converter",
    "Background Remover AI",
    "JSON Formatter & Validator"
  ],
  "config": {
    "theme": "light",
    "primaryColor": "#f97316",
    "clientProcessingOnly": true,
    "maxUploadMb": 25
  },
  "stats": {
    "totalTools": 4,
    "rating": 4.9,
    "freeForever": true
  }
}`;

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function JsonFormatterTool({ onBack }) {
  const [inputJson, setInputJson] = useState(SAMPLE_JSON);
  const [indentSize, setIndentSize] = useState(2);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Validate & parse JSON
  const parsedState = useMemo(() => {
    if (!inputJson.trim()) {
      return { isValid: null, data: null, error: null, formatted: '', minified: '' };
    }
    try {
      const parsed = JSON.parse(inputJson);
      return {
        isValid: true,
        data: parsed,
        error: null,
        formatted: JSON.stringify(parsed, null, indentSize),
        minified: JSON.stringify(parsed),
      };
    } catch (err) {
      return {
        isValid: false,
        data: null,
        error: err.message,
        formatted: '',
        minified: '',
      };
    }
  }, [inputJson, indentSize]);

  // Statistics
  const stats = useMemo(() => {
    if (!parsedState.isValid || !parsedState.data) return null;
    const jsonStr = parsedState.formatted;
    const keyCount = (jsonStr.match(/"[^"]+":/g) || []).length;
    const arrayCount = (jsonStr.match(/\[/g) || []).length;
    const objectCount = (jsonStr.match(/\{/g) || []).length;
    const byteSize = new Blob([jsonStr]).size;
    return { keyCount, arrayCount, objectCount, byteSize };
  }, [parsedState]);

  const handleCopy = () => {
    if (!parsedState.formatted) return;
    navigator.clipboard.writeText(parsedState.formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!parsedState.formatted) return;
    const blob = new Blob([parsedState.formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMinify = () => {
    if (parsedState.isValid && parsedState.minified) {
      setInputJson(parsedState.minified);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setInputJson(event.target?.result || '');
    };
    reader.readAsText(file);
  };

  // Search/Filter inside JSON output
  const highlightedJson = useMemo(() => {
    if (!parsedState.formatted) return '';
    let text = parsedState.formatted;

    if (searchTerm.trim()) {
      const lines = text.split('\n');
      text = lines.filter(line => line.toLowerCase().includes(searchTerm.toLowerCase())).join('\n');
    }

    return text;
  }, [parsedState.formatted, searchTerm]);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-4">

        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors group mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Tools
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
              <Code2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900">JSON Formatter & Validator</h1>
                <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Developer Tool
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">
                Format, beautify, validate, and minify JSON data instantly — 100% browser-based.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase px-2">Indentation:</span>
            {[2, 4].map((spaces) => (
              <button
                key={spaces}
                onClick={() => setIndentSize(spaces)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  indentSize === spaces
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {spaces} Spaces
              </button>
            ))}
            <button
              onClick={() => setIndentSize('\t')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                indentSize === '\t'
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tab
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleMinify}
              disabled={!parsedState.isValid}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-all disabled:opacity-50"
              title="Minify JSON payload size"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              Minify JSON
            </button>

            <button
              onClick={() => setInputJson(SAMPLE_JSON)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sample JSON
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer transition-all">
              <FileJson className="w-3.5 h-3.5 text-gray-500" />
              Upload File
              <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => setInputJson('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Validation Status */}
        {parsedState.isValid !== null && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 transition-all ${
            parsedState.isValid
              ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800'
              : 'bg-red-50/80 border-red-200/80 text-red-800'
          }`}>
            {parsedState.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-bold text-sm">
                {parsedState.isValid ? 'Valid JSON Format!' : 'Invalid JSON Syntax'}
              </div>
              {!parsedState.isValid && (
                <p className="text-xs font-mono mt-1 opacity-90 break-all">
                  {parsedState.error}
                </p>
              )}
            </div>
            {stats && (
              <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-emerald-700 border-l border-emerald-200 pl-4">
                <span>Size: <strong>{formatBytes(stats.byteSize)}</strong></span>
                <span>Keys: <strong>{stats.keyCount}</strong></span>
                <span>Objects: <strong>{stats.objectCount}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Main Grid Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Raw Input */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                Raw JSON Input
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {inputJson.length} Characters
              </span>
            </div>
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder="Paste your JSON data here..."
              className="w-full h-[480px] p-4 font-mono text-xs text-gray-800 focus:outline-none resize-none bg-white leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Right: Formatted Output */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-500" />
                Formatted Output
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter key..."
                    className="pl-8 pr-3 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 w-28 sm:w-36"
                  />
                </div>

                <button
                  onClick={handleCopy}
                  disabled={!parsedState.isValid}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors text-xs font-semibold disabled:opacity-50"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!parsedState.isValid}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-xs font-semibold disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>

            {/* Formatted Code Box */}
            <div className="w-full h-[480px] p-4 font-mono text-xs text-gray-800 bg-gray-900 text-gray-100 overflow-auto leading-relaxed selection:bg-orange-500 selection:text-white">
              {parsedState.isValid ? (
                <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap break-all">
                  {highlightedJson || parsedState.formatted}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-8">
                  <AlertCircle className="w-8 h-8 text-gray-600 mb-2" />
                  <p className="text-sm font-medium">Input is not valid JSON</p>
                  <p className="text-xs text-gray-600 mt-1">Paste or fix your JSON data on the left panel</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
