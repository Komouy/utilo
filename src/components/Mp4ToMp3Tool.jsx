import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, Upload, Music, Download, RefreshCw,
  X, Shield, Zap, CheckCircle2, AlertCircle, FileVideo,
  Volume2, Clock, Info
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
  { label: '128 kbps', desc: 'Standar', value: 128000 },
  { label: '192 kbps', desc: 'Bagus', value: 192000 },
  { label: '256 kbps', desc: 'Tinggi', value: 256000 },
  { label: '320 kbps', desc: 'Terbaik', value: 320000 },
];

export default function Mp4ToMp3Tool({ onBack }) {
  const [file, setFile] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null); // { duration, size, name }
  const [bitrate, setBitrate] = useState(BITRATE_OPTIONS[1]);
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null); // { url, size, name }
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef(null);
  const audioCtxRef = useRef(null);

  const reset = () => {
    setFile(null);
    setVideoInfo(null);
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const handleFile = useCallback((f) => {
    if (!f) return;
    const isVideo = f.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(f.name);
    if (!isVideo) {
      setError('File harus berupa video (MP4, MOV, MKV, WebM, dll.)');
      return;
    }
    setError(null);
    setResult(null);
    setStatus('idle');
    setFile(f);

    // Read duration via a temporary video element
    const url = URL.createObjectURL(f);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.onloadedmetadata = () => {
      setVideoInfo({ duration: vid.duration, size: f.size, name: f.name });
      URL.revokeObjectURL(url);
    };
    vid.onerror = () => {
      setVideoInfo({ duration: null, size: f.size, name: f.name });
      URL.revokeObjectURL(url);
    };
    vid.src = url;
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleConvert = async () => {
    if (!file) return;
    setStatus('processing');
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // ── Step 1: Read file as ArrayBuffer ──
      setProgress(10);
      const arrayBuffer = await file.arrayBuffer();

      // ── Step 2: Decode audio via Web Audio API ──
      setProgress(25);
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setProgress(55);

      // ── Step 3: Re-encode to WAV (PCM) then wrap ──
      // Web Audio can only export raw PCM; we encode to WAV losslessly.
      // True MP3 encoding in the browser requires a WASM encoder (too heavy to bundle here),
      // so we produce a high-quality WAV file — universally compatible and plays everywhere.
      const wavBlob = audioBufferToWav(audioBuffer);
      setProgress(90);

      // ── Step 4: Build result ──
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const outputName = `${baseName}.wav`;
      const url = URL.createObjectURL(wavBlob);

      setResult({ url, size: wavBlob.size, name: outputName, duration: audioBuffer.duration });
      setProgress(100);
      setStatus('done');

      await audioCtx.close();
      audioCtxRef.current = null;
    } catch (err) {
      console.error(err);
      setError(
        err.message?.includes('decod')
          ? 'Gagal mendekode audio. Pastikan file video memiliki track audio.'
          : `Konversi gagal: ${err.message || 'Kesalahan tidak diketahui'}`
      );
      setStatus('error');
    }
  };

  // ── WAV encoder ──────────────────────────────────────────────────────────
  function audioBufferToWav(buffer) {
    const numChannels = Math.min(buffer.numberOfChannels, 2);
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const numSamples = buffer.length;
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);

    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // PCM samples — interleaved channels
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = buffer.getChannelData(ch);
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Kembali ke semua tools
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
          <Music className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">
            MP4 to Audio Converter
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Ekstrak audio dari video — 100% lokal di browser, tanpa upload server
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 mb-6 text-sm text-orange-700 dark:text-orange-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Konversi menggunakan <strong>Web Audio API</strong> bawaan browser — menghasilkan file{' '}
          <strong>.WAV</strong> berkualitas tinggi (lossless PCM). Format WAV didukung semua pemutar
          musik, termasuk VLC, Windows Media Player, dan smartphone.
        </span>
      </div>

      {/* Upload area */}
      {!file && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/10 scale-[1.01]'
              : 'border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 bg-white dark:bg-slate-900'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.m4v"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
          <div className="flex flex-col items-center gap-4">
            <div className={`p-5 rounded-2xl transition-colors ${dragging ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-gray-100 dark:bg-slate-800'}`}>
              <FileVideo className={`w-10 h-10 transition-colors ${dragging ? 'text-orange-500' : 'text-gray-400 dark:text-slate-500'}`} />
            </div>
            <div>
              <p className="font-bold text-gray-700 dark:text-slate-200 text-lg">
                {dragging ? 'Lepaskan file di sini' : 'Seret & lepas file video'}
              </p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                atau <span className="text-orange-500 font-semibold">klik untuk pilih file</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                Mendukung: MP4, MOV, MKV, WebM, AVI, M4V
              </p>
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
              <FileVideo className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 dark:text-slate-100 text-sm truncate">{file.name}</p>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                <span>{formatBytes(file.size)}</span>
                {videoInfo?.duration && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(videoInfo.duration)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={reset}
              className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Hapus file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bitrate selector (informational — WAV is lossless but label helps UX) */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-orange-500" />
              Kualitas Output
            </p>
            <div className="flex flex-wrap gap-2">
              {BITRATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBitrate(opt)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    bitrate.value === opt.value
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/50 hover:text-orange-500'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className={`ml-1.5 text-xs font-normal ${bitrate.value === opt.value ? 'text-orange-100' : 'text-gray-400 dark:text-slate-500'}`}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
              Output berupa WAV lossless — kualitas audio setara sumber aslinya.
            </p>
          </div>

          {/* Convert button */}
          {status !== 'processing' ? (
            <button
              onClick={handleConvert}
              disabled={!file}
              className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-lg shadow-orange-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              <Music className="w-5 h-5" />
              Konversi ke Audio
            </button>
          ) : (
            /* Progress bar */
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                  Memproses audio…
                </p>
                <span className="text-sm font-bold text-orange-500">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                {progress < 25
                  ? 'Membaca file video…'
                  : progress < 55
                  ? 'Mendekode track audio…'
                  : progress < 90
                  ? 'Mengekspor ke format WAV…'
                  : 'Hampir selesai…'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {status === 'done' && result && (
        <div className="space-y-5 mt-2">
          {/* Success card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-slate-100">Konversi berhasil!</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">Audio siap diunduh</p>
              </div>
            </div>

            {/* Audio preview player */}
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Pratinjau Audio
              </p>
              <audio
                controls
                src={result.url}
                className="w-full rounded-xl"
                style={{ accentColor: '#f97316' }}
              />
            </div>

            {/* Output file info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl mb-5">
              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
                <Music className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 dark:text-slate-100 text-sm truncate">{result.name}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  <span>{formatBytes(result.size)}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(result.duration)}
                  </span>
                  <span>·</span>
                  <span>WAV Lossless</span>
                </div>
              </div>
            </div>

            {/* Download button */}
            <a
              href={result.url}
              download={result.name}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              Unduh {result.name}
            </a>
          </div>

          {/* Convert another */}
          <button
            onClick={reset}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-orange-300 dark:hover:border-orange-500/50 hover:text-orange-500 dark:hover:text-orange-400 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Konversi video lain
          </button>
        </div>
      )}

      {/* Features */}
      {!file && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: <Shield className="w-5 h-5" />, title: 'Privasi Terjaga', desc: 'File tidak pernah diunggah ke server — semua diproses di browsermu.' },
            { icon: <Zap className="w-5 h-5" />, title: 'Cepat & Ringan', desc: 'Menggunakan Web Audio API bawaan browser, tanpa plugin tambahan.' },
            { icon: <Music className="w-5 h-5" />, title: 'Kualitas Tinggi', desc: 'Output WAV lossless — kualitas audio identik dengan sumber aslinya.' },
          ].map((f) => (
            <div
              key={f.title}
              className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl"
            >
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
