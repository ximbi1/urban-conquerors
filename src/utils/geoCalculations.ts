import { Coordinate } from '@/types/territory';

// Calcular distancia entre dos puntos usando fórmula de Haversine
export const calculateDistance = (point1: Coordinate, point2: Coordinate): number => {
  const R = 6371000; // Radio de la Tierra en metros
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // en metros
};

// Calcular distancia total de un camino
export const calculatePathDistance = (path: Coordinate[]): number => {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += calculateDistance(path[i - 1], path[i]);
  }
  return total;
};

// Verificar si un polígono está cerrado (último punto cerca del primero)
export const isPolygonClosed = (path: Coordinate[], threshold = 50): boolean => {
  if (path.length < 3) return false;
  const distance = calculateDistance(path[0], path[path.length - 1]);
  return distance <= threshold;
};

// Calcular área de un polígono usando fórmula de Shoelace
export const calculatePolygonArea = (coordinates: Coordinate[]): number => {
  if (coordinates.length < 3) return 0;

  let area = 0;
  const R = 6371000; // Radio de la Tierra en metros

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const lat1 = (coordinates[i].lat * Math.PI) / 180;
    const lat2 = (coordinates[j].lat * Math.PI) / 180;
    const lng1 = (coordinates[i].lng * Math.PI) / 180;
    const lng2 = (coordinates[j].lng * Math.PI) / 180;

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (area * R * R) / 2;
  return Math.abs(area);
};

// Calcular perímetro de un polígono
export const calculatePerimeter = (coordinates: Coordinate[]): number => {
  if (coordinates.length < 2) return 0;
  
  let perimeter = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    perimeter += calculateDistance(coordinates[i], coordinates[j]);
  }
  
  return perimeter;
};

// Calcular ritmo promedio (min/km)
export const calculateAveragePace = (distance: number, duration: number): number => {
  if (distance === 0) return 0;
  const distanceKm = distance / 1000;
  const durationMin = duration / 60;
  return durationMin / distanceKm;
};

// Verificar si una ruta cubre el perímetro de un territorio
export const checkPerimeterCoverage = (
  runPath: Coordinate[],
  territoryCoords: Coordinate[],
  threshold = 0.9
): boolean => {
  const totalPerimeter = calculatePerimeter(territoryCoords);
  let coveredDistance = 0;

  for (const runPoint of runPath) {
    for (let i = 0; i < territoryCoords.length; i++) {
      const j = (i + 1) % territoryCoords.length;
      const distToSegment = pointToSegmentDistance(
        runPoint,
        territoryCoords[i],
        territoryCoords[j]
      );
      
      if (distToSegment < 20) { // 20 metros de tolerancia
        const segmentLength = calculateDistance(territoryCoords[i], territoryCoords[j]);
        coveredDistance += segmentLength;
      }
    }
  }

  return coveredDistance / totalPerimeter >= threshold;
};

// Calcular distancia de un punto a un segmento
const pointToSegmentDistance = (
  point: Coordinate,
  segStart: Coordinate,
  segEnd: Coordinate
): number => {
  const A = point.lat - segStart.lat;
  const B = point.lng - segStart.lng;
  const C = segEnd.lat - segStart.lat;
  const D = segEnd.lng - segStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = segStart.lat;
    yy = segStart.lng;
  } else if (param > 1) {
    xx = segEnd.lat;
    yy = segEnd.lng;
  } else {
    xx = segStart.lat + param * C;
    yy = segStart.lng + param * D;
  }

  return calculateDistance(point, { lat: xx, lng: yy });
};

// Calcular puntos considerando distancia, área y si fue robo
export const calculatePoints = (
  distance: number,
  area: number,
  stolen: boolean = false
): number => {
  const distancePoints = Math.round((distance / 1000) * 10);
  const areaPoints = Math.floor(area / 2000);
  const actionPoints = stolen ? 75 : 50;
  return distancePoints + areaPoints + actionPoints;
};
