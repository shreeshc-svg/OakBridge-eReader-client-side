function generateUUID(): string {
     if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
          return window.crypto.randomUUID();
     }
     // Fallback UUID generator
     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
     });
}

export function getDeviceId(): string {
     if (typeof window === 'undefined') return 'unknown_device';
     let deviceId = localStorage.getItem('reader_device_id');
     if (!deviceId) {
          deviceId = generateUUID();
          localStorage.setItem('reader_device_id', deviceId);
     }
     return deviceId;
}

export function getDeviceName(): string {
     if (typeof window === 'undefined') return 'Unknown Device';
     const ua = navigator.userAgent;
     
     let os = 'Unknown OS';
     if (/windows/i.test(ua)) os = 'Windows';
     else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
     else if (/android/i.test(ua)) os = 'Android';
     else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
     else if (/linux/i.test(ua)) os = 'Linux';
     
     let browser = 'Unknown Browser';
     if (/edg/i.test(ua)) browser = 'Edge';
     else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) browser = 'Chrome';
     else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
     else if (/firefox/i.test(ua)) browser = 'Firefox';
     else if (/opera|opr/i.test(ua)) browser = 'Opera';
     
     return `${browser} on ${os}`;
}
