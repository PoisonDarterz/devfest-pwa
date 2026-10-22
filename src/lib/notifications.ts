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
 * Safely resolves an ACTIVE Service Worker registration without hanging indefinitely.
 */
export const getActiveServiceWorkerRegistration = async (
  timeoutMs = 3000
): Promise<ServiceWorkerRegistration | null> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  // 1. Return cached registration if it already has an active worker
  if (cachedRegistration && cachedRegistration.active) {
    return cachedRegistration;
  }

  // 2. Check current registration immediately
  try {
    const current = await navigator.serviceWorker.getRegistration();
    if (current && current.active) {
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
      const activeReg = registrations.find((r) => r.active);
      if (activeReg) {
        cachedRegistration = activeReg;
        return activeReg;
      }
    }
  } catch (e) {
    console.warn('[Notifications] getRegistrations check failed:', e);
  }

  // 4. Ensure SW is registered before awaiting .ready
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (!existing) {
      const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
      await navigator.serviceWorker.register(swUrl, { scope: '/' });
    }
  } catch (e) {
    console.warn('[Notifications] Explicit SW register attempt failed:', e);
  }

  // 5. Race navigator.serviceWorker.ready with safety timeout
  try {
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), timeoutMs)
    );
    const reg = await Promise.race([readyPromise, timeoutPromise]);
    if (reg && reg.active) {
      cachedRegistration = reg;
      return reg;
    }
  } catch (e) {
    console.warn('[Notifications] serviceWorker.ready timed out or failed:', e);
  }

  return cachedRegistration;
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
        ? 'On iPhone/iPad, tap Share > "Add to Home Screen" and open the installed app to enable notifications.'
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
          ? 'Notification permission is blocked in browser settings. Click the lock/tune icon in your address bar to allow Notifications.'
          : 'Notification permission was dismissed.',
      error: 'PERMISSION_NOT_GRANTED',
    };
  }

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

  const uniqueTag =
    options?.tag ||
    `devfest-alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const swOptions: Record<string, any> = {
    ...options,
    body: options?.body || '',
    icon: iconUrl,
    badge: badgeUrl,
    tag: uniqueTag,
  };

  if (isAndroid) {
    swOptions.vibrate = [200, 100, 200];
  } else {
    delete swOptions.vibrate;
    delete swOptions.requireInteraction;
  }

  // A. Mobile Platforms (Android Chrome & iOS PWA strictly require Service Worker)
  if (isAndroid || isIOS) {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await getActiveServiceWorkerRegistration(3000);
        if (registration && typeof registration.showNotification === 'function') {
          try {
            await registration.showNotification(title, swOptions);
          } catch {
            // Retry with minimal options if browser rejected extra fields
            await registration.showNotification(title, {
              body: options?.body || '',
              tag: uniqueTag,
            });
          }
          return {
            success: true,
            channel: 'service-worker',
            permission: 'granted',
            message: 'Notification sent! Check your device notification drawer.',
          };
        }
      } catch (swErr: any) {
        console.warn('[Notifications] Mobile ServiceWorker showNotification error:', swErr);
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
      message: 'Service Worker is still initializing. Please wait 2 seconds and tap again.',
      error: 'NO_ACTIVE_SERVICE_WORKER',
    };
  }

  // B. Desktop Platform: Use native window Notification first (most reliable on macOS/Windows desktop browsers),
  // and also fall back to Service Worker if window Notification throws.
  try {
    const windowNotifOptions: NotificationOptions = {
      body: options?.body || '',
      icon: iconUrl,
      tag: uniqueTag,
      data: options?.data,
    };
    const notif = new Notification(title, windowNotifOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return {
      success: true,
      channel: 'window-notification',
      permission: 'granted',
      message: 'Notification sent! (If not visible, check macOS/Windows Focus / Do Not Disturb & browser notification settings).',
    };
  } catch (err: any) {
    console.warn('[Notifications] Window Notification constructor failed, trying Service Worker:', err);
    try {
      const reg = await getActiveServiceWorkerRegistration(2000);
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, swOptions);
        return {
          success: true,
          channel: 'service-worker',
          permission: 'granted',
          message: 'Notification sent via Service Worker!',
        };
      }
    } catch (swErr: any) {
      return {
        success: false,
        permission: 'granted',
        message: `Notification failed: ${swErr?.message || err?.message || err}`,
        error: String(swErr?.message || err?.message || err),
      };
    }

    return {
      success: false,
      permission: 'granted',
      message: `Notification failed: ${err?.message || err}`,
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
