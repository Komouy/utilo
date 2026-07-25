import React, { useState } from 'react';
import { MessageCircle, QrCode } from 'lucide-react';

export default function WhatsappForm({ onGenerate }) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phone) {
      const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
      onGenerate(url);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 font-semibold text-gray-900">
        <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
          <MessageCircle size={18} />
        </div>
        <span>Enter WhatsApp Details</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">WhatsApp Number</label>
          <input
            type="tel"
            placeholder="18001234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all text-gray-800"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message (Optional)</label>
          <textarea
            placeholder="Hello, I would like to inquire..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all text-gray-800 resize-none"
            rows={3}
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
