import React, { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft, RefreshCw, Copy, Check, ShieldCheck, ShieldAlert, ShieldX,
  Eye, EyeOff, Download, Trash2, Clock, KeyRound, Shield, Zap, Lock
} from 'lucide-react';

// ── Character sets ────────────────────────────────────────────────
const CHARSET = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers:   '0123456789',
  symbols:   '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

// ── Strength calculator ───────────────────────────────────────────
function calcStrength(password, options) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (password.length >= 20) score++;
  if (options.uppercase && /[A-Z]/.test(password)) score++;
  if (options.lowercase && /[a-z]/.test(password)) score++;
  if (options.numbers   && /[0-9]/.test(password)) score++;
  if (options.symbols   && /[^A-Za-z0-9]/.test(password)) score++;

  // Estimate entropy bits: log2(pool^len)
  let pool = 0;
  if (options.uppercase) pool += 26;
  if (options.lowercase) pool += 26;
  if (options.numbers)   pool += 10;
  if (options.symbols)   pool += 28;
  const entropy = pool > 0 ? Math.round(password.length * Math.log2(pool)) : 0;

  if (score <= 2 || entropy < 40)  return { score: 1, label: 'Weak',   color: 'red',    entropy };
  if (score <= 4 || entropy < 70)  return { score: 2, label: 'Fair',   color: 'amber',  entropy };
  if (score <= 5 || entropy < 90)  return { score: 3, label: 'Good',   color: 'yellow', entropy };
  if (score <= 6 || entropy < 110) return { score: 4, label: 'Strong', color: 'green',  entropy };
  return                                   { score: 5, label: 'Very Strong', color: 'emerald', entropy };
}

