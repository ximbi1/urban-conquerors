import { Coordinate } from '@/types/territory';
import { calculatePathDistance } from '@/utils/geoCalculations';

/**
 * Divide una ruta en bucles cerrados (territorios) usando la distancia entre
 * puntos inicial y final como heurística.
 */
export const extractLoops = (path: Coordinate[]): Coordinate[][] => {
  const loops: Coordinate[][] = [];
  let startIndex = 0;
  const CLOSE_THRESHOLD = 40; // metros

  for (let i = 1; i < path.length; i++) {
    const dist = calculatePathDistance([path[startIndex], path[i]]);
    if (dist <= CLOSE_THRESHOLD && i - startIndex >= 3) {
      const loop = path.slice(startIndex, i + 1);
      const first = loop[0];
      const last = loop[loop.length - 1];
      if (first.lat !== last.lat || first.lng !== last.lng) {
        loop.push({ ...first });
      }
      loops.push(loop);
      startIndex = i;
    }
  }

  // Si no hubo bucles, devolver la ruta completa cerrada implícitamente
  if (loops.length === 0) {
    const loop = [...path];
    const first = loop[0];
    const last = loop[loop.length - 1];
    if (first && last && (first.lat !== last.lat || first.lng !== last.lng)) {
      loop.push({ ...first });
    }
    if (loop.length >= 4) loops.push(loop);
    return loops;
  }

  // Si quedan puntos al final y forman un bucle, incluirlos
  if (startIndex < path.length - 3) {
    const tail = path.slice(startIndex);
    const firstTail = tail[0];
    const lastTail = tail[tail.length - 1];
    if (firstTail && lastTail && (firstTail.lat !== lastTail.lat || firstTail.lng !== lastTail.lng)) {
      tail.push({ ...firstTail });
    }
    if (tail.length >= 4) {
      loops.push(tail);
    }
  }

  return loops;
};
