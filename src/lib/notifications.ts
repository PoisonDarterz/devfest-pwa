/**
 * Utility helper to handle cross-platform Web & Mobile System Notifications.
 * 
 * Mobile Chrome (Android) forbids `new Notification()` in the window context
 * and strictly requires `ServiceWorkerRegistration.showNotification()`.
 * 
 * iOS (iPhone/iPad) requires the PWA to be installed to the Home Screen (iOS 16.4+)
 * and must use `ServiceWorkerRegistration.showNotification()`.
 */

export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isStandalonePWA: boolean;
  platformMessage: string;
  isIOS: boolean;
  isAndroid: boolean;
}

export interface NotificationResult {
  success: boolean;
  channel?: 'service-worker' | 'window-notification';
  message: string;
  error?: string;
  permission: NotificationPermission | 'unsupported';
}

const detectPlatform = () => {
  if (typeof window === 'undefined') {
    return { isIOS: false, isAndroid: false, isStandalonePWA: false };
  }
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isStandalonePWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  return { isIOS, isAndroid, isStandalonePWA };
};

export const getNotificationStatus = (): NotificationStatus => {
  const { isIOS, isAndroid, isStandalonePWA } = detectPlatform();
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  if (!isSupported) {
    if (isIOS) {
      return {
        isSupported: false,
        permission: 'unsupported',
        isStandalonePWA,
        isIOS,
        isAndroid,
        platformMessage:
          'On iPhone/iPad, tap Share > "Add to Home Screen" first to enable lockscreen notifications (iOS 16.4+).',
      };
    }
    return {
      isSupported: false,
      permission: 'unsupported',
      isStandalonePWA,
      isIOS,
      isAndroid,
      platformMessage: 'System notifications are not supported by this browser engine.',
    };
  }

  const permission = Notification.permission;

  let platformMessage = '';
  if (permission === 'granted') {
    platformMessage = 'Device notifications are active and ready.';
  } else if (permission === 'denied') {
    platformMessage =
      'Notifications are blocked in site settings. Tap the lock/tune icon next to the address bar to reset.';
  } else {
    platformMessage =
      'Enable notifications to get live updates before your saved sessions begin.';
  }

  return {
    isSupported: true,
    permission,
    isStandalonePWA,
    isIOS,
    isAndroid,
    platformMessage,
  };
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return 'denied';
  }
};

let cachedRegistration: ServiceWorkerRegistration | null = null;

export const setCachedServiceWorkerRegistration = (
  reg: ServiceWorkerRegistration | null | undefined
) => {
  if (reg) {
    cachedRegistration = reg;
  }
};

export const getCachedServiceWorkerRegistration = (): ServiceWorkerRegistration | null => {
  return cachedRegistration;
};

/**
 * Safely resolves the active Service Worker registration without hanging indefinitely.
 */
export const getActiveServiceWorkerRegistration = async (
  timeoutMs = 1500
): Promise<ServiceWorkerRegistration | null> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  // 1. Return cached registration if already established
  if (cachedRegistration) {
    return cachedRegistration;
  }

  // 2. Check current registration immediately
  try {
    const current = await navigator.serviceWorker.getRegistration();
    if (current) {
      cachedRegistration = current;
      return current;
    }
  } catch (e) {
    console.warn('[Notifications] getRegistration check failed:', e);
  }

  // 3. Check all active registrations for this origin
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations && registrations.length > 0) {
      const activeReg = registrations.find((r) => r.active) || registrations[0];
      if (activeReg) {
        cachedRegistration = activeReg;
        return activeReg;
      }
    }
  } catch (e) {
    console.warn('[Notifications] getRegistrations check failed:', e);
  }

  // 4. Race navigator.serviceWorker.ready with safety timeout
  try {
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), timeoutMs)
    );
    const reg = await Promise.race([readyPromise, timeoutPromise]);
    if (reg) {
      cachedRegistration = reg;
      return reg;
    }
  } catch (e) {
    console.warn('[Notifications] serviceWorker.ready timed out or failed:', e);
  }

  // 5. Fallback: attempt explicit registration with environment-aware path
  try {
    const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
    const manual = await navigator.serviceWorker.register(swUrl, { scope: '/' });
    if (manual) {
      cachedRegistration = manual;
      return manual;
    }
  } catch (e) {
    console.warn('[Notifications] Explicit SW register fallback failed:', e);
  }

  return null;
};

/**
 * Detailed notification sender returning exact diagnosis and status
 */
