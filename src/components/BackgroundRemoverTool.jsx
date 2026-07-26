import React, { useState, useRef, useCallback, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import {
  ArrowLeft, Upload, Download, X, RefreshCw,
  Sparkles, AlertCircle, FileImage, Eye, EyeOff, Zap, Sliders, Info, Smartphone
} from 'lucide-react';

// ── Detect mobile / low-power device ─────────────────────────────
const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && window.innerWidth < 768);

// ── Mode config ───────────────────────────────────────────────────
const MODES = {
  turbo: { label: 'Turbo',    maxDim: 512,  model: 'small', tickerSpeed: 100, desc: 'Ultra-fast for Mobile (Max 512px)',   recommended: 'mobile' },
  fast:  { label: 'Fast',     maxDim: 1024, model: 'small', tickerSpeed: 160, desc: 'Balanced quality & speed (Max 1024px)', recommended: 'desktop' },
  hd:    { label: 'HD',       maxDim: 1920, model: 'medium',tickerSpeed: 320, desc: 'Best quality for Desktop (Max 1920px)', recommended: null },
};

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Downscale + encode to JPEG (lighter than PNG for AI inference).
 * For transparency-sensitive inputs we keep PNG — but JPEG is 3-5× smaller
 * and reduces model memory pressure significantly.
 */
async function prepareImageForAI(fileOrBlob, maxDimension) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const originalInfo = { width, height };

      // Scale down if exceeds max dimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      // White fill so JPEG encoding doesn't corrupt transparency pixels
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Use JPEG (quality 0.92) — far smaller than PNG, reduces AI memory load
      canvas.toBlob(
        (blob) => {
          resolve({
            blob: blob || fileOrBlob,
            info: {
              ...originalInfo,
              scaledWidth: width,
              scaledHeight: height,
              isScaled: width !== originalInfo.width || height !== originalInfo.height,
            },
          });
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob: fileOrBlob, info: null });
    };
    img.src = url;
  });
}

// ── Model warm-up: pre-downloads + caches the small model ─────────
let warmupPromise = null;
function warmupModel() {
  if (warmupPromise) return warmupPromise;
  warmupPromise = (async () => {
    try {
      // Create a tiny 1×1 white image blob
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 1, 1);
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      // Run with small model — this forces model download into browser cache
      await removeBackground(blob, { model: 'small' });
    } catch {
      // Silently ignore — warmup failure doesn't block the user
    }
  })();
  return warmupPromise;
}

const STAGE_LABELS = {
  idle:       null,
  preparing:  'Optimizing image...',
  fetching:   'Downloading AI model...',
  processing: 'AI removing background...',
  done:       'Done!',
};

