/**
 * Format functions for various QR Code types
 */

export const formatWifiQR = ({ ssid, password, security }) => {
  const escapeStr = (str) => (str || '').replace(/([\\;:,"])/g, '\\$1');
  let qrString = `WIFI:T:${security};S:${escapeStr(ssid)}`;
  if (password && security !== 'nopass') {
    qrString += `;P:${escapeStr(password)}`;
  }
  qrString += ';;';
  return qrString;
};

export const formatPhoneQR = (phoneNumber) => {
  return `tel:${phoneNumber.trim()}`;
};

export const formatEmailQR = (email, subject = '', body = '') => {
  let mailtoUrl = `mailto:${email.trim()}`;
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (params.length > 0) {
    mailtoUrl += `?${params.join('&')}`;
  }
  return mailtoUrl;
};

export const formatWhatsappQR = (phoneNumber, message = '') => {
  let cleaned = phoneNumber.trim().replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
  let whatsappUrl = `https://wa.me/${cleaned}`;
  if (message) {
    whatsappUrl += `?text=${encodeURIComponent(message)}`;
  }
  return whatsappUrl;
};

export const formatUrlQR = (url) => {
  let trimmed = url.trim();
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
};
