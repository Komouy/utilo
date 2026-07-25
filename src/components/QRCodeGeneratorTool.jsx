import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import TabSelector from './TabSelector';
import QRPreview from './QRPreview';
import UrlForm from './forms/UrlForm';
import WifiForm from './forms/WifiForm';
import PhoneForm from './forms/PhoneForm';
import EmailForm from './forms/EmailForm';
import WhatsappForm from './forms/WhatsappForm';

export default function QRCodeGeneratorTool({ onBack }) {
  const [activeTab, setActiveTab] = useState('url');
  const [qrValue, setQrValue] = useState('');

  const renderForm = () => {
    switch (activeTab) {
      case 'url':
        return <UrlForm onGenerate={setQrValue} defaultValue={qrValue} />;
      case 'wifi':
        return <WifiForm onGenerate={setQrValue} />;
      case 'phone':
        return <PhoneForm onGenerate={setQrValue} />;
      case 'email':
        return <EmailForm onGenerate={setQrValue} />;
      case 'whatsapp':
        return <WhatsappForm onGenerate={setQrValue} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <button 
        onClick={onBack} 
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-all mb-8 shadow-sm"
      >
        <ArrowLeft size={16} />
        Back to All Tools
      </button>

      {/* Header Section */}
      <div className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 border border-orange-100">
          <Sparkles size={14} />
          QR CODE GENERATOR
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          Create <span className="text-orange-500">QR Codes</span> Quickly & Easily
        </h1>
        <p className="text-gray-500 text-base max-w-2xl">
          Choose a content type (URL, Wi-Fi, Phone, Email, WhatsApp), customize colors and size, then download for free.
        </p>
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-4">
          <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
          {renderForm()}
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-5">
          <QRPreview qrValue={qrValue} />
        </div>
      </div>
    </div>
  );
}
