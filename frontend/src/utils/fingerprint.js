import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise = null;

// Initialize FingerprintJS agent once
export const initFingerprint = () => {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
};

// Generate unique visitor ID
export const getVisitorFingerprint = async () => {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    return result.visitorId;
  } catch (err) {
    console.warn('FingerprintJS failed, falling back to local persistent token:', err);
    let fallbackId = localStorage.getItem('_poll_fp_id');
    if (!fallbackId) {
      fallbackId = 'fp_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('_poll_fp_id', fallbackId);
    }
    return fallbackId;
  }
};