export const sendSystemNotificationDetailed = async (
  title: string,
  options?: NotificationOptions
): Promise<NotificationResult> => {
  const { isIOS, isAndroid } = detectPlatform();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      success: false,
      permission: 'unsupported',
      message: isIOS
        ? 'iOS requires installing this app to Home Screen before notifications work.'
        : 'Notification API is unsupported on this browser.',
      error: 'NO_NOTIFICATION_API',
    };
  }

  // Request permission if default
  let currentPerm = Notification.permission;
  if (currentPerm === 'default') {
    currentPerm = await requestNotificationPermission();
  }

  if (currentPerm !== 'granted') {
    return {
      success: false,
      permission: currentPerm,
      message:
        currentPerm === 'denied'
          ? 'Notification permission is denied in browser settings.'
          : 'Notification permission was dismissed.',
      error: 'PERMISSION_NOT_GRANTED',
    };
  }

  // Build fully qualified asset URLs for reliable background service worker fetching
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const defaultIcon = origin ? new URL('/pwa-192x192.png', origin).href : '/pwa-192x192.png';
  const iconUrl = options?.icon
    ? options.icon.startsWith('http')
      ? options.icon
      : new URL(options.icon, origin).href
    : defaultIcon;
  const badgeUrl = options?.badge
    ? options.badge.startsWith('http')
      ? options.badge
      : new URL(options.badge, origin).href
    : defaultIcon;

  // Use unique tag to prevent Android/Chrome from collapsing/suppressing subsequent alerts
  const uniqueTag =
    options?.tag ||
    `devfest-alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const notificationOptions: NotificationOptions = {
    icon: iconUrl,
    badge: badgeUrl,
    tag: uniqueTag,
    ...options,
  };

  // WebKit iOS does not support vibration or requireInteraction
  if (isIOS) {
    delete (notificationOptions as any).vibrate;
    delete (notificationOptions as any).requireInteraction;
  } else {
    if (!(notificationOptions as any).vibrate) {
      (notificationOptions as any).vibrate = [200, 100, 200];
    }
  }

  // A. Mobile Platforms (Android Chrome & iOS PWA strictly require Service Worker)
  if (isAndroid || isIOS) {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await getActiveServiceWorkerRegistration(1500);
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(title, notificationOptions as any);
          return {
            success: true,
            channel: 'service-worker',
            permission: 'granted',
            message: 'Notification sent successfully via Service Worker!',
          };
        }
      } catch (swErr: any) {
        console.warn('[Notifications] ServiceWorker showNotification error:', swErr);
        return {
          success: false,
          channel: 'service-worker',
          permission: 'granted',
          message: `Service Worker notification failed: ${swErr?.message || swErr}`,
          error: String(swErr?.message || swErr),
        };
      }
    }

    return {
      success: false,
      permission: 'granted',
      message: 'Could not find an active Service Worker to display mobile notification.',
      error: 'NO_ACTIVE_SERVICE_WORKER',
    };
  }

  // B. Desktop Platform: Fast-path service worker if already available, else instant window Notification
  if ('serviceWorker' in navigator && cachedRegistration) {
    try {
      if (typeof cachedRegistration.showNotification === 'function') {
        await cachedRegistration.showNotification(title, notificationOptions as any);
        return {
          success: true,
          channel: 'service-worker',
          permission: 'granted',
          message: 'Notification sent successfully via Service Worker!',
        };
      }
    } catch (e) {
      console.warn('[Notifications] Cached SW showNotification failed on desktop, falling back:', e);
    }
  }

  // Native desktop window Notification (instant, reliable, no SW timeout delay)
  try {
    new Notification(title, notificationOptions);
    return {
      success: true,
      channel: 'window-notification',
      permission: 'granted',
      message: 'Notification sent successfully via Desktop browser!',
    };
  } catch (err: any) {
    console.warn('[Notifications] Window Notification constructor failed:', err);
    // As last resort, try SW registration
    try {
      const reg = await getActiveServiceWorkerRegistration(800);
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notificationOptions as any);
        return {
          success: true,
          channel: 'service-worker',
          permission: 'granted',
          message: 'Notification sent successfully via Service Worker fallback!',
        };
      }
    } catch {}

    return {
      success: false,
      permission: 'granted',
      message: `Notification constructor failed: ${err?.message || err}`,
      error: String(err?.message || err),
    };
  }
};

/**
 * Standard simple notification sender returning boolean
 */
export const sendSystemNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<boolean> => {
  const result = await sendSystemNotificationDetailed(title, options);
  return result.success;
};
