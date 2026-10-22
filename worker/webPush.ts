/**
 * Web Standard RFC 8291 (aes128gcm) + RFC 8292 (VAPID ES256) Web Push implementation
 * Built using native Web Crypto API (`crypto.subtle`) and `fetch` for Cloudflare Workers.
 */

export const DEFAULT_VAPID_PUBLIC_KEY =
  'BGlGZhNt2_kafTHuVXzGfz7OqZBaLCHJK3bsRuIKlqwWb5K7AePOC5MvOqdznc_7uTcEk7mZofGaAwIf6AUvjls';
export const DEFAULT_VAPID_PRIVATE_KEY =
  '2089JZ9OAReh0uN5c-vHKsAIbebAHpMzuYVKzueSm5w';
export const DEFAULT_VAPID_SUBJECT = 'mailto:organizers@devfest.kl';

export interface StoredPushSubscription {
  id: string;
  user_email: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  created_at: string;
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes as any,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, data as any);
  return new Uint8Array(sig);
}

async function hkdfExtractAndExpand(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const prk = await hmacSha256(salt, ikm);
  const infoWithCounter = concatUint8Arrays(info, new Uint8Array([1]));
  const okm = await hmacSha256(prk, infoWithCounter);
  return okm.slice(0, length);
}

/**
 * Generates RFC 8292 VAPID Authorization header (`vapid t=..., k=...`)
 */
async function createVapidAuthHeader(
  endpoint: string,
  vapidSubject: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const headerObj = { typ: 'JWT', alg: 'ES256' };
  const payloadObj = { aud: audience, exp, sub: vapidSubject };

  const encoder = new TextEncoder();
  const unsignedToken =
    `${uint8ArrayToBase64Url(encoder.encode(JSON.stringify(headerObj)))}.` +
    `${uint8ArrayToBase64Url(encoder.encode(JSON.stringify(payloadObj)))}`;

  const pubBytes = base64UrlToUint8Array(vapidPublicKey);
  // Uncompressed P-256 point: 0x04 || x (32 bytes) || y (32 bytes)
  const x = uint8ArrayToBase64Url(pubBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(pubBytes.slice(33, 65));
  const d = uint8ArrayToBase64Url(base64UrlToUint8Array(vapidPrivateKey));

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d,
    ext: true,
  };

  const signingKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    encoder.encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${uint8ArrayToBase64Url(new Uint8Array(signatureBuffer))}`;
  return `vapid t=${jwt}, k=${vapidPublicKey}`;
}

/**
 * Encrypts a push notification payload according to RFC 8291 (aes128gcm)
 */
async function encryptWebPushPayload(
  plaintext: string,
  clientP256dhBase64: string,
  clientAuthBase64: string
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const uaPublicBytes = base64UrlToUint8Array(clientP256dhBase64);
  const authSecretBytes = base64UrlToUint8Array(clientAuthBase64);

  // 1. Import subscriber's P-256 public key
  const uaPublicKey = await crypto.subtle.importKey(
    'raw',
    uaPublicBytes as any,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // 2. Generate ephemeral P-256 keypair for sender (application server)
  const asKeyPair = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  )) as any;

  const asPublicBuffer = await crypto.subtle.exportKey('raw', asKeyPair.publicKey);
  const asPublicBytes = new Uint8Array(asPublicBuffer);

  // 3. Compute shared ECDH secret
  const sharedSecretBuffer = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: uaPublicKey },
    asKeyPair.privateKey,
    256
  );
  const sharedSecretBytes = new Uint8Array(sharedSecretBuffer);

  // 4. Derive IKM via HKDF-SHA-256:
  // key_info = "WebPush: info" || 0x00 || ua_public || as_public
  const keyInfo = concatUint8Arrays(
    encoder.encode('WebPush: info\0'),
    uaPublicBytes,
    asPublicBytes
  );
  const ikm = await hkdfExtractAndExpand(authSecretBytes, sharedSecretBytes, keyInfo, 32);

  // 5. Generate random 16-byte salt for Content-Encoding: aes128gcm
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 6. Derive 16-byte Content Encryption Key (CEK) and 12-byte Nonce
  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = encoder.encode('Content-Encoding: nonce\0');

  const cekBytes = await hkdfExtractAndExpand(salt, ikm, cekInfo, 16);
  const nonceBytes = await hkdfExtractAndExpand(salt, ikm, nonceInfo, 12);

  // 7. Pad plaintext with 0x02 delimiter byte
  const plaintextBytes = encoder.encode(plaintext);
  const paddedPlaintext = concatUint8Arrays(plaintextBytes, new Uint8Array([2]));

  // 8. Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey(
    'raw',
    cekBytes as any,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonceBytes as any, tagLength: 128 },
    aesKey,
    paddedPlaintext as any
  );
  const ciphertextBytes = new Uint8Array(ciphertextBuffer);

  // 9. Build aes128gcm binary header:
  // salt (16B) || rs (4B uint32 BE = 4096) || idlen (1B = 65) || keyid (as_public, 65B)
  const header = new Uint8Array(16 + 4 + 1 + asPublicBytes.length);
  header.set(salt, 0);
  const view = new DataView(header.buffer);
  view.setUint32(16, 4096, false);
  header[20] = asPublicBytes.length;
  header.set(asPublicBytes, 21);

  return concatUint8Arrays(header, ciphertextBytes);
}

/**
 * Dispatches an encrypted RFC 8291 + RFC 8292 Web Push notification to a single subscription endpoint
 */
export async function sendSingleWebPush(
  sub: StoredPushSubscription,
  payloadString: string,
  vapidConfig: {
    publicKey: string;
    privateKey: string;
    subject: string;
  }
): Promise<{ ok: boolean; status: number; body?: string }> {
  const [authHeader, encryptedBody] = await Promise.all([
    createVapidAuthHeader(
      sub.endpoint,
      vapidConfig.subject,
      vapidConfig.publicKey,
      vapidConfig.privateKey
    ),
    encryptWebPushPayload(payloadString, sub.p256dh, sub.auth),
  ]);

  const response = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(encryptedBody.byteLength),
      TTL: '86400',
      Urgency: 'high',
    },
    body: encryptedBody as any,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    return { ok: false, status: response.status, body: errText };
  }

  return { ok: true, status: response.status };
}
