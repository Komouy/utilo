import React, { useState } from 'react';
import { formatWifiQR } from '../../utils/qrFormatters';
import { Wifi, QrCode } from 'lucide-react';

export default function WifiForm({ onGenerate }) {
  const [wifi, setWifi] = useState({ ssid: '', password: '', security: 'WPA' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (wifi.ssid) {
      const qrString = formatWifiQR(wifi);
      onGenerate(qrString);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 font-semibold text-gray-900">
        <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
          <Wifi size={18} />
        </div>
        <span>Enter Wi-Fi Details</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Network Name (SSID)</label>
          <input
            type="text"
            placeholder="Your Wi-Fi Name"
            value={wifi.ssid}
            onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all text-gray-800"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            placeholder="Wi-Fi Password"
            value={wifi.password}
            onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all text-gray-800"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Security Type</label>
          <select
            value={wifi.security}
            onChange={(e) => setWifi({ ...wifi, security: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all text-gray-800 bg-white"
          >
            <option value="WPA">WPA/WPA2/WPA3</option>
            <option value="WEP">WEP</option>
            <option value="nopass">No Password</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 mt-2">
          <QrCode size={18} />
          Generate QR Code
        </button>
      </form>
    </div>
  );
}
