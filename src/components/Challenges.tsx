import { useState, useEffect } from 'react';
import { X, Trophy, Target, CheckCircle2, Clock, Award, Trees, Droplets, Map } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';

interface ChallengesProps {
  onClose: () => void;
  isMobileFullPage?: boolean;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'distance' | 'territories' | 'points';
  target_value: number;
  start_date: string;
  end_date: string;
  reward_points: number;
  icon: string;
  participation?: {
    current_progress: number;
    completed: boolean;
  };
}

interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type: 'park' | 'fountain' | 'district';
  target_count: number;
  reward_points: number;
  reward_shields: number;
  start_date: string;
  end_date: string;
  progress?: number;
  completed?: boolean;
}

const Challenges = ({ onClose, isMobileFullPage = false }: ChallengesProps) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChallenges();
      loadMissions();
    }
  }, [user]);

  const loadChallenges = async () => {
    if (!user) return;

    setLoading(true);

    // Cargar desafíos activos
    const { data: challengesData, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (challengesError) {
      console.error('Error cargando desafíos:', challengesError);
      toast.error('Error cargando desafíos');
      setLoading(false);
      return;
    }

    // Cargar participaciones del usuario
    const { data: participationsData, error: participationsError } = await supabase
      .from('challenge_participations')
      .select('*')
      .eq('user_id', user.id);

    if (participationsError) {
      console.error('Error cargando participaciones:', participationsError);
    }

    // Cargar todas las carreras del usuario para recalcular progreso
    const { data: runsData, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .eq('user_id', user.id);

    if (runsError) {
      console.error('Error cargando carreras:', runsError);
    }

    // Combinar datos y recalcular progreso basado en carreras reales
    const challengesWithProgress = (challengesData || []).map((challenge) => {
      const participation = participationsData?.find(
        (p) => p.challenge_id === challenge.id
      );

      // Calcular progreso real basado en las carreras en el período del desafío
      let actualProgress = 0;
      if (runsData && participation) {
        const runsInPeriod = runsData.filter(run => {
          const runDate = new Date(run.created_at);
          return runDate >= new Date(challenge.start_date) && 
                 runDate <= new Date(challenge.end_date);
        });

        if (challenge.type === 'distance') {
          actualProgress = runsInPeriod.reduce((sum, run) => sum + run.distance, 0);
        } else if (challenge.type === 'territories') {
          actualProgress = runsInPeriod.reduce((sum, run) => 
            sum + run.territories_conquered + run.territories_stolen, 0
          );
        } else if (challenge.type === 'points') {
          actualProgress = runsInPeriod.reduce((sum, run) => sum + run.points_gained, 0);
        }

        // Actualizar la participación si el progreso real es diferente
        if (participation && actualProgress !== participation.current_progress) {
          const isCompleted = actualProgress >= challenge.target_value;
          supabase
            .from('challenge_participations')
            .update({ 
              current_progress: actualProgress,
              completed: isCompleted,
              completed_at: isCompleted && !participation.completed ? new Date().toISOString() : participation.completed_at
            })
            .eq('id', participation.id)
            .then(() => console.log('Progreso actualizado'));
        }
      }

      return {
        ...challenge,
        type: challenge.type as 'distance' | 'territories' | 'points',
        participation: participation
          ? {
              current_progress: actualProgress || participation.current_progress,
              completed: actualProgress >= challenge.target_value || participation.completed,
            }
          : undefined,
      };
    });

    setChallenges(challengesWithProgress);
    setLoading(false);
  };

  const loadMissions = async () => {
    if (!user) return;
    setMissionsLoading(true);
    const now = new Date().toISOString();

    const { data: missionsData, error: missionsError } = await supabase
      .from('missions')
      .select('*')
      .eq('active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('start_date', { ascending: true });

    if (missionsError) {
      console.error('Error cargando misiones:', missionsError);
      toast.error('Error cargando misiones');
      setMissionsLoading(false);
      return;
    }

    const { data: missionsProgress } = await supabase
      .from('mission_progress')
      .select('*')
      .eq('user_id', user.id);

    const combined = (missionsData || []).map((mission) => {
      const progressRow = missionsProgress?.find((row) => row.mission_id === mission.id);
      return {
        ...mission,
        mission_type: mission.mission_type as Mission['mission_type'],
        progress: progressRow?.progress || 0,
        completed: progressRow?.completed || false,
      } as Mission;
    });

    setMissions(combined);
    setMissionsLoading(false);
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) return;

    const { error } = await supabase.from('challenge_participations').insert({
      challenge_id: challengeId,
      user_id: user.id,
      current_progress: 0,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Ya estás participando en este desafío');
      } else {
        toast.error('Error uniéndose al desafío');
      }
      console.error(error);
    } else {
      toast.success('¡Te has unido al desafío!');
      loadChallenges();
    }
  };

  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: async () => {
      await Promise.all([loadChallenges(), loadMissions()]);
    },
    enabled: isMobileFullPage,
  });

  const formatValue = (type: string, value: number) => {
    if (type === 'distance') {
      return `${(value / 1000).toFixed(1)} km`;
    }
    return value.toString();
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      distance: 'Distancia',
      territories: 'Territorios',
      points: 'Puntos',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const missionIconMap: Record<Mission['mission_type'], any> = {
    park: Trees,
    fountain: Droplets,
    district: Map,
  };

  const getMissionLabel = (type: Mission['mission_type']) => {
    const labels = {
      park: 'Parques',
      fountain: 'Fuentes',
      district: 'Barrios',
    };
    return labels[type];
  };

  const renderMissionSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-display font-bold">Misiones dinámicas</h3>
      </div>
      {missionsLoading ? (
        <Card className="p-4 bg-muted/30 border-border text-sm text-muted-foreground">
          Cargando misiones...
        </Card>
      ) : missions.length === 0 ? (
        <Card className="p-4 bg-muted/20 border-dashed border-border text-sm text-muted-foreground">
          No hay misiones activas por ahora.
        </Card>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => {
            const Icon = missionIconMap[mission.mission_type];
            const progress = Math.min(mission.progress || 0, mission.target_count);
            const percent = Math.min(100, (progress / mission.target_count) * 100);
            return (
              <Card key={mission.id} className="p-4 bg-card/80 border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">{getMissionLabel(mission.mission_type)}</p>
                        <h4 className="text-base font-semibold">{mission.title}</h4>
                      </div>
                      {mission.completed && (
                        <span className="text-xs font-semibold text-emerald-500">Completada</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                    <div className="mt-3 space-y-1">
                      <Progress value={percent} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progreso: {progress}/{mission.target_count}</span>
                        <span>
                          {mission.reward_points ? `+${mission.reward_points} pts` : ''}
                          {mission.reward_points && mission.reward_shields ? ' · ' : ''}
                          {mission.reward_shields ? `+${mission.reward_shields} escudo` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isMobileFullPage) {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div ref={containerRef} className="container mx-auto px-4 py-6 space-y-6 relative">
          <PullToRefreshIndicator
            isRefreshing={isRefreshing}
            pullDistance={pullDistance}
            progress={progress}
          />
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold glow-primary">
              Desafíos Semanales
            </h1>
          </div>

          <p className="text-muted-foreground">
            Completa desafíos semanales para ganar puntos extra y demostrar tus habilidades
          </p>

          {renderMissionSection()}

          {/* Challenges content */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando desafíos...</p>
            </div>
          ) : challenges.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay desafíos disponibles en este momento</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => {
                const daysRemaining = getDaysRemaining(challenge.end_date);
                const isExpired = daysRemaining < 0;
                const progress = challenge.participation
                  ? (challenge.participation.current_progress / challenge.target_value) * 100
                  : 0;
                const isCompleted = challenge.participation?.completed || false;

                return (
                  <Card
                    key={challenge.id}
                    className={`p-4 md:p-5 border-2 transition-all ${
                      isCompleted
                        ? 'border-success/50 bg-success/5'
                        : isExpired
                        ? 'border-muted/50 opacity-60'
                        : 'border-primary/30 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl md:text-4xl">{challenge.icon}</div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg md:text-xl font-display font-bold flex items-center gap-2">
                            {challenge.name}
                            {isCompleted && (
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">{challenge.description}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>
                              {isExpired
                                ? 'Expirado'
                                : `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restantes`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-primary font-semibold">
                            <Trophy className="w-4 h-4" />
                            <span>+{challenge.reward_points} pts</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{getTypeLabel(challenge.type)}:</span>
                            <span className="font-semibold">
                              {formatValue(challenge.type, challenge.participation?.current_progress || 0)} /{' '}
                              {formatValue(challenge.type, challenge.target_value)}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {!challenge.participation && !isExpired && (
                          <Button
                            onClick={() => joinChallenge(challenge.id)}
                            variant="secondary"
                            size="sm"
                            className="w-full md:w-auto"
                          >
                            Unirse al desafío
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 animate-fade-in">
      <Card className="w-full max-w-2xl bg-card border-glow p-4 md:p-6 space-y-4 md:space-y-6 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold glow-primary">
              Desafíos Semanales
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className={isMobileFullPage ? 'hidden' : ''}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Descripción */}
        <p className="text-muted-foreground text-sm">
          Completa desafíos semanales para ganar puntos extra y demostrar tus habilidades
        </p>

        {renderMissionSection()}

        {/* Lista de desafíos */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-pulse">Cargando desafíos...</div>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay desafíos activos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => {
              const daysRemaining = getDaysRemaining(challenge.end_date);
              const progress = challenge.participation
                ? (challenge.participation.current_progress / challenge.target_value) * 100
                : 0;
              const isCompleted = challenge.participation?.completed || false;
              const isJoined = !!challenge.participation;

              return (
                <Card
                  key={challenge.id}
                  className={`p-4 border-2 transition-all ${
                    isCompleted
                      ? 'border-success bg-success/5'
                      : isJoined
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header del desafío */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{challenge.icon}</div>
                        <div>
                          <h3 className="font-display font-bold text-lg flex items-center gap-2">
                            {challenge.name}
                            {isCompleted && (
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {challenge.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Información del desafío */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          {daysRemaining > 0
                            ? `${daysRemaining} días restantes`
                            : 'Último día'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <Award className="w-4 h-4" />
                        <span>+{challenge.reward_points} pts</span>
                      </div>
                    </div>

                    {/* Objetivo */}
                    <div className="flex items-center justify-between text-sm p-2 bg-background/50 rounded">
                      <span className="text-muted-foreground">
                        {getTypeLabel(challenge.type)}:
                      </span>
                      <span className="font-bold">
                        {formatValue(challenge.type, challenge.target_value)}
                      </span>
                    </div>

                    {/* Progreso */}
                    {isJoined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-semibold">
                            {formatValue(
                              challenge.type,
                              challenge.participation?.current_progress || 0
                            )}{' '}
                            / {formatValue(challenge.type, challenge.target_value)}
                          </span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                        {isCompleted && (
                          <p className="text-sm text-success font-semibold flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            ¡Desafío completado!
                          </p>
                        )}
                      </div>
                    )}

                    {/* Botón de acción */}
                    {!isJoined && !isCompleted && (
                      <Button
                        onClick={() => joinChallenge(challenge.id)}
                        className="w-full"
                        variant="default"
                      >
                        Unirse al desafío
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Challenges;
