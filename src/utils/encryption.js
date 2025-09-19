const ENCRYPTION_KEY_LENGTH = 32;
const IV_LENGTH = 16;

function generateKey() {
  return crypto.getRandomValues(new Uint8Array(ENCRYPTION_KEY_LENGTH));
}

function generateIV() {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

async function importKey(keyData) {
  return await crypto.subtle.importKey('raw', keyData, { name: 'AES-CBC' }, false, [
    'encrypt',
    'decrypt'
  ]);
}

export async function encryptData(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Invalid data for encryption');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const key = generateKey();
  const iv = generateIV();

  const cryptoKey = await importKey(key);

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: iv }, cryptoKey, data);

  const encryptedArray = new Uint8Array(encrypted);
  const result = new Uint8Array(key.length + iv.length + encryptedArray.length);

  result.set(key, 0);
  result.set(iv, key.length);
  result.set(encryptedArray, key.length + iv.length);

  return btoa(String.fromCharCode(...result));
}

export async function decryptData(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Invalid encrypted data');
  }

  try {
    const data = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    const key = data.slice(0, ENCRYPTION_KEY_LENGTH);
    const iv = data.slice(ENCRYPTION_KEY_LENGTH, ENCRYPTION_KEY_LENGTH + IV_LENGTH);
    const encrypted = data.slice(ENCRYPTION_KEY_LENGTH + IV_LENGTH);

    const cryptoKey = await importKey(key);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      cryptoKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
}
