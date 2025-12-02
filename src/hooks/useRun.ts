import { useState, useCallback, useEffect } from 'react';
import { Coordinate, Territory } from '@/types/territory';
import {
  calculatePathDistance,
  isPolygonClosed,
  calculatePolygonArea,
  calculatePerimeter,
  calculateAveragePace,
  checkPerimeterCoverage,
  calculatePoints,
} from '@/utils/geoCalculations';
import {
  filterGPSPointsByAccuracy,
  smoothPath,
  validateRun,
  GPSPoint,
} from '@/utils/runValidation';
import {
  checkTerritoryProtection,
  formatProtectionTime,
  calculateRequiredPaceToSteal,
} from '@/utils/territoryProtection';
import { calculateLevel } from '@/utils/levelSystem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAchievements } from './useAchievements';

export const useRun = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runPath, setRunPath] = useState<Coordinate[]>([]);
  const [duration, setSuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [useGPS, setUseGPS] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [lastPauseTime, setLastPauseTime] = useState<number | null>(null);
  const { user } = useAuth();
  const { checkAndUnlockAchievements } = useAchievements();

  // Calcular duración basada en timestamps reales
  useEffect(() => {
    let interval: number | undefined;
    if (isRunning && !isPaused && startTime) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime - pausedTime) / 1000);
        setSuration(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, startTime, pausedTime]);

  const startRun = useCallback((gpsMode: boolean = false) => {
    const now = Date.now();
    setIsRunning(true);
    setIsPaused(false);
    setRunPath([]);
    setSuration(0);
    setDistance(0);
    setStartTime(now);
    setPausedTime(0);
    setLastPauseTime(null);
    setUseGPS(gpsMode);

    if (gpsMode) {
      if ('geolocation' in navigator) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            // Filtrar puntos por precisión GPS
            const accuracy = position.coords.accuracy;
            if (accuracy > 20) {
              console.warn(`GPS accuracy too low: ${accuracy}m`);
              return;
            }

            const newPoint: GPSPoint = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: accuracy,
              timestamp: Date.now(),
            };

            setRunPath(prev => {
              // No agregar puntos duplicados muy cercanos
              if (prev.length > 0) {
                const lastPoint = prev[prev.length - 1];
                const dist = calculatePathDistance([lastPoint, newPoint]);
                if (dist < 5) return prev; // Ignorar puntos < 5m
              }

              const updated = [...prev, newPoint];
              if (prev.length > 0) {
                setDistance(d => d + calculatePathDistance([prev[prev.length - 1], newPoint]));
              }
              return updated;
            });
          },
          (error) => {
            console.error('GPS Error:', error);
            toast.error('Error obteniendo ubicación GPS');
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000,
          }
        );
        setWatchId(id);
      } else {
        toast.error('Geolocalización no disponible');
        setUseGPS(false);
      }
    }

    toast.success('¡Carrera iniciada!');
  }, []);

  const pauseRun = useCallback(() => {
    setIsPaused(true);
    setLastPauseTime(Date.now());
    toast.info('Carrera pausada');
  }, []);

  const resumeRun = useCallback(() => {
    if (lastPauseTime) {
      const pauseDuration = Date.now() - lastPauseTime;
      setPausedTime(prev => prev + pauseDuration);
      setLastPauseTime(null);
    }
    setIsPaused(false);
    toast.success('Carrera reanudada');
  }, [lastPauseTime]);

  const addPoint = useCallback((point: Coordinate) => {
    if (!isRunning || isPaused || useGPS) return;
    
    setRunPath(prev => {
      const updated = [...prev, point];
      if (prev.length > 0) {
        const newDist = calculatePathDistance([prev[prev.length - 1], point]);
        setDistance(d => d + newDist);
      }

      // Verificar si se cerró un polígono
      if (updated.length >= 4 && isPolygonClosed(updated)) {
        toast.success('¡Polígono cerrado! 🎯', {
          description: 'Puedes conquistar este territorio'
        });
      }

      return updated;
    });
  }, [isRunning, isPaused, useGPS]);

  const stopRun = useCallback(async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    if (!user) {
      toast.error('Debes iniciar sesión para guardar carreras');
      return;
    }

    setIsSaving(true);
    toast.loading('Guardando carrera...', { id: 'saving-run' });

    let conquered = 0;
    let stolen = 0;
    let lost = 0;
    let pointsGained = 0;

    // Suavizar ruta antes de procesar
    const smoothedPath = smoothPath(runPath);
    const smoothedDistance = calculatePathDistance(smoothedPath);

    // Verificar si se cerró un polígono
    if (smoothedPath.length >= 4 && isPolygonClosed(smoothedPath)) {
      const area = calculatePolygonArea(smoothedPath);
      const perimeter = calculatePerimeter(smoothedPath);
      const avgPace = calculateAveragePace(smoothedDistance, duration);

      // Obtener nivel del usuario
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      const userLevel = userProfile ? calculateLevel(userProfile.total_points).level : 1;

      // VALIDAR LA CARRERA COMPLETA
      const validation = validateRun(smoothedPath, duration, area, userLevel);
      
      if (!validation.isValid) {
        toast.error('Carrera no válida', {
          description: validation.errors.join('. '),
        });
        setIsSaving(false);
        setIsRunning(false);
        setIsPaused(false);
        return;
      }

      try {
        // Cargar territorios existentes con información del dueño
        const { data: existingTerritories } = await supabase
          .from('territories')
          .select(`
            *,
            profile:profiles!territories_user_id_fkey(total_points)
          `);

        let isSteal = false;
        let stolenTerritoryId: string | null = null;

        if (existingTerritories) {
          for (const territory of existingTerritories) {
            const territoryCoords = (territory.coordinates as unknown) as Coordinate[];
            if (checkPerimeterCoverage(smoothedPath, territoryCoords, 0.9)) {
              // Verificar protección temporal
              const protection = checkTerritoryProtection(territory.updated_at);
              if (protection.isProtected && territory.user_id !== user.id) {
                toast.warning('Territorio protegido', {
                  description: `Este territorio está protegido por ${formatProtectionTime(protection.remainingTime!)}`,
                });
                continue;
              }

              // Calcular nivel del dueño y ritmo necesario
              const ownerProfile = territory.profile as any;
              const ownerLevel = ownerProfile ? calculateLevel(ownerProfile.total_points).level : 1;
              const requiredPace = calculateRequiredPaceToSteal(territory.avg_pace, ownerLevel);

              if (avgPace < requiredPace) {
                isSteal = true;
                stolenTerritoryId = territory.id;
                stolen++;
                if (territory.user_id === user.id) {
                  lost++;
                }
                break;
              } else {
                toast.info('Ritmo insuficiente', {
                  description: `Necesitas ${requiredPace.toFixed(2)} min/km o menos para robar este territorio`,
                });
              }
            }
          }
        }

        if (isSteal && stolenTerritoryId) {
          // Obtener información del territorio robado para notificar al dueño
          const stolenTerritory = existingTerritories?.find(t => t.id === stolenTerritoryId);
          
          // Actualizar territorio robado
          const { error } = await supabase
            .from('territories')
            .update({
              user_id: user.id,
              avg_pace: avgPace,
              updated_at: new Date().toISOString(),
            })
            .eq('id', stolenTerritoryId);

          if (error) throw error;

          // Crear notificación si el territorio era de otro usuario
          if (stolenTerritory && stolenTerritory.user_id !== user.id) {
            const { data: currentUserProfile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', user.id)
              .single();

            await supabase
              .from('notifications')
              .insert({
                user_id: stolenTerritory.user_id,
                type: 'territory_stolen',
                title: '¡Te han robado un territorio!',
                message: `${currentUserProfile?.username || 'Un corredor'} ha conquistado uno de tus territorios`,
                related_id: stolenTerritoryId
              });
          }

          pointsGained += 50;
          toast.success('🔥 ¡Territorio robado!', {
            description: 'Has conquistado un territorio enemigo',
          });
        } else {
          // Crear nuevo territorio
          const newPoints = calculatePoints(area);
          const { error } = await supabase
            .from('territories')
            .insert({
              user_id: user.id,
              coordinates: smoothedPath as any,
              area,
              perimeter,
              avg_pace: avgPace,
              points: newPoints,
              conquered: true,
            });

          if (error) throw error;

          conquered++;
          pointsGained += newPoints;
          toast.success('🎉 ¡Territorio conquistado!', {
            description: `Área: ${Math.round(area)} m²`,
          });
        }
      } catch (error) {
        console.error('Error guardando territorio:', error);
        toast.error('Error al guardar el territorio', { id: 'saving-run' });
        setIsSaving(false);
        return;
      }
    }

    // Guardar la carrera
    try {
      const { error: runError } = await supabase
        .from('runs')
        .insert({
          user_id: user.id,
          path: smoothedPath as any,
          distance: smoothedDistance,
          duration,
          avg_pace: calculateAveragePace(smoothedDistance, duration),
          territories_conquered: conquered,
          territories_stolen: stolen,
          territories_lost: lost,
          points_gained: pointsGained,
        });

      if (runError) throw runError;

      // Actualizar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              total_points: profile.total_points + pointsGained,
              season_points: profile.season_points + pointsGained,
              historical_points: profile.historical_points + pointsGained,
              total_territories: profile.total_territories + conquered,
              total_distance: profile.total_distance + smoothedDistance,
            })
            .eq('id', user.id);

        if (profileError) throw profileError;
      }
    } catch (error) {
      console.error('Error guardando carrera:', error);
      toast.error('Error al guardar la carrera', { id: 'saving-run' });
      setIsSaving(false);
      return;
    }

    // Actualizar progreso de desafíos
    try {
      const { data: participations, error: participationsError } = await supabase
        .from('challenge_participations')
        .select(`
          *,
          challenge:challenges (type, target_value)
        `)
        .eq('user_id', user.id)
        .eq('completed', false);

      if (!participationsError && participations) {
        for (const participation of participations) {
          let newProgress = participation.current_progress;
          const challenge = participation.challenge as any;

          if (challenge.type === 'distance') {
            newProgress += Math.round(smoothedDistance);
          } else if (challenge.type === 'territories') {
            newProgress += conquered;
          } else if (challenge.type === 'points') {
            newProgress += pointsGained;
          }

          const isCompleted = newProgress >= challenge.target_value;

          await supabase
            .from('challenge_participations')
            .update({
              current_progress: newProgress,
              completed: isCompleted,
              completed_at: isCompleted ? new Date().toISOString() : null,
            })
            .eq('id', participation.id);

          if (isCompleted) {
            toast.success('🏆 ¡Desafío completado!', {
              description: `Has ganado ${challenge.reward_points} puntos extra`,
            });

            // Dar puntos de recompensa
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('total_points, season_points, historical_points')
              .eq('id', user.id)
              .single();

            if (currentProfile) {
              await supabase
                .from('profiles')
                .update({
                  total_points: currentProfile.total_points + challenge.reward_points,
                  season_points: (currentProfile.season_points || 0) + challenge.reward_points,
                  historical_points: (currentProfile.historical_points || 0) + challenge.reward_points,
                })
                .eq('id', user.id);
            }

            // Crear notificación de desafío completado
            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                type: 'challenge_completed',
                title: '¡Desafío completado!',
                message: `Has completado el desafío y ganado ${challenge.reward_points} puntos extra`,
                related_id: participation.challenge_id
              });
          }
        }
      }
    } catch (error) {
      console.error('Error actualizando desafíos:', error);
    }

    toast.success('¡Carrera guardada exitosamente!', { id: 'saving-run' });
    setIsSaving(false);
    setIsRunning(false);
    setIsPaused(false);
    setUseGPS(false);

    // Verificar y desbloquear logros después de guardar la carrera
    setTimeout(() => {
      checkAndUnlockAchievements();
    }, 1000);

    return {
      conquered, 
      stolen, 
      lost, 
      pointsGained, 
      run: { 
        id: `run-${Date.now()}`,
        userId: user.id,
        path: smoothedPath,
        distance: smoothedDistance,
        duration,
        avgPace: calculateAveragePace(smoothedDistance, duration),
        territoriesConquered: conquered,
        territoriesStolen: stolen,
        territoriesLost: lost,
        pointsGained,
        timestamp: Date.now(),
      }
    };
  }, [runPath, duration, distance, watchId, user]);

  return {
    isRunning,
    isPaused,
    runPath,
    duration,
    distance,
    useGPS,
    isSaving,
    startRun,
    pauseRun,
    resumeRun,
    addPoint,
    stopRun,
  };
};