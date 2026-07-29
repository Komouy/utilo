import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Music, Download, RefreshCw,
  X, Shield, Zap, CheckCircle2, AlertCircle, FileVideo,
  Volume2, Clock, Info, FileAudio, Loader2
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const BITRATE_OPTIONS = [
  { label: '128 kbps', desc: 'Standar', value: 128 },
  { label: '192 kbps', desc: 'Bagus',   value: 192 },
  { label: '256 kbps', desc: 'Tinggi',  value: 256 },
  { label: '320 kbps', desc: 'Terbaik', value: 320 },
];

// Load lamejs from CDN once, cache result
let lamePromise = null;
function loadLame() {
  if (lamePromise) return lamePromise;
  lamePromise = new Promise((resolve, reject) => {
    if (window.lamejs) { resolve(window.lamejs); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.min.js';
    script.onload = () => resolve(window.lamejs);
    script.onerror = () => reject(new Error('Gagal memuat encoder MP3. Periksa koneksi internet.'));
    document.head.appendChild(script);
  });
  return lamePromise;
}

export default function Mp4ToMp3Tool({ onBack }) {
  const [file, setFile]           = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [bitrate, setBitrate]     = useState(BITRATE_OPTIONS[1]);
  const [status, setStatus]       = useState('idle'); // idle|processing|done|error
  const [progress, setProgress]   = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [lameReady, setLameReady] = useState(!!window.lamejs);

  const inputRef = useRef(null);

  // Preload lamejs in background as soon as component mounts
  useEffect(() => {
    loadLame()
      .then(() => setLameReady(true))
      .catch(() => {}); // silently ignore; will show error on convert
  }, []);

  const reset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null); setVideoInfo(null);
    setStatus('idle'); setProgress(0); setProgressLabel('');
    setResult(null); setError(null);
  };

  const handleFile = useCallback((f) => {
    if (!f) return;
    const ok = f.type.startsWith('video/') || f.type.startsWith('audio/')
      || /\.(mp4|mov|avi|mkv|webm|m4v|wav|ogg|aac|m4a|flac)$/i.test(f.name);
    if (!ok) { setError('File harus berupa video atau audio (MP4, WAV, MOV, MKV, WebM, dll.)'); return; }
    setError(null); setResult(null); setStatus('idle'); setFile(f);
    const url = URL.createObjectURL(f);
    const el  = document.createElement('video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => { setVideoInfo({ duration: el.duration, size: f.size, name: f.name }); URL.revokeObjectURL(url); };
    el.onerror         = () => { setVideoInfo({ duration: null,        size: f.size, name: f.name }); URL.revokeObjectURL(url); };
    el.src = url;
  }, []);

  const onDrop      = useCallback((e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }, [handleFile]);
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()  => setDragging(false);

  // ── float32 → int16 ─────────────────────────────────────────────────────
  function float32ToInt16(f32) {
    const i16 = new Int16Array(f32.length);
    for (let i = 0; i < f32.length; i++) {
      const s = Math.max(-1, Math.min(1, f32[i]));
      i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return i16;
  }

  // ── Main convert ─────────────────────────────────────────────────────────
  const handleConvert = async () => {
    if (!file) return;
    setStatus('processing'); setProgress(5); setProgressLabel('Memuat encoder MP3…'); setError(null); setResult(null);

    try {
      // 1. Ensure lamejs loaded
      const lame = await loadLame();
      setLameReady(true);

      // 2. Read file
      setProgress(10); setProgressLabel('Membaca file…');
      const arrayBuffer = await file.arrayBuffer();

      // 3. Decode audio
      setProgress(18); setProgressLabel('Mendekode audio…');
      const audioCtx    = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      await audioCtx.close();

      // 4. Encode to MP3 via lamejs
      setProgress(22); setProgressLabel('Mengenkode ke MP3…');
      await new Promise(r => setTimeout(r, 0)); // let UI breathe

      const numChannels = audioBuffer.numberOfChannels;
      const sampleRate  = audioBuffer.sampleRate;
      const isMono      = numChannels === 1;

      const encoder  = new lame.Mp3Encoder(isMono ? 1 : 2, sampleRate, bitrate.value);
      const left32   = audioBuffer.getChannelData(0);
      const right32  = isMono ? left32 : audioBuffer.getChannelData(1);
      const total    = left32.length;
      const CHUNK    = 1152;
      const mp3Parts = [];

      for (let i = 0; i < total; i += CHUNK) {
        const l = float32ToInt16(left32.subarray(i, i + CHUNK));
        const r = float32ToInt16(right32.subarray(i, i + CHUNK));
        const encoded = isMono ? encoder.encodeBuffer(l) : encoder.encodeBuffer(l, r);
        if (encoded.length > 0) mp3Parts.push(new Uint8Array(encoded));

        // update progress every ~100 chunks
        if (i % (CHUNK * 100) === 0) {
          const pct = 22 + Math.round((i / total) * 70);
          setProgress(pct);
          // yield briefly so progress bar re-renders
          if (i % (CHUNK * 500) === 0) await new Promise(r => setTimeout(r, 0));
        }
      }

      const flushed = encoder.flush();
      if (flushed.length > 0) mp3Parts.push(new Uint8Array(flushed));

      // 5. Build blob
      setProgress(95); setProgressLabel('Menyiapkan file…');
      const mp3Blob    = new Blob(mp3Parts, { type: 'audio/mpeg' });
      const baseName   = file.name.replace(/\.[^.]+$/, '');
      const outputName = `${baseName}.mp3`;
      const url        = URL.createObjectURL(mp3Blob);

      setResult({ url, size: mp3Blob.size, name: outputName, duration: audioBuffer.duration });
      setProgress(100); setProgressLabel('Selesai!');
      setStatus('done');

    } catch (err) {
      console.error(err);
      const msg = err.message || '';
      setError(
        msg.includes('memuat encoder') ? msg :
        msg.toLowerCase().includes('decod')
          ? 'Gagal mendekode audio. Pastikan file memiliki track audio yang valid.'
          : `Konversi gagal: ${msg || 'Kesalahan tidak diketahui'}`
      );
      setStatus('error');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const isAudio = file && (file.type.startsWith('audio/') || /\.(wav|mp3|ogg|aac|m4a|flac)$/i.test(file.name));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Kembali ke semua tools
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
          <Music className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">Video & Audio ke MP3</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Konversi MP4, WAV, MOV, MKV → MP3 asli — 100% lokal di browser</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 mb-6 text-sm text-orange-700 dark:text-orange-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Menggunakan <strong>Web Audio API</strong> + <strong>lamejs</strong> encoder —
          menghasilkan file <strong>.MP3</strong> asli. File tidak pernah dikirim ke server.
          {!lameReady && <span className="ml-1 opacity-70">(Memuat encoder…)</span>}
        </span>
      </div>

      {/* Upload */}
      {!file && (
        <div
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/10 scale-[1.01]'
              : 'border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 bg-white dark:bg-slate-900'
          }`}
        >
          <input ref={inputRef} type="file" accept="video/*,audio/*,.mp4,.mov,.avi,.mkv,.webm,.m4v,.wav,.ogg,.aac,.m4a,.flac" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          <div className="flex flex-col items-center gap-4">
            <div className={`p-5 rounded-2xl transition-colors ${dragging ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-gray-100 dark:bg-slate-800'}`}>
              <FileAudio className={`w-10 h-10 transition-colors ${dragging ? 'text-orange-500' : 'text-gray-400 dark:text-slate-500'}`} />
            </div>
            <div>
              <p className="font-bold text-gray-700 dark:text-slate-200 text-lg">{dragging ? 'Lepaskan file di sini' : 'Seret & lepas file video atau audio'}</p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">atau <span className="text-orange-500 font-semibold">klik untuk pilih file</span></p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Video: MP4, MOV, MKV, WebM, AVI &nbsp;·&nbsp; Audio: WAV, AAC, OGG, FLAC, M4A</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 mt-4 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* File info + options */}
      {file && status !== 'done' && (
        <div className="space-y-5 mt-2">

          {/* File card */}
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
              {isAudio ? <FileAudio className="w-6 h-6" /> : <FileVideo className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 dark:text-slate-100 text-sm truncate">{file.name}</p>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                <span>{formatBytes(file.size)}</span>
                {videoInfo?.duration && (<><span>·</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(videoInfo.duration)}</span></>)}
              </div>
            </div>
            <button onClick={reset} className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {/* Bitrate */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-orange-500" /> Bitrate MP3
            </p>
            <div className="flex flex-wrap gap-2">
              {BITRATE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setBitrate(opt)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    bitrate.value === opt.value
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-orange-300 hover:text-orange-500'
                  }`}>
                  <span>{opt.label}</span>
                  <span className={`ml-1.5 text-xs font-normal ${bitrate.value === opt.value ? 'text-orange-100' : 'text-gray-400 dark:text-slate-500'}`}>{opt.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">Bitrate lebih tinggi = kualitas lebih baik, ukuran file lebih besar.</p>
          </div>

          {/* Convert / Progress */}
          {status !== 'processing' ? (
            <button onClick={handleConvert}
              className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-lg shadow-orange-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl flex items-center justify-center gap-2">
              {lameReady ? <Music className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
              {lameReady ? 'Konversi ke MP3' : 'Memuat encoder…'}
            </button>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />{progressLabel || 'Memproses…'}
                </p>
                <span className="text-sm font-bold text-orange-500">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-300 shadow-sm" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">{progressLabel}</p>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {status === 'done' && result && (
        <div className="space-y-5 mt-2">
          <div className="p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="w-5 h-5" /></div>
              <div>
                <p className="font-bold text-gray-900 dark:text-slate-100">Konversi berhasil!</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">File MP3 siap diunduh</p>
              </div>
            </div>
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pratinjau Audio</p>
              <audio controls src={result.url} className="w-full rounded-xl" style={{ accentColor: '#f97316' }} />
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl mb-5">
              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500"><Music className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 dark:text-slate-100 text-sm truncate">{result.name}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  <span>{formatBytes(result.size)}</span><span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(result.duration)}</span>
                  <span>·</span><span>MP3 · {bitrate.label}</span>
                </div>
              </div>
            </div>
            <a href={result.url} download={result.name}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
              <Download className="w-5 h-5" /> Unduh {result.name}
            </a>
          </div>
          <button onClick={reset}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-orange-300 hover:text-orange-500 font-semibold text-sm transition-all flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Konversi file lain
          </button>
        </div>
      )}

      {/* Feature cards */}
      {!file && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: <Shield className="w-5 h-5" />, title: 'Privasi Terjaga',  desc: 'File tidak pernah diunggah ke server — semua diproses di browsermu.' },
            { icon: <Music  className="w-5 h-5" />, title: 'MP3 Asli',         desc: 'Output .mp3 sejati via lamejs encoder — kompatibel di semua pemutar.' },
            { icon: <Zap    className="w-5 h-5" />, title: 'Multi-Format',     desc: 'Input video (MP4, MKV, MOV) dan audio (WAV, AAC, FLAC, OGG, M4A).' },
          ].map((f) => (
            <div key={f.title} className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl">
              <div className="text-orange-500 mb-2">{f.icon}</div>
              <p className="font-bold text-gray-800 dark:text-slate-100 text-sm mb-1">{f.title}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
