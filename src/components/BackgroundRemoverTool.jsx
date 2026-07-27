import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, Upload, Download, X, RefreshCw,
  Sparkles, AlertCircle, FileImage, Eye, EyeOff, Zap, Sliders, Info, Cloud, Lock, Key, ExternalLink
} from 'lucide-react';

// ── Mode config ───────────────────────────────────────────────────────────────
const MODES = {
  cloud:   { label: 'Cloud AI ☁️',       isCloud: true,   desc: '~2-4 detik via HF API (tercepat)' },
  mobile:  { label: '📱 HP Turbo',        maxDim: 320,  model: 'isnet_quint8', desc: 'Lokal (~3-5s, 320px) untuk HP' },
  turbo:   { label: '⚡ Standard Turbo', maxDim: 512,  model: 'isnet_quint8', desc: 'Lokal (~30s, 512px) standar' },
  hd:      { label: '🎨 HD Quality',     maxDim: 1024, model: 'isnet_fp16',   desc: 'Lokal HD kualitas terbaik' },
  instant: { label: '🪄 Instant',        maxDim: 1280, isInstant: true,      desc: 'Instan <0.1s untuk BG warna polos' },
};

// Hugging Face API endpoint (briaai/RMBG-1.4)
const HF_API_URL = 'https://api-inference.huggingface.co/models/briaai/RMBG-1.4';
const HF_TOKEN_KEY = 'utilobox_hf_token';

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Remove background via Hugging Face Inference API (cloud, fast ~2-4s) */
async function removeBackgroundCloud(file, token, onProgress) {
  onProgress?.('Mengirim gambar ke Cloud AI...', 20);

  const formData = new FormData();
  formData.append('inputs', file);

  const res = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: file,
  });

  if (!res.ok) {
    let errMsg = `HF API error ${res.status}`;
    try {
      const errJson = await res.json();
      errMsg = errJson?.error || errMsg;
    } catch (_) {}

    if (res.status === 401) throw new Error('Token HF tidak valid. Pastikan token Anda benar.');
    if (res.status === 503) throw new Error('Model Cloud AI sedang loading (~20 detik). Coba lagi sebentar.');
    throw new Error(errMsg);
  }

  onProgress?.('Memproses hasil AI...', 80);
  const blob = await res.blob();
  if (!blob || blob.size < 100) throw new Error('Hasil tidak valid dari Cloud AI. Coba lagi.');

  onProgress?.('Selesai!', 100);
  return blob;
}

