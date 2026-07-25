import React, { useState } from 'react';
import { Mail, QrCode } from 'lucide-react';

export default function EmailForm({ onGenerate }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      onGenerate(`mailto:${email}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 font-semibold text-gray-900">
        <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
          <Mail size={18} />
        </div>
        <span>Enter Email Address</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
          <input
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all text-gray-800"
            required
          />
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2">
          <QrCode size={18} />
          Generate QR Code
        </button>
      </form>
    </div>
  );
}
