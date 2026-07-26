import React, { useRef, useState } from 'react';
import { Download, Copy, FileJson, Link as LinkIcon, Grid } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';

export default function QRPreview({ qrValue }) {
  const qrRef = useRef();
  const [selectedSize, setSelectedSize] = useState(512);
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);

  const sizes = [256, 512, 1024, 2048];

  const downloadQR = async (format) => {
    if (!qrRef.current || !qrValue) return;

    try {
      if (format === 'svg') {
        const svgElement = qrRef.current.querySelector('svg');
        if (svgElement) {
          const blob = new Blob([
            `<?xml version="1.0" encoding="utf-8"?>\n` +
            `<svg xmlns="http://www.w3.org/2000/svg" width="${selectedSize}" height="${selectedSize}" viewBox="0 0 256 256">\n` +
            `  <rect width="100%" height="100%" fill="${bgColor}"/>\n` +
            `  <g transform="translate(16, 16) scale(0.875)" fill="${qrColor}">\n` +
            `    ${svgElement.innerHTML}\n` +
            `  </g>\n` +
            `</svg>`
          ], { type: 'image/svg+xml;charset=utf-8' });

          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `qrcode-${selectedSize}px-${Date.now()}.svg`;
          link.click();
          URL.revokeObjectURL(link.href);
          return;
        }
      }

      const elem = qrRef.current;
      const elementWidth = elem.offsetWidth || 240;
      const ratio = selectedSize / elementWidth;

      const dataUrl = await toPng(elem, {
        pixelRatio: ratio > 0 ? ratio : 2,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qrcode-${selectedSize}px-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading QR:', error);
    }
  };

  const copyToClipboard = async () => {
    if (qrRef.current && qrValue) {
      try {
        const elem = qrRef.current;
        const elementWidth = elem.offsetWidth || 240;
        const ratio = selectedSize / elementWidth;

        const dataUrl = await toPng(elem, { pixelRatio: ratio });
        const blob = await fetch(dataUrl).then(res => res.blob());
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">QR CODE PREVIEW</div>
      
      <div className="relative flex justify-center items-center p-6 mb-6 max-w-[260px] mx-auto">
        {/* Frame corners styling */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-orange-500 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-orange-500 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-orange-500 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-orange-500 rounded-br-lg"></div>
        </div>
        
        <div 
          ref={qrRef} 
          className="p-5 rounded-2xl border-4 w-full flex items-center justify-center shadow-lg transition-all"
          style={{
            backgroundColor: bgColor,
            borderColor: bgColor === '#ffffff' ? '#f1f5f9' : bgColor,
          }}
        >
          {qrValue ? (
            <QRCode 
              value={qrValue} 
              size={180} 
              fgColor={qrColor}
              bgColor={bgColor}
              level="H" 
              style={{ height: "auto", maxWidth: "100%", width: "100%", display: "block" }} 
            />
          ) : (
            <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-gray-400 text-center">
              <Grid className="w-10 h-10 opacity-30 mb-2 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">QR Code preview will appear here</span>
            </div>
          )}
        </div>
      </div>

      {qrValue && (
        <div className="flex flex-col items-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-orange-100">
            <LinkIcon size={12} />
            QR CONTENT
          </div>
          <div className="text-gray-500 text-xs font-mono truncate max-w-full px-4">{qrValue}</div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        <button 
          onClick={() => downloadQR('png')} 
          disabled={!qrValue}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Download size={16} />
          PNG
        </button>
        <button 
          onClick={() => downloadQR('svg')} 
          disabled={!qrValue}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <FileJson size={16} />
          SVG
        </button>
        <button 
          onClick={copyToClipboard} 
          disabled={!qrValue}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Copy size={16} />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="border-t border-gray-100 pt-5 mb-5 space-y-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">COLORS</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-xs text-gray-500 mb-1.5 font-medium">QR Color</span>
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-gray-200 bg-gray-50">
              <input 
                type="color" 
                value={qrColor} 
                onChange={(e) => setQrColor(e.target.value)} 
                className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono uppercase text-gray-700 font-semibold">{qrColor}</span>
            </div>
          </div>
          <div>
            <span className="block text-xs text-gray-500 mb-1.5 font-medium">Background Color</span>
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-gray-200 bg-gray-50">
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)} 
                className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono uppercase text-gray-700 font-semibold">{bgColor}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">EXPORT SIZE</div>
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                selectedSize === size
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
