import React, { useState, useRef, useCallback } from 'react';
import { removeBackground } from '@imgly/background-removal';
import {
  ArrowLeft, Upload, Download, X, RefreshCw,
  Sparkles, AlertCircle, FileImage, Eye, EyeOff
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}const STAGES = {
  idle: null,
  loading: 'Loading image...',
  fetching: 'Preparing AI model...',
  processing: 'Processing with AI...',
  done: 'Done!',
};

export default function BackgroundRemoverTool({ onBack }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);      // original preview
  const [result, setResult] = useState(null);         // { url, blob }
  const [stage, setStage] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) {
      setError('File must be an image (JPG, PNG, WebP).');
      return;
    }
    setError(null);
    setResult(null);
    setStage('idle');
    setProgress(0);
    setShowOriginal(false);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const handleRemove = async () => {
    if (!file) return;
    setError(null);
    setResult(null);
    setProgress(0);
    setStage('loading');

    try {
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          if (key.startsWith('fetch')) {
            setStage('fetching');
            setProgress(total > 0 ? Math.round((current / total) * 100) : 0);
          } else {
            setStage('processing');
            setProgress(total > 0 ? Math.round((current / total) * 100) : 50);
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setResult({ url, blob });
      setStage('done');
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('Failed to process image. Try another image or refresh the page.');
      setStage('idle');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${baseName}_no_bg.png`;
    a.click();
  };

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview(null);
    setResult(null);
    setStage('idle');
    setProgress(0);
    setError(null);
    setShowOriginal(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isProcessing = stage === 'loading' || stage === 'fetching' || stage === 'processing';

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-4">

        {/* Back */}
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
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Background Remover</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Remove image backgrounds automatically using AI — 100% in browser, no server upload.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: Upload */}
          <div className="flex flex-col gap-5">

            {/* Drop Zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => !file && inputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center min-h-[260px] overflow-hidden
                ${dragging
                  ? 'border-orange-400 bg-orange-50/60 scale-[1.01] cursor-copy'
                  : file
                    ? 'border-orange-200 bg-orange-50/20 cursor-default'
                    : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/20 cursor-pointer'
                }`}
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Original"
                    className="max-h-56 max-w-full object-contain rounded-xl p-3"
                  />
                  {!isProcessing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full shadow text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <div className="pb-3 text-xs text-gray-400 font-medium">
                    {file?.name} · {formatBytes(file?.size)}
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
                  <p className="text-xs text-gray-300 mt-2">JPG, PNG, WebP</p>
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

            {/* Process Button */}
            <button
              onClick={handleRemove}
              disabled={!file || isProcessing}
              className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md
                ${file && !isProcessing
                  ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {STAGES[stage]}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Remove Background
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                  <span>{STAGES[stage]}</span>
                  <span className="text-orange-500">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          {/* RIGHT: Result */}
          <div className="flex flex-col gap-5">
            <div className={`flex-1 rounded-2xl border overflow-hidden flex flex-col transition-all duration-300
              ${result ? 'border-green-100 bg-white shadow-sm' : 'border-gray-100 bg-white/50'}`}
            >
              {result ? (
                <>
                  {/* Toggle before/after */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                    <span className="text-sm font-semibold text-gray-700">
                      {showOriginal ? 'Original' : 'Result'}
                    </span>
                    <button
                      onClick={() => setShowOriginal((v) => !v)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-50"
                    >
                      {showOriginal
                        ? <><Eye className="w-3.5 h-3.5" /> View Result</>
                        : <><EyeOff className="w-3.5 h-3.5" /> View Original</>
                      }
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="flex-1 flex items-center justify-center p-6 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:20px_20px]">
                    <img
                      src={showOriginal ? preview : result.url}
                      alt={showOriginal ? 'Original' : 'Result without background'}
                      className="max-h-56 max-w-full object-contain rounded-xl shadow-lg transition-all duration-300"
                    />
                  </div>

                  {/* Download */}
                  <div className="px-5 py-4 border-t border-gray-50">
                    <button
                      onClick={handleDownload}
                      className="w-full py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-sm shadow-green-500/20 hover:-translate-y-0.5"
                    >
                      <Download className="w-4 h-4" />
                      Download PNG (Transparent)
                    </button>
                    <button
                      onClick={handleReset}
                      className="w-full mt-2 py-2.5 rounded-xl font-semibold text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-all text-sm flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Process Another Image
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 min-h-[360px]">
                  <div className="p-5 bg-gray-50 rounded-full mb-4">
                    <FileImage className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Result will appear here</p>
                  <p className="text-gray-300 text-xs mt-1">Upload an image then click Remove Background</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="rounded-2xl bg-orange-50/60 border border-orange-100 px-5 py-4">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">INFO</p>
              <ul className="text-xs text-gray-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  Image is <strong className="text-gray-600">not sent</strong> to any server — processed locally
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  Best results on photos of people, products, or objects with clear contrast
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
