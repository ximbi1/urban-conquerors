import { Coordinate } from '@/types/territory';
import { calculateDistance, calculatePathDistance } from './geoCalculations';

// Constantes de validación
const MAX_RUNNING_SPEED_KMH = 25; // 25 km/h es prácticamente velocidad profesional
const MIN_RUNNING_PACE_MIN_KM = 3; // 3 min/km es ritmo de élite
const GPS_ACCURACY_THRESHOLD = 20; // Rechazar puntos con precisión > 20m
const MIN_POINT_DISTANCE = 5; // Distancia mínima entre puntos en metros
const MAX_POINT_DISTANCE = 100; // Distancia máxima entre puntos consecutivos

export interface GPSPoint extends Coordinate {
  accuracy?: number;
  timestamp?: number;
}

// Filtrar puntos GPS por precisión
export const filterGPSPointsByAccuracy = (
  points: GPSPoint[],
  maxAccuracy: number = GPS_ACCURACY_THRESHOLD
): Coordinate[] => {
  return points
    .filter(point => !point.accuracy || point.accuracy <= maxAccuracy)
    .map(({ lat, lng }) => ({ lat, lng }));
};

// Detectar velocidades anormales entre puntos consecutivos
export const detectAbnormalSpeed = (
  point1: GPSPoint,
  point2: GPSPoint
): boolean => {
  if (!point1.timestamp || !point2.timestamp) return false;

  const distance = calculateDistance(point1, point2);
  const timeDiff = (point2.timestamp - point1.timestamp) / 1000; // segundos

  if (timeDiff === 0) return true;

  const speedKmh = (distance / timeDiff) * 3.6; // m/s a km/h
  return speedKmh > MAX_RUNNING_SPEED_KMH;
};

// Validar velocidad promedio de toda la ruta
export const validateAverageSpeed = (
  path: Coordinate[],
  duration: number
): { isValid: boolean; reason?: string } => {
  if (path.length < 2) return { isValid: true };
  if (duration === 0) return { isValid: false, reason: 'Duración inválida' };

  const distance = calculatePathDistance(path);
  const speedKmh = (distance / duration) * 3.6; // m/s a km/h

  if (speedKmh > MAX_RUNNING_SPEED_KMH) {
    return {
      isValid: false,
      reason: `Velocidad promedio demasiado alta: ${speedKmh.toFixed(1)} km/h`,
    };
  }

  // Validar ritmo mínimo (evitar que se marque estando completamente parado)
  const paceMinKm = (duration / 60) / (distance / 1000);
  if (paceMinKm > 30) {
    return {
      isValid: false,
      reason: 'Ritmo demasiado lento (posible actividad estática)',
    };
  }

  return { isValid: true };
};

// Obtener límite de área (límite fijo para todos los niveles)
export const getMaxAreaForLevel = (level: number): number => {
  // Límite fijo de 5 km² para todos los usuarios
  return 5000000; // 5 km²
};

// Validar área de territorio según nivel
export const validateTerritoryArea = (
  area: number,
  level: number
): { isValid: boolean; reason?: string; maxArea: number } => {
  const maxArea = getMaxAreaForLevel(level);

  if (area > maxArea) {
    return {
      isValid: false,
      reason: `Área demasiado grande para tu nivel (máx: ${(maxArea / 1000000).toFixed(2)} km²)`,
      maxArea,
    };
  }

  // Validar área mínima (evitar territorios diminutos)
  if (area < 50) {
    return {
      isValid: false,
      reason: 'Área demasiado pequeña (mín: 50 m²)',
      maxArea,
    };
  }

  return { isValid: true, maxArea };
};

// Suavizar ruta eliminando puntos redundantes (Douglas-Peucker simplificado)
export const smoothPath = (
  points: Coordinate[],
  minDistance: number = MIN_POINT_DISTANCE
): Coordinate[] => {
  if (points.length < 3) return points;

  const smoothed: Coordinate[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const lastPoint = smoothed[smoothed.length - 1];
    const currentPoint = points[i];
    const distance = calculateDistance(lastPoint, currentPoint);

    // Solo agregar si la distancia es significativa
    if (distance >= minDistance) {
      smoothed.push(currentPoint);
    }
  }

  // Siempre agregar el último punto
  smoothed.push(points[points.length - 1]);

  return smoothed;
};

// Validar patrón de ruta (detectar trazados sospechosos)
export const validateRoutePattern = (
  path: Coordinate[]
): { isValid: boolean; reason?: string } => {
  if (path.length < 4) return { isValid: true };

  let suspiciousJumps = 0;

  for (let i = 1; i < path.length; i++) {
    const distance = calculateDistance(path[i - 1], path[i]);
    
    // Detectar saltos anormales entre puntos
    if (distance > MAX_POINT_DISTANCE) {
      suspiciousJumps++;
    }
  }

  // Si más del 30% de los puntos tienen saltos sospechosos
  if (suspiciousJumps / path.length > 0.3) {
    return {
      isValid: false,
      reason: 'Patrón de ruta sospechoso (demasiados saltos)',
    };
  }

  return { isValid: true };
};

// Validación completa de carrera
export const validateRun = (
  path: Coordinate[],
  duration: number,
  area: number,
  userLevel: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validar velocidad
  const speedValidation = validateAverageSpeed(path, duration);
  if (!speedValidation.isValid) {
    errors.push(speedValidation.reason!);
  }

  // Validar área
  const areaValidation = validateTerritoryArea(area, userLevel);
  if (!areaValidation.isValid) {
    errors.push(areaValidation.reason!);
  }

  // Validar patrón de ruta
  const patternValidation = validateRoutePattern(path);
  if (!patternValidation.isValid) {
    errors.push(patternValidation.reason!);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
