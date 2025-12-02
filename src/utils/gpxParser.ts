import { Coordinate } from '@/types/territory';

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: Date;
  elevation?: number;
  heartRate?: number;
  speed?: number;
}

export interface ParsedActivity {
  name?: string;
  type?: string;
  points: GPSPoint[];
  totalDistance: number;
  duration: number;
  startTime: Date;
  endTime: Date;
}

// Parsear archivo GPX
export const parseGPX = (xmlContent: string): ParsedActivity => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  
  // Verificar si hay errores de parsing
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Error al parsear el archivo GPX');
  }

  const points: GPSPoint[] = [];
  const trkpts = xmlDoc.querySelectorAll('trkpt, rtept');
  
  if (trkpts.length === 0) {
    throw new Error('No se encontraron puntos de tracking en el archivo GPX');
  }

  trkpts.forEach((trkpt) => {
    const lat = parseFloat(trkpt.getAttribute('lat') || '0');
    const lng = parseFloat(trkpt.getAttribute('lon') || '0');
    
    const timeElement = trkpt.querySelector('time');
    const eleElement = trkpt.querySelector('ele');
    const hrElement = trkpt.querySelector('gpxtpx\\:hr, hr');
    
    const timestamp = timeElement ? new Date(timeElement.textContent || '') : new Date();
    const elevation = eleElement ? parseFloat(eleElement.textContent || '0') : undefined;
    const heartRate = hrElement ? parseInt(hrElement.textContent || '0') : undefined;

    points.push({
      lat,
      lng,
      timestamp,
      elevation,
      heartRate,
    });
  });

  if (points.length === 0) {
    throw new Error('No se pudieron extraer puntos del archivo GPX');
  }

  // Obtener metadata
  const name = xmlDoc.querySelector('name')?.textContent || 'Carrera importada';
  const type = xmlDoc.querySelector('type')?.textContent || 'running';

  const startTime = points[0].timestamp;
  const endTime = points[points.length - 1].timestamp;
  const duration = (endTime.getTime() - startTime.getTime()) / 1000; // segundos

  // Calcular distancia aproximada
  const totalDistance = calculateTotalDistance(points);

  return {
    name,
    type,
    points,
    totalDistance,
    duration,
    startTime,
    endTime,
  };
};

// Parsear archivo TCX
export const parseTCX = (xmlContent: string): ParsedActivity => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Error al parsear el archivo TCX');
  }

  const points: GPSPoint[] = [];
  const trackpoints = xmlDoc.querySelectorAll('Trackpoint');
  
  if (trackpoints.length === 0) {
    throw new Error('No se encontraron puntos de tracking en el archivo TCX');
  }

  trackpoints.forEach((tp) => {
    const positionElement = tp.querySelector('Position');
    if (!positionElement) return;

    const latElement = positionElement.querySelector('LatitudeDegrees');
    const lngElement = positionElement.querySelector('LongitudeDegrees');
    
    if (!latElement || !lngElement) return;

    const lat = parseFloat(latElement.textContent || '0');
    const lng = parseFloat(lngElement.textContent || '0');
    
    const timeElement = tp.querySelector('Time');
    const eleElement = tp.querySelector('AltitudeMeters');
    const hrElement = tp.querySelector('HeartRateBpm Value');
    const speedElement = tp.querySelector('Speed');
    
    const timestamp = timeElement ? new Date(timeElement.textContent || '') : new Date();
    const elevation = eleElement ? parseFloat(eleElement.textContent || '0') : undefined;
    const heartRate = hrElement ? parseInt(hrElement.textContent || '0') : undefined;
    const speed = speedElement ? parseFloat(speedElement.textContent || '0') : undefined;

    points.push({
      lat,
      lng,
      timestamp,
      elevation,
      heartRate,
      speed,
    });
  });

  if (points.length === 0) {
    throw new Error('No se pudieron extraer puntos del archivo TCX');
  }

  // Obtener metadata
  const activityElement = xmlDoc.querySelector('Activity');
  const type = activityElement?.getAttribute('Sport') || 'Running';
  const name = xmlDoc.querySelector('Notes')?.textContent || 'Carrera importada';

  const startTime = points[0].timestamp;
  const endTime = points[points.length - 1].timestamp;
  const duration = (endTime.getTime() - startTime.getTime()) / 1000;

  const totalDistance = calculateTotalDistance(points);

  return {
    name,
    type,
    points,
    totalDistance,
    duration,
    startTime,
    endTime,
  };
};

// Calcular distancia total usando fórmula de Haversine
const calculateTotalDistance = (points: GPSPoint[]): number => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1], points[i]);
  }
  return total;
};

const haversineDistance = (point1: GPSPoint, point2: GPSPoint): number => {
  const R = 6371000; // Radio de la Tierra en metros
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Detectar tipo de archivo
export const detectFileType = (file: File): 'gpx' | 'tcx' | 'unknown' => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'gpx') return 'gpx';
  if (extension === 'tcx') return 'tcx';
  return 'unknown';
};

// Convertir GPSPoints a Coordinates para usar en la app
export const gpsPointsToCoordinates = (points: GPSPoint[]): Coordinate[] => {
  return points.map(p => ({ lat: p.lat, lng: p.lng }));
};
