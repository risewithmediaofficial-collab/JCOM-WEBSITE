const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_change_in_production_min_32_chars';

// Encrypt sensitive data
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(data.toString(), ENCRYPTION_KEY).toString();
};

// Decrypt sensitive data
const decryptData = (encryptedData) => {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return decrypted.toString(CryptoJS.enc.Utf8);
};

module.exports = {
  encryptData,
  decryptData
};
