export interface NFCStatus {
  isSupported: boolean;
  message: string;
}

export const checkNFCSupport = (): NFCStatus => {
  if ('NDEFReader' in window) {
    return {
      isSupported: true,
      message: 'Web NFC is supported on Android Chrome.'
    };
  }
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    return {
      isSupported: false,
      message: 'iOS Safari limits Web NFC. Use Contact QR Scan or Share link instead.'
    };
  }

  return {
    isSupported: false,
    message: 'Web NFC is not available on this browser. Try Android Chrome.'
  };
};
