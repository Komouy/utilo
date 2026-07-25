import React from 'react';
import { Link, Wifi, Phone, Mail, MessageCircle } from 'lucide-react';

export default function TabSelector({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'url', label: 'URL', icon: Link },
    { id: 'wifi', label: 'WI-FI', icon: Wifi },
    { id: 'phone', label: 'Phone', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap border ${
              isActive
                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