const STRENGTH_META = {
  red:     { bg: 'bg-red-500',     text: 'text-red-600',     icon: ShieldX,     width: 'w-[20%]' },
  amber:   { bg: 'bg-amber-400',   text: 'text-amber-600',   icon: ShieldAlert, width: 'w-[40%]' },
  yellow:  { bg: 'bg-yellow-400',  text: 'text-yellow-600',  icon: ShieldAlert, width: 'w-[60%]' },
  green:   { bg: 'bg-green-500',   text: 'text-green-600',   icon: ShieldCheck, width: 'w-[80%]' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', icon: ShieldCheck, width: 'w-full'  },
};

// ── Cryptographically random character picker ─────────────────────
function secureRandom(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function generatePassword(length, options) {
  let pool = '';
  const guaranteed = [];

  if (options.uppercase) { pool += CHARSET.uppercase; guaranteed.push(CHARSET.uppercase[secureRandom(CHARSET.uppercase.length)]); }
  if (options.lowercase) { pool += CHARSET.lowercase; guaranteed.push(CHARSET.lowercase[secureRandom(CHARSET.lowercase.length)]); }
  if (options.numbers)   { pool += CHARSET.numbers;   guaranteed.push(CHARSET.numbers[secureRandom(CHARSET.numbers.length)]); }
  if (options.symbols)   { pool += CHARSET.symbols;   guaranteed.push(CHARSET.symbols[secureRandom(CHARSET.symbols.length)]); }

  if (!pool) return '';

  const remaining = Array.from({ length: Math.max(0, length - guaranteed.length) }, () =>
    pool[secureRandom(pool.length)]
  );

  // Shuffle guaranteed + remaining
  const all = [...guaranteed, ...remaining];
  for (let i = all.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.join('');
}

// ── Toggle Option Button ─────────────────────────────────────────
function OptionToggle({ label, description, checked, onChange, colorClass }) {
  return (
    <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none ${
      checked
        ? `border-orange-300 bg-orange-50/70 ${colorClass || ''}`
        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/60'
    }`}>
      <div>
        <div className={`text-sm font-bold ${checked ? 'text-orange-700' : 'text-gray-700'}`}>{label}</div>
        <div className={`text-xs mt-0.5 ${checked ? 'text-orange-500/80' : 'text-gray-400'}`}>{description}</div>
      </div>
      {/* Custom toggle switch */}
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4 ${
          checked ? 'bg-orange-500' : 'bg-gray-200'
        }`}
        onClick={onChange}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </div>
    </label>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function PasswordGeneratorTool({ onBack }) {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyVisible, setHistoryVisible] = useState(false);

  const activeOptions = Object.values(options).some(Boolean);

  const generate = useCallback(() => {
    if (!activeOptions) return;
    const pwd = generatePassword(length, options);
    setPassword(pwd);
    setCopied(false);
    if (pwd) {
      setHistory((prev) => [{ pwd, ts: Date.now() }, ...prev.slice(0, 9)]);
    }
  }, [length, options, activeOptions]);

  // Auto-generate on mount and when options/length change
  useEffect(() => { generate(); }, [length, options]);  // eslint-disable-line

  const strength = calcStrength(password, options);
  const meta = STRENGTH_META[strength.color] || STRENGTH_META.red;
  const StrengthIcon = meta.icon;

  const handleCopy = (pwd = password) => {
    if (!pwd) return;
    navigator.clipboard.writeText(pwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!password) return;
    const blob = new Blob([password], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'password.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleOption = (key) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Ensure at least one option stays on
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-4">

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
            <KeyRound className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Password Generator</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Generate cryptographically secure passwords — 100% local, never sent to any server.
            </p>
          </div>
        </div>

        {/* ── Password Display Card ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-5">
          {/* Password Output */}
          <div className="relative mb-4">
            <div className={`w-full px-5 py-4 pr-28 rounded-2xl bg-gray-900 font-mono text-base leading-relaxed break-all min-h-[60px] flex items-center transition-all duration-200 ${
              !password ? 'opacity-40' : ''
            }`}>
              <span className={`text-emerald-400 tracking-wider select-all ${
                !showPassword && password ? 'blur-sm select-none' : ''
              }`}>
                {password || 'Generate a password...'}
              </span>
            </div>

            {/* Action buttons overlay */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                onClick={() => setShowPassword((v) => !v)}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleCopy()}
                disabled={!password}
                title="Copy to clipboard"
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          {password && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <StrengthIcon className={`w-4 h-4 ${meta.text}`} />
                  <span className={`text-xs font-bold ${meta.text}`}>{strength.label}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">~{strength.entropy} bits entropy</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${meta.bg} ${meta.width} transition-all duration-500`} />
              </div>
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex gap-2">
            <button
              onClick={generate}
              disabled={!activeOptions}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-md shadow-orange-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={() => handleCopy()}
              disabled={!password}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                copied
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              disabled={!password}
              title="Download as .txt"
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Length Slider ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-gray-800">Password Length</span>
            </div>
            <span className="text-2xl font-extrabold text-orange-500 tabular-nums">{length}</span>
          </div>
          <input
            type="range"
            min={6}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-orange-500 h-2 rounded-full cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-gray-400 font-medium mt-2">
            <span>6 (Min)</span>
            <span>8</span>
            <span>16 (Recommended)</span>
            <span>32</span>
            <span>64 (Max)</span>
          </div>
        </div>

        {/* ── Character Options ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-gray-800">Character Types</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <OptionToggle
              label="Uppercase Letters"
              description="A B C … Z"
              checked={options.uppercase}
              onChange={() => toggleOption('uppercase')}
            />
            <OptionToggle
              label="Lowercase Letters"
              description="a b c … z"
              checked={options.lowercase}
              onChange={() => toggleOption('lowercase')}
            />
            <OptionToggle
              label="Numbers"
              description="0 1 2 … 9"
              checked={options.numbers}
              onChange={() => toggleOption('numbers')}
            />
            <OptionToggle
              label="Symbols"
              description="! @ # $ % ^ & * ( ) …"
              checked={options.symbols}
              onChange={() => toggleOption('symbols')}
            />
          </div>

          {!activeOptions && (
            <div className="mt-3 p-3 bg-red-50 rounded-xl text-xs text-red-600 font-medium text-center">
              ⚠️ Please enable at least one character type.
            </div>
          )}
        </div>

        {/* ── History ── */}
        {history.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <button
              onClick={() => setHistoryVisible((v) => !v)}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-gray-800">Recent Passwords</span>
                <span className="text-xs bg-orange-50 text-orange-500 font-bold px-2 py-0.5 rounded-full">{history.length}</span>
              </div>
              <span className={`text-xs text-gray-400 font-medium transition-all ${historyVisible ? '' : ''}`}>
                {historyVisible ? 'Hide' : 'Show'}
              </span>
            </button>

            {historyVisible && (
              <div className="mt-4 space-y-2">
                {history.map((item, i) => (
                  <div
                    key={item.ts}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-orange-200 transition-all"
                  >
                    <span className="font-mono text-xs text-gray-700 truncate select-all flex-1">{item.pwd}</span>
                    <button
                      onClick={() => handleCopy(item.pwd)}
                      className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                      title="Copy this password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setHistory([])}
                  className="w-full flex items-center justify-center gap-1.5 pt-1 text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear History
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Security Tips ── */}
        <div className="mt-5 p-5 rounded-2xl bg-orange-50/60 border border-orange-100">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Security Tips
          </p>
          <ul className="text-xs text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <span><strong className="text-gray-700">Use 16+ characters</strong> with mixed types for strong security.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <span><strong className="text-gray-700">Never reuse passwords</strong> across different accounts or services.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <span><strong className="text-gray-700">Store securely</strong> using a trusted password manager like Bitwarden or 1Password.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <span><strong className="text-gray-700">100% local:</strong> Passwords are generated using your browser's crypto API — nothing leaves your device.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
