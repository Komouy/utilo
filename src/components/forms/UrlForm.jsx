import React, { useState } from 'react';
import { Link, QrCode } from 'lucide-react';

export default function UrlForm({ onGenerate, defaultValue }) {
  const [url, setUrl] = useState(defaultValue || '');

  const handleChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    onGenerate(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let formatted = url.trim();
    if (formatted && !/^https?:\/\//i.test(formatted)) {
      formatted = 'https://' + formatted;
      setUrl(formatted);
    }
    onGenerate(formatted);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 font-semibold text-gray-900">
        <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
          <Link size={18} />
        </div>
        <span>Enter URL</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            WEBSITE URL / LINK
          </label>
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={handleChange}
            placeholder="https://example.com or example.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all text-gray-800"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
        >
          <QrCode size={18} />
          Generate QR Code
        </button>
      </form>
    </div>
  );
}
