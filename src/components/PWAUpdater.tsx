import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

const PWAUpdater = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [needRefresh, setNeedRefresh] = useState(false);

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  useEffect(() => {
    if (needRefresh) {
      toast.info('Hay una nueva versión disponible', {
        action: {
          label: 'Actualizar',
          onClick: () => {
            updateServiceWorker();
            setNeedRefresh(false);
          },
        },
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};

export default PWAUpdater;
