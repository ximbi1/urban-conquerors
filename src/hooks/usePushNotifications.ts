import { useEffect } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

let cachedVapidKey: string | null = null;

const getVapidPublicKey = async (): Promise<string | null> => {
  if (cachedVapidKey) return cachedVapidKey;
  
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    if (error || !data?.vapidPublicKey) {
      console.warn('Could not fetch VAPID key:', error);
      return null;
    }
    cachedVapidKey = data.vapidPublicKey;
    return cachedVapidKey;
  } catch (err) {
    console.error('Error fetching VAPID key:', err);
    return null;
  }
};

export const usePushNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const registerPush = async () => {
      if (!user) return;
      if (Capacitor.isNativePlatform()) {
        cleanup = await registerNativePush(user.id);
      } else {
        await registerWebPush(user.id);
      }
    };

    registerPush();

    return () => {
      cleanup?.();
    };
  }, [user]);
};

const registerNativePush = async (userId: string) => {
  const listenerHandles: PluginListenerHandle[] = [];
  try {
    const checkResult = await PushNotifications.checkPermissions();
    if (checkResult.receive !== 'granted') {
      const requestResult = await PushNotifications.requestPermissions();
      if (requestResult.receive !== 'granted') {
        toast.error('Permiso de notificaciones nativas denegado');
        return;
      }
    }

    listenerHandles.push(
      await PushNotifications.addListener('registration', async (token) => {
        try {
          await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            endpoint: token.value,
            p256dh: '',
            auth: '',
            expiration_time: null,
          });
          toast.success('Notificaciones nativas activadas');
        } catch (error) {
          console.error('Error guardando token nativo', error);
        }
      })
    );

    listenerHandles.push(
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Error registrando push nativo', error);
        toast.error('Error registrando notificaciones nativas');
      })
    );

    listenerHandles.push(
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        if (notification?.title) {
          toast(notification.title, { description: notification.body });
        }
      })
    );

    listenerHandles.push(
      await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
        const notification = event.notification;
        if (notification?.title) {
          toast(notification.title, { description: notification.body });
        }
      })
    );

    await PushNotifications.register();
  } catch (error) {
    console.error('Error general registrando push nativo', error);
    toast.error('No se pudieron activar las notificaciones nativas');
  }

  return () => {
    listenerHandles.forEach((handle) => handle.remove());
  };
};

const registerWebPush = async (userId: string) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.info('Web Push not supported in this browser');
    return;
  }

  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) {
    console.warn('VAPID key not available, Web Push disabled');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('Push permission not granted');
      return;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription = existingSubscription || (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    }));

    const subscriptionJson = subscription.toJSON();
    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: subscriptionJson.endpoint || '',
      p256dh: subscriptionJson.keys?.p256dh || '',
      auth: subscriptionJson.keys?.auth || '',
      expiration_time: subscriptionJson.expirationTime || null,
    });
    toast.success('Notificaciones activadas');
  } catch (error) {
    console.error('Error registering web push notifications', error);
    toast.error('No se pudieron activar las notificaciones push');
  }
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
