import React, { useState, useRef, useCallback, useEffect } from 'react';
// NO top-level import of removeBackground — loaded lazily on first click only
import {
  ArrowLeft, Upload, Download, X, RefreshCw,
  Sparkles, AlertCircle, FileImage, Eye, EyeOff, Zap, Sliders, Info
} from 'lucide-react';

// ── Mode config ──────────────────────────────────────────────────
// Valid models in @imgly/background-removal: "isnet_quint8" (8-bit, ~10MB, ultra fast) | "isnet_fp16" (16-bit, ~20MB) | "isnet" (32-bit, ~40MB)
// ── Mode config ──────────────────────────────────────────────────
// Valid models in @imgly/background-removal: "isnet_quint8" (8-bit, ~10MB, ultra fast) | "isnet_fp16" (16-bit, ~20MB) | "isnet" (32-bit, ~40MB)
const MODES = {
  mobile:  { label: 'HP / Mobile Turbo', maxDim: 320,  model: 'isnet_quint8', desc: 'Fastest for HP (~3-5s, 320px)' },
  turbo:   { label: 'Standard Turbo',    maxDim: 512,  model: 'isnet_quint8', desc: 'Standard Fast (8-bit, 512px)' },
  hd:      { label: 'HD Quality',       maxDim: 1024, model: 'isnet_fp16',   desc: 'Best Quality (16-bit, 1024px)' },
  instant: { label: 'Instant (Solid BG)', maxDim: 1280, isInstant: true,     desc: 'Instant 0.05s for White/Solid BG' },
};

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Instant color key removal for images with solid/white backgrounds (0.05s).
 */
async function removeSolidBackground(fileOrBlob, tolerance = 30) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Sample top-left corner background color (RGB)
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Color distance formula
        const diff = Math.sqrt(
          (r - bgR) * (r - bgR) +
          (g - bgG) * (g - bgG) +
          (b - bgB) * (b - bgB)
        );

        if (diff < tolerance * 2.55) {
          data[i + 3] = 0; // Set alpha to transparent
        }
      }

      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Resize image to maxDimension and encode as JPEG (smaller → less AI memory).
 */
async function prepareImage(fileOrBlob, maxDim) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const orig = { width, height };

      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else                 { width = Math.round((width * maxDim) / height);  height = maxDim; }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve({ blob: blob || fileOrBlob, info: { ...orig, scaledWidth: width, scaledHeight: height, isScaled: width !== orig.width || height !== orig.height } }),
        'image/jpeg', 0.92
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ blob: fileOrBlob, info: null }); };
    img.src = url;
  });
}

