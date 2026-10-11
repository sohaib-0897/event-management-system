const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
export function newSalt() { return hex(crypto.getRandomValues(new Uint8Array(16))); }
export async function passwordVerifier(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const result = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return hex(new Uint8Array(result));
}
