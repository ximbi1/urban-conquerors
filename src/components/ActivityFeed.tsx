import { useState, useEffect } from 'react';
import { X, MapPin, Zap, TrendingUp, Activity, Clock, PlayCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';
import { Coordinate } from '@/types/territory';
import { RunReplayModal } from './RunReplayModal';

interface ActivityFeedProps {
  onClose: () => void;
  isMobileFullPage?: boolean;
}

interface FriendActivity {
  id: string;
  created_at: string;
  distance: number;
  duration: number;
  avg_pace: number;
  path: Coordinate[];
  territories_conquered: number;
  territories_stolen: number;
  points_gained: number;
  user: {
    username: string;
    avatar_url: string | null;
    color: string;
  };
}

const ActivityFeed = ({ onClose, isMobileFullPage = false }: ActivityFeedProps) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [replayPath, setReplayPath] = useState<Coordinate[] | null>(null);
  const [replayTitle, setReplayTitle] = useState<string>('Replay de carrera');

  useEffect(() => {
    if (user) {
      loadActivities();
      subscribeToActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Calcular fecha de hace 7 días
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Obtener IDs de amigos (bidireccional)
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const friendIds = new Set<string>();
      if (friendships) {
        friendships.forEach(f => {
          if (f.user_id !== user.id) friendIds.add(f.user_id);
          if (f.friend_id !== user.id) friendIds.add(f.friend_id);
        });
      }

      // Obtener usuarios cercanos basándose en territorios
      const { data: userTerritories } = await supabase
        .from('territories')
        .select('coordinates')
        .eq('user_id', user.id)
        .eq('conquered', true)
        .limit(10);

      const nearbyUserIds = new Set<string>();
      
      if (userTerritories && userTerritories.length > 0) {
        // Obtener todos los territorios de otros usuarios
        const { data: otherTerritories } = await supabase
          .from('territories')
          .select('user_id, coordinates')
          .neq('user_id', user.id)
          .eq('conquered', true)
          .limit(200);

        if (otherTerritories) {
          // Calcular distancia entre territorios para encontrar usuarios cercanos
          otherTerritories.forEach(territory => {
            const coords = territory.coordinates as any;
            // Soportar distintos formatos de coordenadas (p.ej. GeoJSON Polygons)
            const firstPoint = Array.isArray(coords)
              ? (Array.isArray(coords[0]) ? coords[0] : null)
              : null;

            if (firstPoint && firstPoint.length >= 2) {
              const [lng, lat] = firstPoint;
              
              // Verificar si está cerca de algún territorio del usuario
              const isNearby = userTerritories.some(userTerritory => {
                const userCoords = userTerritory.coordinates as any;
                const userFirstPoint = Array.isArray(userCoords)
                  ? (Array.isArray(userCoords[0]) ? userCoords[0] : null)
                  : null;

                if (userFirstPoint && userFirstPoint.length >= 2) {
                  const [userLng, userLat] = userFirstPoint;
                  // Aproximadamente 5km de radio (0.045 grados ≈ 5km)
                  const distance = Math.sqrt(
                    Math.pow(lat - userLat, 2) + Math.pow(lng - userLng, 2)
                  );
                  return distance < 0.045;
                }
                return false;
              });

              if (isNearby) {
                nearbyUserIds.add(territory.user_id);
              }
            }
          });
        }
      }

      // Combinar amigos, usuarios cercanos y el propio usuario
      const allUserIds = new Set([...friendIds, ...nearbyUserIds, user.id]);
      const allUserIdsArray = Array.from(allUserIds);
      console.log('ActivityFeed allUserIds (debug)', allUserIdsArray);

      // Cargar carreras de los últimos 7 días solo de amigos/usuarios cercanos/propio usuario
      const { data: runs, error: runsError } = await supabase
        .from('runs')
        .select(`
          id,
          created_at,
          distance,
          duration,
          avg_pace,
          path,
          territories_conquered,
          territories_stolen,
          points_gained,
          user_id
        `)
        .in('user_id', allUserIdsArray)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Obtener perfiles de los usuarios
      const userIds = runs?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, color')
        .in('id', userIds);

      console.log('ActivityFeed runs result', { error: runsError, count: runs?.length, sample: runs?.[0] });

      if (runsError) {
        console.error('Error cargando actividades:', runsError);
        setActivities([]);
        setLoading(false);
        return;
      }

      // Crear mapa de perfiles
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const formattedActivities: FriendActivity[] = (runs || []).map((run: any) => {
        const profile = profilesMap.get(run.user_id);
        return {
          id: run.id,
          created_at: run.created_at,
          distance: run.distance,
          duration: run.duration,
          avg_pace: run.avg_pace,
          path: run.path,
          territories_conquered: run.territories_conquered,
          territories_stolen: run.territories_stolen,
          points_gained: run.points_gained,
          user: {
            username: profile?.username || 'Usuario',
            avatar_url: profile?.avatar_url || null,
            color: profile?.color || '#8b5cf6',
          },
        };
      });

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error cargando actividades:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: loadActivities,
    enabled: isMobileFullPage,
  });

  const subscribeToActivities = () => {
    const channel = supabase
      .channel('friend-activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'runs',
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  const formatPace = (pace: number) => {
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    }
    if (diffHours > 0) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    }
    if (diffMins > 0) {
      return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    }
    return 'ahora mismo';
  };

  const getActivityMessage = (activity: FriendActivity) => {
    const parts = [];
    
    if (activity.territories_stolen > 0) {
      parts.push(`robó ${activity.territories_stolen} territorio${activity.territories_stolen > 1 ? 's' : ''}`);
    }
    if (activity.territories_conquered > 0 && activity.territories_stolen === 0) {
      parts.push(`conquistó ${activity.territories_conquered} territorio${activity.territories_conquered > 1 ? 's' : ''}`);
    }
    
    return parts.length > 0 ? parts.join(' y ') : 'completó una carrera';
  };

  const renderActivities = () => (
    <>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="animate-pulse">Cargando actividades...</div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No hay actividad reciente</p>
          <p className="text-sm mt-1">
            Las carreras de amigos y corredores cercanos aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card
              key={activity.id}
              className="p-4 bg-muted/30 border-border hover:bg-muted/50 transition-colors animate-fade-in"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                  <AvatarImage src={activity.user.avatar_url || undefined} />
                  <AvatarFallback
                    style={{ backgroundColor: activity.user.color }}
                  >
                    {activity.user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {activity.user.username}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(activity.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">
                        +{activity.points_gained} pts
                      </div>
                    </div>
                  </div>

                  {/* Activity description */}
                  <p className="text-sm mb-3">
                    {getActivityMessage(activity)}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs bg-background/50 rounded px-2 py-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-accent" />
                      <div>
                        <div className="font-semibold">
                          {formatDistance(activity.distance)}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          Distancia
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs bg-background/50 rounded px-2 py-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">
                          {formatDuration(activity.duration)}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          Duración
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs bg-background/50 rounded px-2 py-1.5">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">
                          {formatPace(activity.avg_pace)}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          Ritmo
                        </div>
                      </div>
                    </div>

                    {activity.territories_stolen > 0 && (
                      <div className="flex items-center gap-2 text-xs bg-destructive/10 rounded px-2 py-1.5">
                        <Zap className="w-3.5 h-3.5 text-destructive" />
                        <div>
                          <div className="font-semibold">
                            {activity.territories_stolen}
                          </div>
                          <div className="text-muted-foreground text-[10px]">
                            Robados
                          </div>
                        </div>
                      </div>
                    )}

                    {activity.territories_conquered > 0 && (
                      <div className="flex items-center gap-2 text-xs bg-primary/10 rounded px-2 py-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <div>
                          <div className="font-semibold">
                            {activity.territories_conquered}
                          </div>
                          <div className="text-muted-foreground text-[10px]">
                            Conquistados
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mapa de la ruta */}
                  {activity.path && activity.path.length > 0 && (
                    <div className="mt-3 bg-muted/30 rounded-lg overflow-hidden h-32">
                      <svg
                        viewBox="0 0 400 128"
                        className="w-full h-full"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        {/* Calcular bounds del path */}
                        {(() => {
                          const path = activity.path as Array<{ lat: number; lng: number }>;
                          const lats = path.map(p => p.lat);
                          const lngs = path.map(p => p.lng);
                          const minLat = Math.min(...lats);
                          const maxLat = Math.max(...lats);
                          const minLng = Math.min(...lngs);
                          const maxLng = Math.max(...lngs);
                          
                          const latRange = maxLat - minLat || 0.001;
                          const lngRange = maxLng - minLng || 0.001;
                          
                          const padding = 20;
                          const width = 400 - 2 * padding;
                          const height = 128 - 2 * padding;
                          
                          const points = path.map(p => {
                            const x = ((p.lng - minLng) / lngRange) * width + padding;
                            const y = ((maxLat - p.lat) / latRange) * height + padding;
                            return `${x},${y}`;
                          }).join(' ');
                          
                          return (
                            <polyline
                              points={points}
                              fill="none"
                              stroke="hsl(var(--primary))"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          );
                        })()}
                      </svg>
                    </div>
                  )}

                  {activity.path && activity.path.length > 1 && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setReplayPath(activity.path);
                          setReplayTitle(`Replay de ${activity.user.username}`);
                        }}
                      >
                        <PlayCircle className="h-4 w-4 mr-1" /> Ver replay
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  if (isMobileFullPage) {
    return (
      <>
        <div className="w-full h-full flex flex-col bg-background">
          <div ref={containerRef} className="container mx-auto px-4 py-6 space-y-4 flex-1 overflow-y-auto pb-24 relative">
            <PullToRefreshIndicator
              isRefreshing={isRefreshing}
              pullDistance={pullDistance}
              progress={progress}
            />
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold glow-primary">
                  Feed de Actividad
                </h2>
                <p className="text-xs text-muted-foreground">
                  Amigos y corredores cercanos
                </p>
              </div>
            </div>

            {/* Activities List */}
            {renderActivities()}
          </div>
        </div>
        {replayPath && (
          <RunReplayModal
            path={replayPath}
            title={replayTitle}
            onClose={() => setReplayPath(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4 animate-fade-in bg-background/80 backdrop-blur-sm z-50">
        <Card className="w-full max-w-2xl bg-card p-4 md:p-6 space-y-4 max-h-[90vh] flex flex-col border-glow">
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold glow-primary">
                    Feed de Actividad
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Amigos y corredores cercanos
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Activities List */}
            <ScrollArea className="flex-1 pr-4">
              {renderActivities()}
            </ScrollArea>
          </div>
        </Card>
      </div>
      {replayPath && (
        <RunReplayModal
          path={replayPath}
          title={replayTitle}
          onClose={() => setReplayPath(null)}
        />
      )}
    </>
  );
};

export default ActivityFeed;
