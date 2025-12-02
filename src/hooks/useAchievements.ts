import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: 'distance' | 'territories' | 'streak';
  icon: string;
  requirement: number;
  points: number;
}

export interface UserAchievement {
  id: string;
  achievement: Achievement;
  unlocked_at: string;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      
      // Cargar todos los logros
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement', { ascending: true });

      if (achievementsError) throw achievementsError;

      // Cargar logros desbloqueados del usuario
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select(`
          id,
          unlocked_at,
          achievement:achievements(*)
        `)
        .eq('user_id', user?.id);

      if (userAchievementsError) throw userAchievementsError;

      setAchievements(allAchievements || []);
      setUnlockedAchievements(userAchievements || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUnlockAchievements = async () => {
    if (!user) return;

    try {
      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_distance, total_territories, current_streak, total_points')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Calcular racha actual
      const { data: streakData, error: streakError } = await supabase
        .rpc('calculate_user_streak', { p_user_id: user.id });

      if (streakError) throw streakError;

      const currentStreak = streakData || 0;

      // Actualizar racha en el perfil
      await supabase
        .from('profiles')
        .update({ current_streak: currentStreak })
        .eq('id', user.id);

      // Obtener IDs de logros ya desbloqueados
      const unlockedIds = unlockedAchievements.map(ua => ua.achievement.id);

      // Verificar cada logro
      const newUnlocks: Achievement[] = [];

      for (const achievement of achievements) {
        // Si ya está desbloqueado, continuar
        if (unlockedIds.includes(achievement.id)) continue;

        let shouldUnlock = false;

        switch (achievement.type) {
          case 'distance':
            shouldUnlock = profile.total_distance >= achievement.requirement;
            break;
          case 'territories':
            shouldUnlock = profile.total_territories >= achievement.requirement;
            break;
          case 'streak':
            shouldUnlock = currentStreak >= achievement.requirement;
            break;
        }

        if (shouldUnlock) {
          // Desbloquear logro
          const { error: unlockError } = await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id
            });

          if (!unlockError) {
            newUnlocks.push(achievement);
            
            // Actualizar puntos del usuario
            await supabase
              .from('profiles')
              .update({
                total_points: profile.total_points + achievement.points
              })
              .eq('id', user.id);

            // Crear notificación de logro desbloqueado
            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                type: 'achievement_unlocked',
                title: '¡Logro desbloqueado!',
                message: `${achievement.icon} ${achievement.name} - Has ganado ${achievement.points} puntos`,
                related_id: achievement.id
              });
          }
        }
      }

      // Mostrar notificaciones de nuevos logros
      if (newUnlocks.length > 0) {
        for (const achievement of newUnlocks) {
          toast.success(`¡Logro desbloqueado!`, {
            description: `${achievement.icon} ${achievement.name} (+${achievement.points} puntos)`,
            duration: 5000
          });
        }
        
        // Recargar logros
        await loadAchievements();
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const getProgress = (achievement: Achievement): number => {
    if (!user) return 0;

    const unlocked = unlockedAchievements.find(
      ua => ua.achievement.id === achievement.id
    );
    
    if (unlocked) return 100;

    // Aquí necesitaríamos los datos del perfil, lo calcularemos en el componente
    return 0;
  };

  return {
    achievements,
    unlockedAchievements,
    loading,
    checkAndUnlockAchievements,
    getProgress,
    reloadAchievements: loadAchievements
  };
};
