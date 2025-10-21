const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Generate a random salt
 * @returns {string} Hex-encoded salt
 */
const generateSalt = () => {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
};

/**
 * Derive an encryption key from a password and salt using PBKDF2
 * @param {string} password - Password or user ID
 * @param {string} salt - Salt (hex-encoded)
 * @param {number} iterations - Number of iterations (default: 100000)
 * @returns {Buffer} Derived key
 */
const deriveKey = (password, salt, iterations = ITERATIONS) => {
  return crypto.pbkdf2Sync(
    password,
    salt,
    iterations,
    KEY_LENGTH,
    'sha256'
  );
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string} plaintext - Text to encrypt
 * @param {Buffer|string} key - Encryption key (Buffer or hex string)
 * @returns {Object} Encrypted data with iv and authTag
 */
const encrypt = (plaintext, key) => {
  try {
    // Convert key to Buffer if it's a hex string
    const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex');

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Erro ao criptografar dados');
  }
};

/**
 * Decrypt data using AES-256-GCM
 * @param {Object} encryptedData - Object with encrypted, iv, and authTag
 * @param {Buffer|string} key - Encryption key (Buffer or hex string)
 * @returns {string} Decrypted plaintext
 */
const decrypt = (encryptedData, key) => {
  try {
    // Convert key to Buffer if it's a hex string
    const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      keyBuffer,
      Buffer.from(encryptedData.iv, 'hex')
    );

    // Set authentication tag
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    // Decrypt
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Erro ao descriptografar dados');
  }
};

/**
 * Encryption Manager for handling user-specific encryption
 */
class EncryptionManager {
  constructor(userId, userSalt) {
    this.userId = userId;
    this.userSalt = userSalt;
    this.masterKey = null;
    this.secondaryKey = null;
  }

  /**
   * Initialize master key from user ID and salt
   */
  initMasterKey() {
    const masterPassword = this.userId + process.env.ENCRYPTION_MASTER_KEY;
    this.masterKey = deriveKey(masterPassword, this.userSalt);
  }

  /**
   * Set secondary key from user PIN
   * @param {string} pin - User PIN
   */
  setSecondaryKey(pin) {
    if (pin) {
      this.secondaryKey = deriveKey(pin, this.userSalt, 150000);
    }
  }

  /**
   * Encrypt data
   * @param {string} plaintext - Data to encrypt
   * @param {boolean} useSecondary - Use secondary key if available
   * @returns {Object} Encrypted data
   */
  encryptData(plaintext, useSecondary = false) {
    if (!this.masterKey) {
      this.initMasterKey();
    }

    const key = (useSecondary && this.secondaryKey) ? this.secondaryKey : this.masterKey;
    return encrypt(plaintext, key);
  }

  /**
   * Decrypt data
   * @param {Object} encryptedData - Encrypted data object
   * @param {boolean} useSecondary - Use secondary key if available
   * @returns {string} Decrypted plaintext
   */
  decryptData(encryptedData, useSecondary = false) {
    if (!this.masterKey) {
      this.initMasterKey();
    }

    const key = (useSecondary && this.secondaryKey) ? this.secondaryKey : this.masterKey;
    return decrypt(encryptedData, key);
  }
}

/**
 * Hash data using SHA-256 (for user_id hashing in analytics)
 * @param {string} data - Data to hash
 * @param {string} salt - Salt for hashing
 * @returns {string} Hex-encoded hash
 */
const hashData = (data, salt = '') => {
  return crypto
    .createHash('sha256')
    .update(data + salt)
    .digest('hex');
};

/**
 * Generate a secure random token
 * @param {number} length - Length of token in bytes (default: 32)
 * @returns {string} Hex-encoded token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  generateSalt,
  deriveKey,
  encrypt,
  decrypt,
  EncryptionManager,
  hashData,
  generateToken
};
