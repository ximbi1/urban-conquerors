import { X, MapPin, Clock, TrendingUp, Trophy, Share2, Play } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Run, Coordinate } from '@/types/territory';
import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { ShareConquest } from './ShareConquest';
import { RunReplayModal } from './RunReplayModal';
import { Navigation } from 'lucide-react';
import { calculateDistance } from '@/utils/geoCalculations';

interface RunDetailProps {
  run: Run;
  onClose: () => void;
}

const RunDetail = ({ run, onClose }: RunDetailProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showShare, setShowShare] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const runPath = (run.path as Coordinate[]) || [];
  const [splitMarkers, setSplitMarkers] = useState<mapboxgl.Marker[]>([]);
  const [splits, setSplits] = useState<{ km: number; time: number; pace: number; coord: Coordinate }[]>([]);

  useEffect(() => {
    fetchMapboxToken();
  }, []);

  useEffect(() => {
    if (mapboxToken && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [mapboxToken]);

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      setMapboxToken(data.token);
    } catch (error) {
      console.error('Error fetching Mapbox token:', error);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const path = runPath;
    if (path.length === 0) return;

    // Calcular centro del mapa
    const centerLat = path.reduce((sum, p) => sum + p.lat, 0) / path.length;
    const centerLng = path.reduce((sum, p) => sum + p.lng, 0) / path.length;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [centerLng, centerLat],
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on('load', () => {
      if (!map.current) return;

      // Añadir la ruta
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: path.map(p => [p.lng, p.lat]),
          },
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#8b5cf6',
          'line-width': 4,
        },
      });

      // Marcadores de splits
      addSplitMarkers();

      // Marcador de inicio
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat([path[0].lng, path[0].lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Inicio</strong>'))
        .addTo(map.current);

      // Marcador de fin
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([path[path.length - 1].lng, path[path.length - 1].lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Fin</strong>'))
        .addTo(map.current);

      // Ajustar vista para mostrar toda la ruta
      const bounds = new mapboxgl.LngLatBounds();
      path.forEach(p => bounds.extend([p.lng, p.lat]));
      map.current.fitBounds(bounds, { padding: 50 });
    });
  };

  const addSplitMarkers = () => {
    if (!map.current || runPath.length < 2) return;
    splitMarkers.forEach(m => m.remove());
    const markers: mapboxgl.Marker[] = [];
    const newSplits: { km: number; time: number; pace: number; coord: Coordinate }[] = [];
    let accumDist = 0;
    let accumTime = 0;
    let kmCounter = 1;
    for (let i = 1; i < runPath.length; i++) {
      const segDist = calculateDistance(runPath[i - 1], runPath[i]);
      accumDist += segDist;
      const segTime = run.duration * (segDist / Math.max(run.distance, 1));
      accumTime += segTime;
      while (accumDist >= kmCounter * 1000 && run.distance > 0) {
        const coord = runPath[i];
        const pace = ((accumTime) / 60) / kmCounter;
        newSplits.push({ km: kmCounter, time: accumTime, pace, coord });
        const marker = new mapboxgl.Marker({ color: '#f59e0b' })
          .setLngLat([coord.lng, coord.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Km ${kmCounter}</strong>`))
          .addTo(map.current!);
        markers.push(marker);
        kmCounter++;
      }
    }
    setSplitMarkers(markers);
    setSplits(newSplits);
  };

  const focusSplit = (split: { km: number; coord: Coordinate }) => {
    if (!map.current) return;
    map.current.easeTo({ center: [split.coord.lng, split.coord.lat], zoom: 15, duration: 800 });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  if (showShare) {
    return <ShareConquest run={run} onClose={() => setShowShare(false)} />;
  }

  if (showReplay) {
    return (
      <RunReplayModal
        path={runPath}
        title="Replay de la carrera"
        onClose={() => setShowReplay(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-card border-glow p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold glow-primary">
              Detalle de Carrera
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReplay(true)}
                disabled={runPath.length < 2}
              >
                <Play className="h-4 w-4 mr-2" />
                Replay
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Fecha */}
        <div className="text-sm text-muted-foreground">
          {formatDate(run.timestamp)}
        </div>

        {/* Mapa */}
        <div ref={mapContainer} className="w-full h-64 md:h-96 rounded-lg border border-border" />

        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-muted/30 border-border text-center">
            <MapPin className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-display font-bold text-primary">
              {(run.distance / 1000).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">km recorridos</div>
          </Card>

          <Card className="p-4 bg-muted/30 border-border text-center">
            <Clock className="h-5 w-5 mx-auto mb-2 text-secondary" />
            <div className="text-2xl font-display font-bold text-secondary">
              {formatDuration(run.duration)}
            </div>
            <div className="text-xs text-muted-foreground">duración</div>
          </Card>

          <Card className="p-4 bg-muted/30 border-border text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-accent" />
            <div className="text-2xl font-display font-bold text-accent">
              {run.avgPace.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">min/km</div>
          </Card>

          <Card className="p-4 bg-muted/30 border-border text-center">
            <Trophy className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-display font-bold text-yellow-500">
              +{run.pointsGained}
            </div>
            <div className="text-xs text-muted-foreground">puntos</div>
          </Card>
        </div>

        {/* Splits */}
        {splits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Navigation className="h-4 w-4" /> Parciales (km)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {splits.map(split => (
                <Card key={split.km} className="p-3 bg-muted/20 border-border/50 text-sm cursor-pointer hover:border-primary/50" onClick={() => focusSplit(split)}>
                  <div className="font-semibold">Km {split.km}</div>
                  <div className="text-muted-foreground text-xs">{formatDuration(Math.round(split.time))}</div>
                  <div className="text-muted-foreground text-xs">{(split.pace).toFixed(2)} min/km</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Territorios conquistados */}
        {(run.territoriesConquered > 0 || run.territoriesStolen > 0) && (
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <h3 className="text-lg font-display font-bold mb-3">Territorios</h3>
            <div className="space-y-2">
              {run.territoriesConquered > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conquistados</span>
                  <span className="text-xl font-display font-bold text-green-500">
                    {run.territoriesConquered}
                  </span>
                </div>
              )}
              {run.territoriesStolen > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Robados</span>
                  <span className="text-xl font-display font-bold text-orange-500">
                    {run.territoriesStolen}
                  </span>
                </div>
              )}
              {run.territoriesLost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Perdidos</span>
                  <span className="text-xl font-display font-bold text-red-500">
                    {run.territoriesLost}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-muted/30 border-border">
            <div className="text-xs text-muted-foreground mb-1">Velocidad promedio</div>
            <div className="text-lg font-display font-bold">
              {((run.distance / 1000) / (run.duration / 3600)).toFixed(2)} km/h
            </div>
          </Card>
          <Card className="p-3 bg-muted/30 border-border">
            <div className="text-xs text-muted-foreground mb-1">Puntos GPS</div>
            <div className="text-lg font-display font-bold">
              {(run.path as Coordinate[]).length}
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default RunDetail;