export default function BackgroundRemoverTool({ onBack }) {
  const [file, setFile]                   = useState(null);
  const [preview, setPreview]             = useState(null);
  const [result, setResult]               = useState(null);
  const [stage, setStage]                 = useState('idle'); // 'idle' | 'preparing' | 'loading' | 'fetching' | 'processing'
  const [stageText, setStageText]         = useState('');
  const [progress, setProgress]           = useState(0);
  const [error, setError]                 = useState(null);
  const [dragging, setDragging]           = useState(false);
  const [showOriginal, setShowOriginal]   = useState(false);
  const [mode, setMode]                   = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'mobile' : 'turbo'));
  const [imgDimensions, setImgDimensions] = useState(null);

  const inputRef       = useRef(null);
  const removeFnRef    = useRef(null); // cached dynamic import

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) { setError('File must be an image (JPG, PNG, WebP).'); return; }
    setError(null); setResult(null); setStage('idle'); setProgress(0); setStageText('');
    setShowOriginal(false); setFile(f); setImgDimensions(null);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => setImgDimensions({ width: img.width, height: img.height });
    img.src = url;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const [device, setDevice]               = useState('gpu'); // 'gpu' | 'cpu'

  const handleRemove = async () => {
    if (!file) return;
    setError(null); setResult(null);
    setProgress(5);
    setStage('preparing');
    setStageText('Optimizing image resolution...');

    try {
      const cfg = MODES[mode];

      // Instant Solid BG Mode
      if (cfg.isInstant) {
        setStage('processing');
        setStageText('Instant color keying (0.05s)...');
        setProgress(50);
        const outputBlob = await removeSolidBackground(file, 28);
        setProgress(100);
        setStage('idle');
        setStageText('');
        setResult({ url: URL.createObjectURL(outputBlob) });
        return;
      }

      // ── 1. Resize + JPEG encode ───────────────────────────────
      const { blob: inputBlob, info } = await prepareImage(file, cfg.maxDim);
      if (info) setImgDimensions(info);
      setProgress(15);

      // ── 2. Lazy-load library ──────────────────────────────────
      setStage('loading');
      setStageText('Initializing AI engine...');
      if (!removeFnRef.current) {
        const mod = await import('@imgly/background-removal');
        removeFnRef.current = mod.removeBackground;
      }
      setProgress(25);

      // ── 3. AI inference with REAL progress & Timeout ─────────
      setStage('fetching');
      setStageText('Downloading AI model...');

      // Wrap removal in a Promise with 90-second timeout guard
      const runInference = async (targetDevice) => {
        return await removeFnRef.current(inputBlob, {
          model: cfg.model,
          device: targetDevice,
          output: { format: 'image/png' },
          progress: (key, current, total) => {
            if (key.startsWith('fetch')) {
              setStage('fetching');
              if (total > 0) {
                const loadedMB = (current / (1024 * 1024)).toFixed(1);
                const totalMB  = (total / (1024 * 1024)).toFixed(1);
                const pct      = 25 + Math.round((current / total) * 45); // 25% → 70%
                setProgress(pct);
                setStageText(`Downloading AI model (${loadedMB} MB / ${totalMB} MB)...`);
              } else {
                setStageText('Downloading AI model files...');
              }
            } else if (key.startsWith('compute')) {
              setStage('processing');
              if (total > 0) {
                const pct = 70 + Math.round((current / total) * 28); // 70% → 98%
                setProgress(pct);
                setStageText(`AI removing background (${Math.round((current / total) * 100)}%)...`);
              } else {
                setProgress(85);
                setStageText('AI processing image subject...');
              }
            }
          },
        });
      };

      // Timeout wrapper (90s)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 90000);
      });

      let outputBlob;
      try {
        outputBlob = await Promise.race([runInference(device), timeoutPromise]);
      } catch (firstErr) {
        // If GPU mode timed out or failed, auto-fallback to CPU mode once
        if (device === 'gpu') {
          console.warn('GPU mode failed or timed out. Falling back to CPU mode...', firstErr);
          setStageText('GPU mode hung, switching to CPU fallback mode...');
          outputBlob = await Promise.race([runInference('cpu'), timeoutPromise]);
        } else {
          throw firstErr;
        }
      }

      setProgress(100);
      setStage('idle');
      setStageText('');
      setResult({ url: URL.createObjectURL(outputBlob) });

    } catch (err) {
      console.error(err);
      if (err.message === 'TIMEOUT') {
        setError('Process timed out. Your browser GPU might be unresponsive. Try switching device engine to "CPU Mode" below.');
      } else {
        setError('Failed to process. If stuck, try changing Processing Engine to CPU Mode or use a smaller image.');
      }
      setStage('idle');
      setProgress(0);
      setStageText('');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = result.url; a.download = `${baseName}_no_bg.png`; a.click();
  };

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null); setPreview(null); setResult(null);
    setStage('idle'); setProgress(0); setError(null); setStageText('');
    setShowOriginal(false); setImgDimensions(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isProcessing = ['preparing', 'loading', 'fetching', 'processing'].includes(stage);

  return (
    <div className="min-h-screen bg-transparent pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-4">

        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors group mb-6">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Tools
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Background Remover AI</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Remove image backgrounds with AI — 100% local, no server upload required.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mb-4 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(MODES).map(([key, cfg]) => {
            const isActive = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                disabled={isProcessing}
                className={`flex flex-col items-center justify-center text-center p-3 rounded-xl font-semibold text-xs transition-all ${
                  isActive ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]' : 'text-gray-600 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                  {key === 'instant' ? (
                    <Sparkles className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-orange-500'}`} />
                  ) : key === 'mobile' ? (
                    <Zap className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-orange-500'}`} />
                  ) : (
                    <Sliders className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-orange-500'}`} />
                  )}
                  <span>{cfg.label}</span>
                </div>
                <div className={`text-[10px] font-normal leading-tight ${isActive ? 'text-orange-100' : 'text-gray-400'}`}>
                  {cfg.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Acceleration Engine Selector */}
        <div className="mb-6 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium flex items-center gap-1.5">
            ⚙️ Processing Engine:
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setDevice('gpu')}
              disabled={isProcessing}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                device === 'gpu' ? 'bg-orange-100 text-orange-700 font-bold' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="Uses WebGPU/WebGL acceleration (Fastest, but may freeze on some GPUs)"
            >
              GPU Mode (Fast)
            </button>
            <button
              type="button"
              onClick={() => setDevice('cpu')}
              disabled={isProcessing}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                device === 'cpu' ? 'bg-orange-100 text-orange-700 font-bold' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="Uses WebAssembly CPU (Most compatible & stable if GPU hangs)"
            >
              CPU Mode (Fallback / Safe)
            </button>
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
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center min-h-[260px] overflow-hidden ${
                dragging ? 'border-orange-400 bg-orange-50/60 scale-[1.01] cursor-copy'
                : file    ? 'border-orange-200 bg-orange-50/20 cursor-default'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/20 cursor-pointer'
              }`}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Original" className="max-h-56 max-w-full object-contain rounded-xl p-3" />
                  {!isProcessing && (
                    <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full shadow text-gray-500 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <div className="pb-3 text-xs text-gray-500 font-medium flex flex-col items-center gap-1">
                    <span>{file?.name} · {formatBytes(file?.size)}</span>
                    {imgDimensions && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100/70 text-orange-700 text-[11px]">
                        {imgDimensions.width} × {imgDimensions.height}px
                        {imgDimensions.isScaled && ` → ${imgDimensions.scaledWidth}×${imgDimensions.scaledHeight}`}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-orange-50 rounded-2xl mb-4"><Upload className="w-8 h-8 text-orange-400" /></div>
                  <p className="font-semibold text-gray-700 mb-1">{dragging ? 'Drop image here' : 'Select or Drag & Drop Image'}</p>
                  <p className="text-sm text-gray-400">or <span className="text-orange-500 font-semibold">click to browse files</span></p>
                  <p className="text-xs text-gray-300 mt-2">Supports JPG, PNG, WebP</p>
                </>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

            {/* Process Button */}
            <button
              onClick={handleRemove}
              disabled={!file || isProcessing}
              className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                file && !isProcessing
                  ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isProcessing ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />Processing...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Remove Background Now</>
              )}
            </button>

            {/* Real Progress Bar */}
            {isProcessing && (
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    {stageText || 'Processing...'}
                  </span>
                  <span className="text-orange-600 font-extrabold tabular-nums">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 transition-all duration-300 relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 text-center font-medium">
                  {stageText}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* RIGHT: Result */}
          <div className="flex flex-col gap-5">
            <div className={`flex-1 rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 ${result ? 'border-green-100 bg-white shadow-sm' : 'border-gray-100 bg-white/50'}`}>
              {result ? (
                <>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                    <span className="text-sm font-semibold text-gray-700">{showOriginal ? 'Original Image' : 'Background Removed'}</span>
                    <button onClick={() => setShowOriginal((v) => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-50">
                      {showOriginal ? <><Eye className="w-3.5 h-3.5" /> View Result</> : <><EyeOff className="w-3.5 h-3.5" /> View Original</>}
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-6 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:20px_20px]">
                    <img src={showOriginal ? preview : result.url} alt={showOriginal ? 'Original' : 'No background'} className="max-h-64 max-w-full object-contain rounded-xl shadow-md transition-all duration-300" />
                  </div>
                  <div className="px-5 py-4 border-t border-gray-50">
                    <button onClick={handleDownload} className="w-full py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 hover:-translate-y-0.5">
                      <Download className="w-4 h-4" />Download Transparent PNG
                    </button>
                    <button onClick={handleReset} className="w-full mt-2 py-2.5 rounded-xl font-semibold text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-all text-sm flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />Process Another Image
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 min-h-[360px]">
                  <div className="p-5 bg-gray-50 rounded-full mb-4"><FileImage className="w-10 h-10 text-gray-200" /></div>
                  <p className="text-gray-400 text-sm font-medium">AI result will appear here</p>
                  <p className="text-gray-300 text-xs mt-1">Upload an image then click Remove Background</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="rounded-2xl bg-orange-50/60 border border-orange-100 px-5 py-4">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-orange-500" /> How It Works
              </p>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  <span><strong className="text-gray-700">Turbo (8-bit Quantized):</strong> Ultra-fast &amp; uses 75% less bandwidth (~10MB model vs 40MB).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  <span><strong className="text-gray-700">First run only:</strong> AI model downloads once, then cached forever by your browser.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  <span><strong className="text-gray-700">100% Private:</strong> Images are processed entirely in your browser — nothing ever leaves your device.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
