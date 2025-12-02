import { useState, useEffect } from 'react';
import { Coordinate } from '@/types/territory';
import { calculatePolygonArea, isPolygonClosed, calculateDistance } from '@/utils/geoCalculations';

export interface RunPrediction {
  predictedArea: number;
  isCloseable: boolean;
  distanceToClose: number;
  suggestedDirection?: 'close' | 'continue';
  speedStatus: 'valid' | 'too_slow' | 'too_fast';
}

const MIN_RUNNING_SPEED = 2; // m/s (7.2 km/h)
const MAX_RUNNING_SPEED = 8; // m/s (28.8 km/h)

export const useRunPrediction = (
  runPath: Coordinate[],
  currentLocation: Coordinate | null,
  isRunning: boolean
): RunPrediction => {
  const [prediction, setPrediction] = useState<RunPrediction>({
    predictedArea: 0,
    isCloseable: false,
    distanceToClose: 0,
    speedStatus: 'valid',
  });

  useEffect(() => {
    if (!isRunning || runPath.length < 3 || !currentLocation) {
      setPrediction({
        predictedArea: 0,
        isCloseable: false,
        distanceToClose: 0,
        speedStatus: 'valid',
      });
      return;
    }

    // Calcular si el polígono está cerca de cerrarse
    const distanceToStart = calculateDistance(currentLocation, runPath[0]);
    const isCloseable = distanceToStart <= 100; // 100 metros para considerar "cerca"

    // Predecir área si se cierra ahora
    let predictedArea = 0;
    if (runPath.length >= 3) {
      const closedPath = isCloseable ? runPath : [...runPath, currentLocation];
      predictedArea = calculatePolygonArea(closedPath);
    }

    // Calcular velocidad promedio de los últimos puntos
    let speedStatus: 'valid' | 'too_slow' | 'too_fast' = 'valid';
    if (runPath.length >= 2) {
      const lastPoints = runPath.slice(-3);
      let totalSpeed = 0;
      let speedCount = 0;

      for (let i = 1; i < lastPoints.length; i++) {
        const distance = calculateDistance(lastPoints[i - 1], lastPoints[i]);
        const timeDiff = 5; // Asumimos 5 segundos entre puntos (ajustar según frecuencia real)
        const speed = distance / timeDiff;
        totalSpeed += speed;
        speedCount++;
      }

      if (speedCount > 0) {
        const avgSpeed = totalSpeed / speedCount;
        if (avgSpeed < MIN_RUNNING_SPEED) {
          speedStatus = 'too_slow';
        } else if (avgSpeed > MAX_RUNNING_SPEED) {
          speedStatus = 'too_fast';
        }
      }
    }

    // Sugerir acción
    let suggestedDirection: 'close' | 'continue' | undefined;
    if (isCloseable && predictedArea > 10000) {
      // Si está cerca del inicio y el área es significativa (>10k m²)
      suggestedDirection = 'close';
    } else if (runPath.length >= 3) {
      suggestedDirection = 'continue';
    }

    setPrediction({
      predictedArea,
      isCloseable,
      distanceToClose: distanceToStart,
      suggestedDirection,
      speedStatus,
    });
  }, [runPath, currentLocation, isRunning]);

  return prediction;
};
