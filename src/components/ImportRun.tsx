import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { parseGPX, parseTCX, detectFileType, gpsPointsToCoordinates, ParsedActivity } from '@/utils/gpxParser';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { calculatePolygonArea, calculatePerimeter, isPolygonClosed, calculateAveragePace, calculateDistance } from '@/utils/geoCalculations';
import { validateRun } from '@/utils/runValidation';
import { Coordinate } from '@/types/territory';
import { calculatePoints } from '@/utils/geoCalculations';
import { calculateLevel } from '@/utils/levelSystem';
import { calculateDefenseBonus, calculateRequiredPaceToSteal } from '@/utils/territoryProtection';

// Verificar si una fecha está en la semana actual (lunes-domingo)
const isInCurrentWeek = (date: Date): boolean => {
  const now = new Date();
  const mondayOfThisWeek = new Date(now);
  mondayOfThisWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  mondayOfThisWeek.setHours(0, 0, 0, 0);
  
  const sundayOfThisWeek = new Date(mondayOfThisWeek);
  sundayOfThisWeek.setDate(mondayOfThisWeek.getDate() + 6);
  sundayOfThisWeek.setHours(23, 59, 59, 999);
  
  return date >= mondayOfThisWeek && date <= sundayOfThisWeek;
};

// Generar hash único para una carrera
const generateRunHash = (path: Coordinate[], timestamp: Date): string => {
  const pathStr = path.slice(0, 10).map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|');
  return `${pathStr}_${timestamp.getTime()}`;
};

interface ImportRunProps {
  onImportComplete?: () => void;
}