export default function BackgroundRemoverTool({ onBack }) {
  const isMobile = isMobileDevice();
  const [file, setFile]                   = useState(null);
  const [preview, setPreview]             = useState(null);
  const [result, setResult]               = useState(null);
  const [stage, setStage]                 = useState('idle');
  const [progress, setProgress]           = useState(0);
  const [error, setError]                 = useState(null);
  const [dragging, setDragging]           = useState(false);
  const [showOriginal, setShowOriginal]   = useState(false);
  const [mode, setMode]                   = useState(isMobile ? 'turbo' : 'fast');
  const [imgDimensions, setImgDimensions] = useState(null);
  const [modelCached, setModelCached]     = useState(false);
  const inputRef                          = useRef(null);
  const tickerRef                         = useRef(null);
  const maxProgressRef                    = useRef(0);
  const abortRef                          = useRef(false);

  // Pre-warm model on mount so download happens silently in background
  useEffect(() => {
    warmupModel().then(() => setModelCached(true)).catch(() => {});
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

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
    setImgDimensions(null);

    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { setImgDimensions({ width: img.width, height: img.height }); };
    img.src = url;

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  // Smooth ticker — increments by 1% every speedMs until maxPercent
  const startTicker = (maxPercent, speedMs) => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= maxPercent) { clearInterval(tickerRef.current); return prev; }
        const next = Math.min(prev + 1, maxPercent);
        maxProgressRef.current = Math.max(maxProgressRef.current, next);
        return next;
      });
    }, speedMs);
  };

  const bumpProgress = (newVal) => {
    if (newVal > maxProgressRef.current) {
      maxProgressRef.current = newVal;
      setProgress(newVal);
    }
  };

  const handleRemove = async () => {
    if (!file) return;
    abortRef.current = false;
    setError(null);
    setResult(null);
    setProgress(5);
    maxProgressRef.current = 5;
    setStage('preparing');
    if (tickerRef.current) clearInterval(tickerRef.current);

    try {
      const cfg = MODES[mode];

      // ── Step 1: resize + re-encode to JPEG ───────────────────
      const { blob: inputBlob, info } = await prepareImageForAI(file, cfg.maxDim);
      if (abortRef.current) return;
      if (info) setImgDimensions(info);

      bumpProgress(15);
      setStage('fetching');

      // ── Step 2: ticker during model download / inference ─────
      startTicker(90, cfg.tickerSpeed);

      // ── Step 3: AI inference ─────────────────────────────────
      const outputBlob = await removeBackground(inputBlob, {
        model: cfg.model,
        progress: (key, current, total) => {
          if (abortRef.current) return;
          if (key.startsWith('fetch')) {
            setStage('fetching');
            setModelCached(false);
            if (total > 0) {
              const pct = 15 + Math.round((current / total) * 40);
              bumpProgress(pct);
            }
          } else {
            setStage('processing');
            bumpProgress(55);
          }
        },
      });

      if (abortRef.current) return;

      if (tickerRef.current) clearInterval(tickerRef.current);
      maxProgressRef.current = 100;
      setProgress(100);
      setStage('done');
      setModelCached(true);

      setResult({ url: URL.createObjectURL(outputBlob), blob: outputBlob });
    } catch (err) {
      if (abortRef.current) return;
      console.error(err);
      if (tickerRef.current) clearInterval(tickerRef.current);
      setError('Failed to process image. Try Turbo mode or use a smaller image.');
      setStage('idle');
      setProgress(0);
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
    abortRef.current = true;
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null); setPreview(null); setResult(null);
    setStage('idle'); setProgress(0); setError(null);
    setShowOriginal(false); setImgDimensions(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isProcessing = ['preparing', 'fetching', 'processing'].includes(stage);

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
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900">Background Remover AI</h1>
              {modelCached && (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ⚡ Model Cached
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Remove image backgrounds with AI — 100% local, never uploaded to server.
            </p>
          </div>
        </div>

        {/* Mobile notice */}
        {isMobile && (
          <div className="mb-5 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
            <Smartphone className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Mobile detected.</strong> <strong>Turbo Mode</strong> is selected automatically for the fastest experience. Switch to Fast/HD for better quality on stable connections.
            </p>
          </div>
        )}

        {/* Mode Selector — 3 modes */}
        <div className="mb-6 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-2">
          {Object.entries(MODES).map(([key, cfg]) => {
            const isActive = mode === key;
            const isRec = (isMobile && cfg.recommended === 'mobile') || (!isMobile && key === 'fast');
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {key === 'turbo' && <Smartphone className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-orange-500'}`} />}
                {key === 'fast'  && <Zap className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-orange-500'}`} />}
                {key === 'hd'    && <Sliders className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-orange-500'}`} />}
                <div className="text-left">
                  <div className="font-bold flex items-center gap-1.5">
                    {cfg.label}
                    {isRec && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-extrabold ${
                        isActive ? 'bg-white/20' : 'bg-orange-100 text-orange-500'
                      }`}>Rec</span>
                    )}
                  </div>
                  <div className={`text-[11px] font-normal ${isActive ? 'text-orange-100' : 'text-gray-400'}`}>
                    {cfg.desc}
                  </div>
                </div>
              </button>
            );
          })}
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
                  <img src={preview} alt="Original" className="max-h-56 max-w-full object-contain rounded-xl p-3" />
                  {!isProcessing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full shadow text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <div className="pb-3 text-xs text-gray-500 font-medium flex flex-col items-center gap-1">
                    <span>{file?.name} · {formatBytes(file?.size)}</span>
                    {imgDimensions && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100/70 text-orange-700 text-[11px]">
                        {imgDimensions.width} × {imgDimensions.height} px
                        {imgDimensions.isScaled && ` ⚡ → ${imgDimensions.scaledWidth}×${imgDimensions.scaledHeight}`}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-orange-50 rounded-2xl mb-4">
                    <Upload className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">
                    {dragging ? 'Drop image here' : 'Select or Drag & Drop Image'}
                  </p>
                  <p className="text-sm text-gray-400">
                    or <span className="text-orange-500 font-semibold">click to browse files</span>
                  </p>
                  <p className="text-xs text-gray-300 mt-2">Supports JPG, PNG, WebP</p>
                </>
              )}
            </div>
            <input
              ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {/* Process Button */}
            <button
              onClick={handleRemove}
              disabled={!file || isProcessing}
              className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md
                ${file && !isProcessing
                  ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
            >
              {isProcessing ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />{STAGE_LABELS[stage]}</>
              ) : (
                <><Sparkles className="w-4 h-4" />Remove Background Now</>
              )}
            </button>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-orange-600 font-extrabold tabular-nums">{progress}%</span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 transition-all duration-200 relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 text-center font-medium">
                  {stage === 'preparing'  && `Resizing to ${MODES[mode].maxDim}px & encoding as JPEG...`}
                  {stage === 'fetching'   && (modelCached ? 'Loading AI model from cache...' : 'Downloading AI model (cached after first use)...')}
                  {stage === 'processing' && 'AI is separating subject from background...'}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error} <button onClick={() => { setError(null); setMode('turbo'); }} className="underline font-semibold ml-1">Switch to Turbo</button></span>
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
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                    <span className="text-sm font-semibold text-gray-700">
                      {showOriginal ? 'Original Image' : 'Background Removed'}
                    </span>
                    <button
                      onClick={() => setShowOriginal((v) => !v)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-50"
                    >
                      {showOriginal
                        ? <><Eye className="w-3.5 h-3.5" /> View AI Result</>
                        : <><EyeOff className="w-3.5 h-3.5" /> View Original</>
                      }
                    </button>
                  </div>

                  <div className="flex-1 flex items-center justify-center p-6 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:20px_20px]">
                    <img
                      src={showOriginal ? preview : result.url}
                      alt={showOriginal ? 'Original' : 'Result without background'}
                      className="max-h-64 max-w-full object-contain rounded-xl shadow-md transition-all duration-300"
                    />
                  </div>

                  <div className="px-5 py-4 border-t border-gray-50">
                    <button
                      onClick={handleDownload}
                      className="w-full py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 hover:-translate-y-0.5"
                    >
                      <Download className="w-4 h-4" />
                      Download Transparent PNG
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
                  <p className="text-gray-400 text-sm font-medium">AI result will appear here</p>
                  <p className="text-gray-300 text-xs mt-1">Upload an image then click Remove Background</p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="rounded-2xl bg-orange-50/60 border border-orange-100 px-5 py-4">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-orange-500" /> Performance Tips
              </p>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  <span><strong className="text-gray-700">Turbo Mode (512px):</strong> Fastest on mobile — AI processes 4× fewer pixels vs Fast mode.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  <span><strong className="text-gray-700">Model auto-caches:</strong> First run downloads the model. Every run after is instant — no re-download.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  <span><strong className="text-gray-700">100% Private:</strong> Images never leave your browser — all AI runs locally on your device.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
