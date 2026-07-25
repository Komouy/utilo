/**
 * Format functions untuk berbagai tipe QR Code
 */

export const formatWifiQR = ({ ssid, password, security }) => {
  let qrString = `WIFI:T:${security};S:${ssid}`;
  if (password) {
    qrString += `;P:${password}`;
  }
  qrString += ';;';
  return qrString;
};

export const formatPhoneQR = (phoneNumber) => {
  return `tel:${phoneNumber}`;
};

export const formatEmailQR = (email, subject = '', body = '') => {
  let mailtoUrl = `mailto:${email}`;
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (params.length > 0) {
    mailtoUrl += `?${params.join('&')}`;
  }
  return mailtoUrl;
};

export const formatWhatsappQR = (phoneNumber, message = '') => {
  let whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`;
  if (message) {
    whatsappUrl += `?text=${encodeURIComponent(message)}`;
  }
  return whatsappUrl;
};

export const formatUrlQR = (url) => {
  return url;
};