export const ImportRun = ({ onImportComplete }: ImportRunProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedActivity | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setParsedData(null);

    try {
      const fileType = detectFileType(file);
      
      if (fileType === 'unknown') {
        throw new Error('Formato de archivo no compatible. Usa GPX o TCX.');
      }

      const content = await file.text();
      
      let parsed: ParsedActivity;
      if (fileType === 'gpx') {
        parsed = parseGPX(content);
      } else {
        parsed = parseTCX(content);
      }

      setParsedData(parsed);
      toast.success('Archivo cargado exitosamente');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar que sea de la semana actual
      if (!isInCurrentWeek(parsedData.startTime)) {
        throw new Error('Solo se pueden importar carreras de la semana actual (lunes a domingo)');
      }

      // Convertir a coordenadas
      const path = gpsPointsToCoordinates(parsedData.points);
      
      // Verificar duplicados
      const runHash = generateRunHash(path, parsedData.startTime);
      const { data: existingRuns } = await supabase
        .from('runs')
        .select('id, created_at, path')
        .eq('user_id', user.id);
      
      if (existingRuns) {
        for (const run of existingRuns) {
          const runPath = run.path as any as Coordinate[];
          const runDate = new Date(run.created_at);
          const existingHash = generateRunHash(runPath, runDate);
          
          if (existingHash === runHash) {
            throw new Error('Esta carrera ya ha sido importada anteriormente');
          }
        }
      }

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points, color, total_territories, total_distance, season_points, historical_points')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error('No se encontró el perfil del usuario');
      }

      const userLevel = calculateLevel(profile.total_points).level;

      // Calcular estadísticas primero
      const avgPace = calculateAveragePace(parsedData.totalDistance, parsedData.duration);

      // Detectar polígonos cerrados en la ruta
      let totalPoints = 0;
      let territoriesConquered = 0;
      let territoriesStolen = 0;

      // Por simplicidad, detectamos UN polígono cerrado al final de la ruta
      if (!isPolygonClosed(path, 100)) {
        throw new Error('La ruta no forma un polígono cerrado. Asegúrate de que el inicio y el final de la ruta estén cerca (máx. 100m)');
      }

      const area = calculatePolygonArea(path);
      const perimeter = calculatePerimeter(path);

      // Ahora validar con el área calculada
      const validation = validateRun(
        path,
        parsedData.duration,
        area,
        userLevel
      );

      if (!validation.isValid) {
        throw new Error(`Carrera no válida: ${validation.errors.join(', ')}`);
      }
      
      // Verificar si roba territorio de otro usuario
      const { data: existingTerritories } = await supabase
        .from('territories')
        .select('*, profiles!territories_user_id_fkey(username, color, total_points)')
        .neq('user_id', user.id);

      let isStolen = false;
      let stolenFromUserId = null;

      if (existingTerritories) {
        for (const territory of existingTerritories) {
          const coords = territory.coordinates as any as Coordinate[];
          // Verificar si hay suficiente superposición (simplificado)
          const centerLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
          const centerLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
          
          const isInside = path.some(p => {
            const dist = calculateDistance(p, { lat: centerLat, lng: centerLng });
            return dist < 50; // Si algún punto está muy cerca del centro
          });

          if (isInside) {
            // Verificar si el ritmo es mejor
            const ownerProfile = territory.profiles as any;
            const ownerLevel = calculateLevel(ownerProfile.total_points).level;
            const requiredPace = calculateRequiredPaceToSteal(territory.avg_pace, ownerLevel);
            
            if (avgPace <= requiredPace) {
              isStolen = true;
              stolenFromUserId = territory.user_id;
              
              // Eliminar territorio robado
              await supabase
                .from('territories')
                .delete()
                .eq('id', territory.id);
              
              // Actualizar perfil del usuario robado
              const { data: stolenProfile } = await supabase
                .from('profiles')
                .select('total_territories, total_points')
                .eq('id', territory.user_id)
                .single();
              
              if (stolenProfile) {
                await supabase
                  .from('profiles')
                  .update({
                    total_territories: Math.max(0, stolenProfile.total_territories - 1),
                    total_points: Math.max(0, stolenProfile.total_points - territory.points),
                  })
                  .eq('id', territory.user_id);
              }
              
              break;
            }
          }
        }
      }

      if (isStolen) {
        territoriesStolen++;
      } else {
        territoriesConquered++;
      }

      // Crear nuevo territorio
      const points = calculatePoints(area, isStolen);
      const { error: insertError } = await supabase.from('territories').insert([{
        user_id: user.id,
        coordinates: path as any,
        area,
        perimeter,
        avg_pace: avgPace,
        points,
        conquered: true,
      }]);

      if (insertError) throw insertError;

      totalPoints += points;

      // Guardar carrera
      const { error: runError } = await supabase.from('runs').insert([{
        user_id: user.id,
        path: path as any,
        distance: parsedData.totalDistance,
        duration: parsedData.duration,
        avg_pace: avgPace,
        territories_conquered: territoriesConquered,
        territories_stolen: territoriesStolen,
        territories_lost: 0,
        points_gained: totalPoints,
      }]);

      if (runError) throw runError;

      // Actualizar perfil del usuario
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_points: profile.total_points + totalPoints,
          season_points: (profile.season_points || 0) + totalPoints,
          historical_points: (profile.historical_points || 0) + totalPoints,
          total_territories: (profile.total_territories || 0) + (territoriesConquered + territoriesStolen),
          total_distance: (profile.total_distance || 0) + parsedData.totalDistance,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Actualizar progreso de desafíos semanales
      try {
        const { data: participations, error: participationsError } = await supabase
          .from('challenge_participations')
          .select(`
            *,
            challenge:challenges (type, target_value, reward_points)
          `)
          .eq('user_id', user.id)
          .eq('completed', false);

        if (!participationsError && participations) {
          for (const participation of participations) {
            let newProgress = participation.current_progress;
            const challenge = participation.challenge as any;

            if (challenge.type === 'distance') {
              newProgress += Math.round(parsedData.totalDistance);
            } else if (challenge.type === 'territories') {
              newProgress += (territoriesConquered + territoriesStolen);
            } else if (challenge.type === 'points') {
              newProgress += totalPoints;
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
      } catch (challengeError) {
        console.error('Error actualizando desafíos:', challengeError);
        // No lanzar error, la carrera ya se guardó correctamente
      }

      toast.success(`¡Carrera importada! ${territoriesConquered} territorios conquistados, ${territoriesStolen} robados.`);
      setParsedData(null);
      onImportComplete?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al importar';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Importar Carrera GPS</h3>
          <p className="text-sm text-muted-foreground">
            Sube un archivo GPX o TCX de tu reloj GPS (Garmin, Polar, Suunto, etc.)
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!parsedData ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".gpx,.tcx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {isUploading ? 'Cargando...' : 'Haz clic para seleccionar archivo'}
              </p>
              <p className="text-xs text-muted-foreground">
                GPX o TCX (máx. 10MB)
              </p>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">{parsedData.name}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Distancia</p>
                  <p className="font-medium">{(parsedData.totalDistance / 1000).toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duración</p>
                  <p className="font-medium">
                    {Math.floor(parsedData.duration / 60)}:{String(Math.floor(parsedData.duration % 60)).padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Puntos GPS</p>
                  <p className="font-medium">{parsedData.points.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">{parsedData.startTime.toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleConfirmImport}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? 'Procesando...' : 'Confirmar Importación'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setParsedData(null)}
                disabled={isUploading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
