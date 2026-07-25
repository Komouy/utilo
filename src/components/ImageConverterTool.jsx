import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, Upload, Image as ImageIcon, Download, RefreshCw,
  X, ChevronDown, Shield, Camera, Zap, CheckCircle2, AlertCircle, FileImage
} from 'lucide-react';

const FORMAT_OPTIONS = [
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg', lossy: true },
  { value: 'image/png', label: 'PNG', ext: 'png', lossy: false },
  { value: 'image/webp', label: 'WebP', ext: 'webp', lossy: true },
];

const QUALITY_PRESETS = [
  { label: '360p', desc: 'Rendah', value: 40 },
  { label: '480p', desc: 'Sedang', value: 65 },
  { label: '720p', desc: 'Tinggi', value: 85 },
  { label: '1080p', desc: 'Terbaik', value: 100 },
];

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function FormatBadge({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border ${
        active
          ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500'
      }`}
    >
      {label}
    </button>
  );
}

export default function ImageConverterTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [outputFormat, setOutputFormat] = useState(FORMAT_OPTIONS[0]);
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState(null); // { url, size, name }
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WebP, dll).');
      return;
    }
    setError(null);
    setResult(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleConvert = () => {
    if (!file || !preview) return;
    setConverting(true);
    setError(null);

    const img = new window.Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        // White background for JPG (handles transparent PNGs)
        if (outputFormat.value === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        const q = outputFormat.lossy ? quality / 100 : undefined;
        const dataUrl = canvas.toDataURL(outputFormat.value, q);

        // Estimate output size from base64
        const base64 = dataUrl.split(',')[1];
        const outputSize = Math.round((base64.length * 3) / 4);

        const baseName = file.name.replace(/\.[^.]+$/, '');
        setResult({
          url: dataUrl,
          size: outputSize,
          name: `${baseName}.${outputFormat.ext}`,
        });
      } catch {
        setError('Konversi gagal. Coba gambar lain.');
      } finally {
        setConverting(false);
      }
    };
    img.onerror = () => {
      setError('Gagal memuat gambar.');
      setConverting(false);
    };
    img.src = preview;
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.name;
    a.click();
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setConverting(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const sizeDelta = result && file
    ? ((result.size - file.size) / file.size) * 100
    : null;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Top bar */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors group mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Tools
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500">
            <FileImage className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Image Converter</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Convert images to JPG, PNG, or WebP — directly in browser, no server upload.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Upload & Settings */}
          <div className="flex flex-col gap-5">
            {/* Drop Zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => !file && inputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] overflow-hidden
                ${dragging
                  ? 'border-orange-400 bg-orange-50/60 scale-[1.01]'
                  : file
                    ? 'border-orange-300 bg-orange-50/30 cursor-default'
                    : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/20'
                }`}
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview input"
                    className="max-h-52 max-w-full object-contain rounded-xl p-2"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full shadow text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="mt-2 pb-3 text-xs text-gray-400 font-medium">
                    {file.name} · {formatBytes(file.size)}
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-orange-50 rounded-2xl mb-4">
                    <Upload className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">
                    {dragging ? 'Drop image here' : 'Drag & drop image'}
                  </p>
                  <p className="text-sm text-gray-400">
                    or <span className="text-orange-500 font-semibold">click to select file</span>
                  </p>
                  <p className="text-xs text-gray-300 mt-2">JPG, PNG, WebP, BMP, GIF</p>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {/* Format Selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <ChevronDown className="w-4 h-4 text-orange-400" />
                <span className="font-semibold text-gray-800 text-sm">Output Format</span>
              </div>
              <div className="flex gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <FormatBadge
                    key={f.value}
                    label={f.label}
                    active={outputFormat.value === f.value}
                    onClick={() => { setOutputFormat(f); setResult(null); }}
                  />
                ))}
              </div>
            </div>

            {/* Quality Presets — only for lossy formats */}
            {outputFormat.lossy && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ChevronDown className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-gray-800 text-sm">Quality</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {QUALITY_PRESETS.map((preset) => {
                    const isActive = quality === preset.value;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => { setQuality(preset.value); setResult(null); }}
                        className={`flex flex-col items-center py-2.5 px-1 rounded-xl border text-center transition-all duration-200 ${
                          isActive
                            ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500'
                        }`}
                      >
                        <span className="font-bold text-sm leading-tight">{preset.label}</span>
                        <span className={`text-[10px] mt-0.5 font-medium ${
                          isActive ? 'text-orange-100' : 'text-gray-400'
                        }`}>{preset.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!file || converting}
              className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md
                ${file && !converting
                  ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
            >
              {converting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Convert Now
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* RIGHT: Result */}
          <div className="flex flex-col gap-5">
            <div className={`flex-1 rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col
              ${result ? 'border-green-100 bg-white shadow-sm' : 'border-gray-100 bg-white/50'}`}
            >
              {result ? (
                <>
                  {/* Result Header */}
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-green-50 bg-green-50/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="font-semibold text-green-700 text-sm">Conversion Successful!</span>
                  </div>

                  {/* Result Preview */}
                  <div className="flex-1 flex items-center justify-center p-6 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:20px_20px]">
                    <img
                      src={result.url}
                      alt="Converted result"
                      className="max-h-52 max-w-full object-contain rounded-xl shadow-lg"
                    />
                  </div>

                  {/* Stats */}
                  <div className="px-5 py-4 border-t border-gray-50">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Format</p>
                        <p className="font-bold text-gray-800 text-sm">{outputFormat.label}</p>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Size</p>
                        <p className="font-bold text-gray-800 text-sm">{formatBytes(result.size)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Change</p>
                        <p className={`font-bold text-sm ${
                          sizeDelta < 0 ? 'text-green-500' : sizeDelta > 0 ? 'text-orange-500' : 'text-gray-500'
                        }`}>
                          {sizeDelta !== null
                            ? `${sizeDelta > 0 ? '+' : ''}${sizeDelta.toFixed(1)}%`
                            : '—'
                          }
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleDownload}
                      className="w-full py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-sm shadow-green-500/20 hover:-translate-y-0.5"
                    >
                      <Download className="w-4 h-4" />
                      Download {result.name}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 min-h-[340px]">
                  <div className="p-5 bg-gray-50 rounded-full mb-4">
                    <ImageIcon className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Converted image will appear here</p>
                  <p className="text-gray-300 text-xs mt-1">Upload an image then click Convert Now</p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="rounded-2xl bg-orange-50/60 border border-orange-100 px-5 py-4">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">Tips</p>
              <ul className="text-xs text-gray-500 space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <div className="p-1 bg-orange-100 rounded-md shrink-0 mt-0.5">
                    <Shield className="w-3 h-3 text-orange-500" />
                  </div>
                  <span><strong className="text-gray-700">PNG</strong> — lossless, cocok untuk logo &amp; ikon dengan transparansi</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="p-1 bg-orange-100 rounded-md shrink-0 mt-0.5">
                    <Camera className="w-3 h-3 text-orange-500" />
                  </div>
                  <span><strong className="text-gray-700">JPG</strong> — ukuran kecil, ideal untuk foto</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="p-1 bg-orange-100 rounded-md shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-orange-500" />
                  </div>
                  <span><strong className="text-gray-700">WebP</strong> — terbaik untuk web, ukuran kecil + kualitas tinggi</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
