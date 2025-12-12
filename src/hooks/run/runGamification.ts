import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Actualiza el progreso de duelos activos tras una carrera.
 * Mantiene la lógica fuera del hook principal para facilitar testing y mantenimiento.
 */
export const updateActiveDuels = async (
  userId: string,
  distanceValue: number,
  pointsValue: number,
  territoriesValue: number
) => {
  try {
    const { data: activeDuels } = await supabase
      .from('duels')
      .select('*')
      .eq('status', 'active')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`);

    if (!activeDuels) return;

    for (const duel of activeDuels as any[]) {
      const isChallenger = duel.challenger_id === userId;
      let increment = 0;

      if (duel.duel_type === 'distance') increment = Math.round(distanceValue);
      else if (duel.duel_type === 'points') increment = pointsValue;
      else if (duel.duel_type === 'territories') increment = territoriesValue;

      if (increment <= 0) continue;

      const progressField = isChallenger ? 'challenger_progress' : 'opponent_progress';
      const currentProgress = duel[progressField] || 0;
      const newProgress = currentProgress + increment;
      const updates: Record<string, any> = { [progressField]: newProgress };
      let completed = false;

      if (newProgress >= duel.target_value) {
        updates.status = 'completed';
        updates.winner_id = userId;
        completed = true;
      }

      await supabase
        .from('duels')
        .update(updates)
        .eq('id', duel.id);

      if (completed) {
        toast.success('🏁 ¡Has ganado un duelo!');
      }
    }
  } catch (error) {
    console.error('Error actualizando duelos', error);
  }
};