/** Instant color keying for solid background images */
async function removeSolidBackground(fileOrBlob, tolerance = 28) {
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
      const bgR = data[0], bgG = data[1], bgB = data[2];
      for (let i = 0; i < data.length; i += 4) {
        const diff = Math.sqrt(
          (data[i] - bgR) ** 2 + (data[i + 1] - bgG) ** 2 + (data[i + 2] - bgB) ** 2
        );
        if (diff < tolerance * 2.55) data[i + 3] = 0;
      }
      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Resize + JPEG encode for local AI */
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
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
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

// ── Token Setup Modal ─────────────────────────────────────────────────────────
function HFTokenModal({ onSave, onClose }) {
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Key className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Hugging Face API Token</h3>
            <p className="text-xs text-gray-400">Diperlukan untuk Cloud AI mode</p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-3.5 mb-5">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
            🔑 Token gratis dari Hugging Face. Daftar / login ke{' '}
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold"
            >
              huggingface.co/settings/tokens
            </a>
            , klik <strong>New token</strong> → tipe <strong>Read</strong> → salin token-nya.
          </p>
        </div>

        <div className="relative mb-4">
          <input
            type={show ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-mono bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-12"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mb-5 flex items-start gap-1.5">
          <Lock className="w-3 h-3 mt-0.5 shrink-0" />
          Token disimpan hanya di browser Anda (localStorage), tidak dikirim ke server kami.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors border border-gray-100 text-sm"
          >
            Batal
          </button>
          <button
            onClick={() => { if (token.startsWith('hf_') && token.length > 10) { onSave(token); } }}
            disabled={!token.startsWith('hf_') || token.length < 10}
            className="flex-1 py-2.5 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Simpan & Gunakan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BackgroundRemoverTool({ onBack }) {
  const [file, setFile]                   = useState(null);
  const [preview, setPreview]             = useState(null);
  const [result, setResult]               = useState(null);
  const [stage, setStage]                 = useState('idle');
  const [stageText, setStageText]         = useState('');
  const [progress, setProgress]           = useState(0);
  const [error, setError]                 = useState(null);
  const [dragging, setDragging]           = useState(false);
  const [showOriginal, setShowOriginal]   = useState(false);
  const [mode, setMode]                   = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 'cloud' : 'cloud'
  );
  const [imgDimensions, setImgDimensions] = useState(null);
  const [device, setDevice]               = useState('gpu');
  const [hfToken, setHfToken]             = useState(() => localStorage.getItem(HF_TOKEN_KEY) || '');
  const [showTokenModal, setShowTokenModal] = useState(false);

  const inputRef    = useRef(null);
  const removeFnRef = useRef(null);

  const saveToken = (t) => {
    localStorage.setItem(HF_TOKEN_KEY, t);
    setHfToken(t);
    setShowTokenModal(false);
  };

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) { setError('File harus gambar (JPG, PNG, WebP).'); return; }
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

  const handleRemove = async () => {
    if (!file) return;
    setError(null); setResult(null);
    setProgress(5); setStage('preparing');
    setStageText('Menyiapkan gambar...');

    try {
      const cfg = MODES[mode];

      // ── Cloud AI (HF API) ───────────────────────────────────
      if (cfg.isCloud) {
        if (!hfToken) { setShowTokenModal(true); setStage('idle'); setProgress(0); setStageText(''); return; }
        setStage('processing');
        setStageText('Mengirim ke Cloud AI (HF)...');
        setProgress(20);
        const outputBlob = await removeBackgroundCloud(file, hfToken, (text, pct) => {
          setStageText(text);
          setProgress(pct);
        });
        setProgress(100); setStage('idle'); setStageText('');
        setResult({ url: URL.createObjectURL(outputBlob) });
        return;
      }

      // ── Instant Solid BG ────────────────────────────────────
      if (cfg.isInstant) {
        setStage('processing'); setStageText('Instant color keying (0.05s)...'); setProgress(50);
        const outputBlob = await removeSolidBackground(file, 28);
        setProgress(100); setStage('idle'); setStageText('');
        setResult({ url: URL.createObjectURL(outputBlob) });
        return;
      }

      // ── Local AI inference ──────────────────────────────────
      const { blob: inputBlob, info } = await prepareImage(file, cfg.maxDim);
      if (info) setImgDimensions(info);
      setProgress(15);

      setStage('loading'); setStageText('Memuat AI engine...');
      if (!removeFnRef.current) {
        const mod = await import('@imgly/background-removal');
        removeFnRef.current = mod.removeBackground;
      }
      setProgress(25);

      setStage('fetching'); setStageText('Mendownload model AI...');

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
                const pct      = 25 + Math.round((current / total) * 45);
                setProgress(pct);
                setStageText(`Download model AI (${loadedMB} MB / ${totalMB} MB)...`);
              }
            } else if (key.startsWith('compute')) {
              setStage('processing');
              if (total > 0) {
                const pct = 70 + Math.round((current / total) * 28);
                setProgress(pct);
                setStageText(`AI menghapus background (${Math.round((current / total) * 100)}%)...`);
              } else {
                setProgress(85); setStageText('AI memproses gambar...');
              }
            }
          },
        });
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 120000)
      );

      let outputBlob;
      try {
        outputBlob = await Promise.race([runInference(device), timeoutPromise]);
      } catch (firstErr) {
        if (device === 'gpu') {
          setStageText('GPU error, beralih ke CPU...');
          outputBlob = await Promise.race([runInference('cpu'), timeoutPromise]);
        } else { throw firstErr; }
      }

      setProgress(100); setStage('idle'); setStageText('');
      setResult({ url: URL.createObjectURL(outputBlob) });

    } catch (err) {
      console.error(err);
      if (err.message === 'TIMEOUT') {
        setError('Proses timeout. Coba gunakan mode Cloud AI (☁️) atau pilih mode HP Turbo untuk HP.');
      } else {
        setError(err.message || 'Gagal memproses. Coba gunakan mode Cloud AI atau gambar yang lebih kecil.');
      }
      setStage('idle'); setProgress(0); setStageText('');
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
  const isCloudMode  = mode === 'cloud';

  return (
    <div className="min-h-screen bg-transparent pb-24">
      {showTokenModal && <HFTokenModal onSave={saveToken} onClose={() => setShowTokenModal(false)} />}

      <div className="max-w-4xl mx-auto px-4 pt-4">

        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors group mb-6">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Tools
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Background Remover AI</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Hapus background gambar dengan AI — pilih Cloud (cepat) atau Lokal (privat).
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mb-3 p-1.5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-1.5">
          {Object.entries(MODES).map(([key, cfg]) => {
            const isActive = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                disabled={isProcessing}
                className={`flex flex-col items-center justify-center text-center p-2.5 rounded-xl font-semibold text-xs transition-all ${
                  isActive
                    ? key === 'cloud'
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                      : 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                    : 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">{cfg.label}</div>
                <div className={`text-[10px] font-normal leading-tight ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                  {cfg.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Cloud Mode Info Banner */}
        {isCloudMode && (
          <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Mode Cloud AI (Hugging Face)</p>
                <p className="text-[11px] text-blue-500 dark:text-blue-400">
                  {hfToken ? '✅ Token tersimpan — siap digunakan!' : '⚠️ Perlu HF token gratis untuk mulai'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hfToken && (
                <span className="text-[10px] font-mono text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-lg">
                  {hfToken.substring(0, 6)}...
                </span>
              )}
              <button
                onClick={() => setShowTokenModal(true)}
                className="text-[11px] font-bold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Key className="w-3 h-3" />
                {hfToken ? 'Ganti Token' : 'Set Token'}
              </button>
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Daftar <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Local Engine Selector (only for local modes) */}
        {!isCloudMode && mode !== 'instant' && (
          <div className="mb-4 px-4 py-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium flex items-center gap-1.5">⚙️ Processing Engine:</span>
            <div className="flex gap-1">
              {['gpu', 'cpu'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  disabled={isProcessing}
                  className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                    device === d ? 'bg-orange-100 text-orange-700 font-bold' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  {d === 'gpu' ? 'GPU Mode (Fast)' : 'CPU Mode (Safe)'}
                </button>
              ))}
            </div>
          </div>
        )}

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
                          : 'border-gray-200 bg-white dark:bg-gray-900 hover:border-orange-300 hover:bg-orange-50/20 cursor-pointer'
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
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-orange-50 rounded-2xl mb-4"><Upload className="w-8 h-8 text-orange-400" /></div>
                  <p className="font-semibold text-gray-700 mb-1">{dragging ? 'Drop image here' : 'Pilih atau Drag & Drop Gambar'}</p>
                  <p className="text-sm text-gray-400">atau <span className="text-orange-500 font-semibold">klik untuk browse</span></p>
                  <p className="text-xs text-gray-300 mt-2">Supports JPG, PNG, WebP</p>
                </>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

            {/* Process Button */}
            <button
              onClick={handleRemove}
              disabled={!file || isProcessing || (isCloudMode && !hfToken)}
              className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                file && !isProcessing && (!isCloudMode || hfToken)
                  ? isCloudMode
                    ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30 hover:-translate-y-0.5'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30 hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isProcessing ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />Memproses...</>
              ) : isCloudMode && !hfToken ? (
                <><Key className="w-4 h-4" />Set Token HF dulu</>
              ) : (
                <><Sparkles className="w-4 h-4" />Hapus Background Sekarang</>
              )}
            </button>

            {isCloudMode && !hfToken && (
              <button
                onClick={() => setShowTokenModal(true)}
                className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Key className="w-4 h-4" />
                Set Hugging Face Token (Gratis)
              </button>
            )}

            {/* Progress Bar */}
            {isProcessing && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-orange-100 dark:border-gray-800 shadow-sm p-5 space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    {stageText || 'Memproses...'}
                  </span>
                  <span className="text-orange-600 font-extrabold tabular-nums">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden p-0.5 border border-gray-100 dark:border-gray-700">
                  <div
                    className={`h-full rounded-full transition-all duration-300 relative overflow-hidden ${
                      isCloudMode
                        ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600'
                        : 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 text-center font-medium">{stageText}</p>
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
            <div className={`flex-1 rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 ${result ? 'border-green-100 bg-white shadow-sm dark:border-green-900 dark:bg-gray-900' : 'border-gray-100 bg-white/50 dark:border-gray-800 dark:bg-gray-900/50'}`}>
              {result ? (
                <>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{showOriginal ? 'Original Image' : 'Background Removed ✅'}</span>
                    <button onClick={() => setShowOriginal((v) => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-50">
                      {showOriginal ? <><Eye className="w-3.5 h-3.5" /> Lihat Hasil</> : <><EyeOff className="w-3.5 h-3.5" /> Lihat Original</>}
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-6 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:20px_20px]">
                    <img src={showOriginal ? preview : result.url} alt={showOriginal ? 'Original' : 'No background'} className="max-h-64 max-w-full object-contain rounded-xl shadow-md transition-all duration-300" />
                  </div>
                  <div className="px-5 py-4 border-t border-gray-50 dark:border-gray-800">
                    <button onClick={handleDownload} className="w-full py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 hover:-translate-y-0.5">
                      <Download className="w-4 h-4" />Download Transparent PNG
                    </button>
                    <button onClick={handleReset} className="w-full mt-2 py-2.5 rounded-xl font-semibold text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-all text-sm flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />Proses Gambar Lain
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 min-h-[360px]">
                  <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-full mb-4"><FileImage className="w-10 h-10 text-gray-200" /></div>
                  <p className="text-gray-400 text-sm font-medium">Hasil AI akan muncul di sini</p>
                  <p className="text-gray-300 text-xs mt-1">Upload gambar lalu klik Hapus Background</p>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 px-5 py-4">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-orange-500" /> Panduan Mode
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span><strong className="text-gray-700 dark:text-gray-300">Cloud AI ☁️:</strong> Tercepat ~2-4 detik via Hugging Face API. Gratis dengan token HF. Gambar dikirim ke server HF.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  <span><strong className="text-gray-700 dark:text-gray-300">HP Turbo:</strong> Lokal 3-5 detik di HP. Privat, tidak ada upload. Cocok untuk HP dengan koneksi bagus.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                  <span><strong className="text-gray-700 dark:text-gray-300">Instant:</strong> Instan 0.05 detik untuk gambar dengan background warna polos / putih.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
