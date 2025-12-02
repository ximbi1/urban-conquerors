import { X, Trophy, MapPin, Route, Trash2, Edit2, Upload, User, Award, LogOut, TrendingUp, Info, FileUp, History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Run } from '@/types/territory';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAchievements } from '@/hooks/useAchievements';
import Achievements from './Achievements';
import { calculateLevel, getLevelTitle, getLevelColor } from '@/utils/levelSystem';
import { TerritoryInfoTooltip } from './TerritoryInfoTooltip';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';

const profileSchema = z.object({
  username: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(20, 'El nombre no puede tener más de 20 caracteres'),
  bio: z.string().max(200, 'La biografía no puede tener más de 200 caracteres').optional(),
});

interface ProfileProps {
  onClose: () => void;
  isMobileFullPage?: boolean;
  onImportClick?: () => void;
  onHistoryClick?: () => void;
}

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile = ({ onClose, isMobileFullPage = false, onImportClick, onHistoryClick }: ProfileProps) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const { unlockedAchievements } = useAchievements();
  const levelInfo = profile ? calculateLevel(profile.total_points) : null;
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadRuns();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      toast.error('Error al cargar perfil');
      return;
    }
    
    setProfile(data);
    setAvatarUrl(data.avatar_url);
    setValue('username', data.username);
    setValue('bio', data.bio || '');
  };

  const loadRuns = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Error al cargar carreras');
      return;
    }
    
    // Mapear datos de Supabase al tipo Run
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
  };

  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: async () => {
      await loadProfile();
      await loadRuns();
    },
    enabled: isMobileFullPage,
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    
    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 2MB');
      return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Subir archivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Actualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      setAvatarUrl(publicUrl);
      toast.success('Imagen de perfil actualizada');
    } catch (error: any) {
      toast.error('Error al subir imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    try {
      // Verificar si el username ya existe (excepto el propio)
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', data.username)
        .neq('id', user.id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingUser) {
        toast.error('Este nombre de usuario ya está en uso');
        return;
      }
      
      // Actualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          bio: data.bio || null,
        })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      await loadProfile();
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      toast.error('Error al actualizar perfil: ' + error.message);
    }
  };

  const handleDeleteTerritories = async () => {
    if (!profile || !user) return;
    
    if (window.confirm('⚠️ ¿Estás seguro de eliminar todos tus territorios? Esta acción no se puede deshacer.')) {
      const { error } = await supabase
        .from('territories')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        toast.error('Error al eliminar territorios');
        return;
      }
      
      await loadProfile();
      toast.success('Territorios eliminados correctamente');
    }
  };

  if (!profile) return null;

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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

  if (isMobileFullPage) {
    return (
      <div className="w-full h-full flex flex-col bg-background">
        <div ref={containerRef} className="container mx-auto px-4 py-6 space-y-4 flex-1 overflow-y-auto pb-24 relative">
          <PullToRefreshIndicator
            isRefreshing={isRefreshing}
            pullDistance={pullDistance}
            progress={progress}
          />
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold glow-primary">
              Perfil
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="w-5 h-5" />
            </Button>
          </div>

        {/* Información del Usuario */}
        {!isEditing ? (
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl || undefined} />
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
              <h3 className="text-xl font-display font-bold">{profile?.username}</h3>
              {levelInfo && (
                <p className={`text-xs font-semibold mt-0.5 ${getLevelColor(levelInfo.level)}`}>
                  {getLevelTitle(levelInfo.level)}
                </p>
              )}
              {profile?.bio && (
                <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback>
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center gap-2">
                <Label 
                  htmlFor="avatar-upload" 
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Subiendo...' : 'Cambiar imagen'}
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">Máximo 2MB</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                {...register('username')}
                placeholder="Tu nombre de usuario"
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="Cuéntanos sobre ti..."
                rows={3}
              />
              {errors.bio && (
                <p className="text-xs text-destructive">{errors.bio.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {watch('bio')?.length || 0}/200 caracteres
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Guardar cambios
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* Progreso de Nivel */}
        {levelInfo && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-sm font-semibold text-foreground">Nivel {levelInfo.level}</div>
                  <div className="text-xs text-muted-foreground">{profile?.total_points} puntos totales</div>
                </div>
                <TerritoryInfoTooltip userLevel={levelInfo.level} />
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-primary">{levelInfo.pointsToNextLevel}</div>
                <div className="text-xs text-muted-foreground">para nivel {levelInfo.level + 1}</div>
              </div>
            </div>
            <Progress value={levelInfo.progressPercentage} className="h-2" />
          </div>
        )}

        {/* Stats */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-muted/30 border-border text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-display font-bold text-primary">
                {profile?.total_points || 0}
              </div>
              <div className="text-xs text-muted-foreground">Puntos</div>
            </Card>
            
            <Card className="p-4 bg-muted/30 border-border text-center">
              <div className="flex justify-center mb-2">
                <MapPin className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-2xl font-display font-bold text-secondary">
                {profile?.total_territories || 0}
              </div>
              <div className="text-xs text-muted-foreground">Territorios</div>
            </Card>
            
            <Card className="p-4 bg-muted/30 border-border text-center">
              <div className="flex justify-center mb-2">
                <Route className="w-6 h-6 text-accent" />
              </div>
              <div className="text-2xl font-display font-bold text-accent">
                {formatDistance(profile?.total_distance || 0)}
              </div>
              <div className="text-xs text-muted-foreground">Distancia</div>
            </Card>

            <Card className="p-4 bg-muted/30 border-border text-center">
              <div className="text-2xl font-display font-bold">
                {profile?.current_streak || 0}🔥
              </div>
              <div className="text-xs text-muted-foreground">Días seguidos</div>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAchievements(true)}
            >
              <Award className="w-4 h-4 mr-2" />
              Logros ({unlockedAchievements.length})
            </Button>
            {onImportClick && (
              <Button
                variant="outline"
                onClick={onImportClick}
              >
                <FileUp className="w-4 h-4 mr-2" />
                Importar
              </Button>
            )}
            {onHistoryClick && (
              <Button
                variant="outline"
                onClick={onHistoryClick}
              >
                <History className="w-4 h-4 mr-2" />
                Historial
              </Button>
            )}
          </div>
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
                <div className="text-xs text-muted-foreground mb-1">Mejor Ritmo</div>
                <div className="text-2xl font-display font-bold text-accent">
                  {Math.min(...runs.map(r => r.avgPace)).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">min/km</div>
              </Card>
              <Card className="p-3 bg-card/50 border-accent/30">
                <div className="text-xs text-muted-foreground mb-1">Carrera Más Larga</div>
                <div className="text-2xl font-display font-bold text-accent">
                  {formatDistance(Math.max(...runs.map(r => r.distance)))}
                </div>
                <div className="text-xs text-muted-foreground">distancia</div>
              </Card>
              <Card className="p-3 bg-card/50 border-accent/30">
                <div className="text-xs text-muted-foreground mb-1">Más Territorios</div>
                <div className="text-2xl font-display font-bold text-accent">
                  {Math.max(...runs.map(r => r.territoriesConquered + r.territoriesStolen))}
                </div>
                <div className="text-xs text-muted-foreground">en una carrera</div>
              </Card>
            </div>
          </div>
        )}

        {/* Gráficos de Progreso Semanal */}
        {runs.length > 0 && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-display font-bold">Progreso Semanal</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
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
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="distance" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="km" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="points" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="pts" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Botones de acciones */}
        <div className="flex gap-2">
          <Button
            onClick={handleDeleteTerritories}
            variant="destructive"
            className="flex-1"
            disabled={!profile || profile.total_territories === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar territorios
          </Button>
          
          <Button
            onClick={async () => {
              await signOut();
              toast.success('Sesión cerrada correctamente');
            }}
            variant="outline"
            className="flex-1"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {showAchievements && (
          <Achievements onClose={() => setShowAchievements(false)} />
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <Card className="w-full max-w-2xl bg-card border-glow p-4 md:p-6 space-y-4 md:space-y-6 max-h-[90vh] md:max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold glow-primary">
            Perfil
          </h2>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* ... keep existing code (all profile content) */}

        {showAchievements && (
          <Achievements onClose={() => setShowAchievements(false)} />
        )}
      </Card>
    </div>
  );
};

export default Profile;
