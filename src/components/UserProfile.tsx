import { X, Trophy, MapPin, Route, Award, User, TrendingUp, History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Run } from '@/types/territory';
import { toast } from 'sonner';
import { calculateLevel, getLevelTitle, getLevelColor } from '@/utils/levelSystem';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { RunHistory } from './RunHistory';

interface UserProfileProps {
  userId: string;
  onClose: () => void;
}

const UserProfile = ({ userId, onClose }: UserProfileProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRunHistory, setShowRunHistory] = useState(false);
  const levelInfo = profile ? calculateLevel(profile.total_points) : null;

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadRuns();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast.error('Error al cargar perfil: ' + error.message);
    }
  };

  const loadRuns = async () => {
    try {
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      const mappedRuns: Run[] = (data || []).map(run => ({
        id: run.id,
        userId: run.user_id,
        distance: run.distance,
        duration: run.duration,
        avgPace: run.avg_pace,
        path: run.path as any,
        territoriesConquered: run.territories_conquered,
        territoriesStolen: run.territories_stolen,
        territoriesLost: run.territories_lost,
        pointsGained: run.points_gained,
        timestamp: new Date(run.created_at).getTime(),
      }));
      
      setRuns(mappedRuns);
    } catch (error: any) {
      toast.error('Error al cargar carreras: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const getWeeklyData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayRuns = runs.filter(run => 
        new Date(run.timestamp).toISOString().split('T')[0] === date
      );
      return {
        day: new Date(date).toLocaleDateString('es-ES', { weekday: 'short' }),
        distance: Math.round(dayRuns.reduce((sum, run) => sum + run.distance, 0) / 1000 * 100) / 100,
        points: dayRuns.reduce((sum, run) => sum + run.pointsGained, 0),
      };
    });
  };

  if (showRunHistory) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-card border-glow p-4 md:p-6 max-h-[90vh] overflow-auto">
          <RunHistory userId={userId} onClose={() => setShowRunHistory(false)} />
        </Card>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-card border-glow p-6">
          <div className="text-center py-8 text-muted-foreground">
            Cargando perfil...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card border-glow p-6 space-y-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold glow-primary">
            Perfil de Usuario
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Información del Usuario */}
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>
                <User className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            {levelInfo && (
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-background border-2 border-primary shadow-lg ${getLevelColor(levelInfo.level)}`}>
                <span className="font-display font-bold text-xs">Nv. {levelInfo.level}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-display font-bold">{profile.username}</h3>
            {levelInfo && (
              <p className={`text-xs font-semibold mt-0.5 ${getLevelColor(levelInfo.level)}`}>
                {getLevelTitle(levelInfo.level)}
              </p>
            )}
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Progreso de Nivel */}
        {levelInfo && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-foreground">Nivel {levelInfo.level}</div>
                <div className="text-xs text-muted-foreground">{profile.total_points} puntos totales</div>
              </div>
            </div>
            <Progress value={levelInfo.progressPercentage} className="h-2" />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-muted/30 border-border text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div className="text-2xl font-display font-bold text-primary">
              {profile.total_points || 0}
            </div>
            <div className="text-xs text-muted-foreground">Puntos</div>
          </Card>
          
          <Card className="p-4 bg-muted/30 border-border text-center">
            <div className="flex justify-center mb-2">
              <MapPin className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-2xl font-display font-bold text-secondary">
              {profile.total_territories || 0}
            </div>
            <div className="text-xs text-muted-foreground">Territorios</div>
          </Card>
          
          <Card className="p-4 bg-muted/30 border-border text-center">
            <div className="flex justify-center mb-2">
              <Route className="w-6 h-6 text-accent" />
            </div>
            <div className="text-2xl font-display font-bold text-accent">
              {formatDistance(profile.total_distance || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Distancia</div>
          </Card>

          <Card className="p-4 bg-muted/30 border-border text-center">
            <div className="text-2xl font-display font-bold">
              {profile.current_streak || 0}🔥
            </div>
            <div className="text-xs text-muted-foreground">Días seguidos</div>
          </Card>
        </div>

        {/* Récords Personales */}
        {runs.length > 0 && (
          <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-display font-bold">Récords Personales</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="p-3 bg-card/50 border-accent/30">
                <div className="text-xs text-muted-foreground mb-1">Mayor distancia</div>
                <div className="text-xl font-display font-bold text-accent">
                  {formatDistance(Math.max(...runs.map(r => r.distance)))}
                </div>
              </Card>
              <Card className="p-3 bg-card/50 border-accent/30">
                <div className="text-xs text-muted-foreground mb-1">Mejor ritmo</div>
                <div className="text-xl font-display font-bold text-accent">
                  {Math.min(...runs.map(r => r.avgPace)).toFixed(2)} min/km
                </div>
              </Card>
              <Card className="p-3 bg-card/50 border-accent/30">
                <div className="text-xs text-muted-foreground mb-1">Más territorios</div>
                <div className="text-xl font-display font-bold text-accent">
                  {Math.max(...runs.map(r => r.territoriesConquered + r.territoriesStolen))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Progreso Semanal */}
        {runs.length > 0 && (
          <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              <h3 className="text-lg font-display font-bold">Últimos 7 días</h3>
            </div>
            
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={getWeeklyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="distance" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--secondary))' }}
                  name="Distancia (km)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Botón para ver historial completo */}
        <Button 
          onClick={() => setShowRunHistory(true)} 
          variant="secondary" 
          className="w-full"
        >
          <History className="w-4 h-4 mr-2" />
          Ver historial completo de carreras
        </Button>
      </Card>
    </div>
  );
};

export default UserProfile;
