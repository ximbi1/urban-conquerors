import { useState, useEffect, useCallback } from 'react';
import { Coordinate } from '@/types/territory';
import { toast } from 'sonner';

interface GeolocationState {
  currentLocation: Coordinate | null;
  accuracy: number | null;
  isTracking: boolean;
  permissionGranted: boolean;
  error: string | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    currentLocation: null,
    accuracy: null,
    isTracking: false,
    permissionGranted: false,
    error: null,
  });
  const [watchId, setWatchId] = useState<number | null>(null);

  const requestPermission = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      const error = 'Geolocalización no disponible en este dispositivo';
      setState(prev => ({ ...prev, error, permissionGranted: false }));
      toast.error(error);
      return false;
    }

    try {
      // Intentar obtener la ubicación para solicitar permisos
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      setState(prev => ({
        ...prev,
        currentLocation: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        accuracy: position.coords.accuracy,
        permissionGranted: true,
        error: null,
      }));
      toast.success('Ubicación activada');
      return true;
    } catch (error: any) {
      let errorMessage = 'No se pudo obtener tu ubicación';
      if (error.code === 1) {
        errorMessage = 'Permiso de ubicación denegado. Por favor actívalo en la configuración.';
      } else if (error.code === 2) {
        errorMessage = 'Ubicación no disponible. Verifica tu conexión GPS.';
      } else if (error.code === 3) {
        errorMessage = 'Tiempo de espera agotado obteniendo la ubicación.';
      }
      
      setState(prev => ({ ...prev, error: errorMessage, permissionGranted: false }));
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!state.permissionGranted) {
      toast.error('Primero debes conceder permisos de ubicación');
      return;
    }

    if (watchId !== null) {
      return; // Ya está rastreando
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setState(prev => ({
          ...prev,
          currentLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
          isTracking: true,
          error: null,
        }));
      },
      (error) => {
        console.error('Error en watchPosition:', error);
        setState(prev => ({
          ...prev,
          error: 'Error obteniendo ubicación en tiempo real',
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    setWatchId(id);
  }, [state.permissionGranted, watchId]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setState(prev => ({ ...prev, isTracking: false }));
    }
  }, [watchId]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    ...state,
    requestPermission,
    startTracking,
    stopTracking,
  };
};
