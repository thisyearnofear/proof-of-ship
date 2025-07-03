import CryptoJS from 'crypto-js';

// Use a consistent secret key from environment or fallback
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_SECRET || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!key) {
    throw new Error('No encryption key available. Set ENCRYPTION_SECRET environment variable.');
  }
  return key;
};

/**
 * Encrypt sensitive data like GitHub tokens
 * @param {string} data - Data to encrypt
 * @returns {string} - Encrypted string
 */
export const encryptData = (data) => {
  if (!data) return null;
  
  try {
    const key = getEncryptionKey();
    return CryptoJS.AES.encrypt(data, key).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data like GitHub tokens
 * @param {string} encryptedData - Encrypted string
 * @returns {string} - Decrypted data
 */
export const decryptData = (encryptedData) => {
  if (!encryptedData) return null;
  
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Decryption resulted in empty string');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash data for verification purposes
 * @param {string} data - Data to hash
 * @returns {string} - SHA256 hash
 */
export const hashData = (data) => {
  return CryptoJS.SHA256(data).toString();
};
