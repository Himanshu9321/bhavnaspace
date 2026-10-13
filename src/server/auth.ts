// Web Crypto HMAC-SHA256 token helper compatible with Cloudflare Workers & Node.js 18+

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(input));
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = bufferToBase64Url(enc.encode(payloadStr));

  const key = await getHmacKey(secret);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  const signatureB64 = bufferToBase64Url(signatureBuffer);

  return `${payloadB64}.${signatureB64}`;
}

export async function verifyToken<T = Record<string, unknown>>(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: T; error?: string }> {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token missing' };
    }
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Malformed token structure' };
    }
    const [payloadB64, signatureB64] = parts;
    const enc = new TextEncoder();

    const key = await getHmacKey(secret);
    const signatureBytes = base64UrlToBuffer(signatureB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      enc.encode(payloadB64)
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payloadBytes = base64UrlToBuffer(payloadB64);
    const dec = new TextDecoder();
    const payload = JSON.parse(dec.decode(payloadBytes)) as T & { exp?: number };

    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: (err as Error).message || 'Token verification failed' };
  }
}

export function generateOtp(): string {
  // 6-digit random number between 100000 and 999999
  const randomArray = new Uint32Array(1);
  crypto.getRandomValues(randomArray);
  const code = (100000 + (randomArray[0] % 900000)).toString();
  return code;
}
