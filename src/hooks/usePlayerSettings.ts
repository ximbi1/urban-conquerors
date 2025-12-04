import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PlayerSettings {
  leagueShard: string;
  explorerMode: boolean;
  socialLeague: boolean;
}

const defaultSettings: PlayerSettings = {
  leagueShard: 'bronze-1',
  explorerMode: false,
  socialLeague: false,
};

export const usePlayerSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlayerSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('league_shard, explorer_mode, social_league')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setSettings({
        leagueShard: data?.league_shard || 'bronze-1',
        explorerMode: Boolean(data?.explorer_mode),
        socialLeague: Boolean(data?.social_league),
      });
    } catch (error) {
      console.error('Error cargando preferencias del jugador:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setSettings(defaultSettings);
      setLoading(false);
    }
  }, [user, fetchSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<{ leagueShard: string; explorerMode: boolean; socialLeague: boolean }>) => {
      if (!user) return;

      const payload: Record<string, any> = {};
      if (updates.leagueShard !== undefined) payload.league_shard = updates.leagueShard;
      if (updates.explorerMode !== undefined) payload.explorer_mode = updates.explorerMode;
      if (updates.socialLeague !== undefined) payload.social_league = updates.socialLeague;

      if (Object.keys(payload).length === 0) return;

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) {
        console.error('No se pudieron actualizar las preferencias:', error);
        throw error;
      }

      setSettings((prev) => ({
        leagueShard: updates.leagueShard ?? prev.leagueShard,
        explorerMode: updates.explorerMode ?? prev.explorerMode,
        socialLeague: updates.socialLeague ?? prev.socialLeague,
      }));
    },
    [user]
  );

  return { settings, loading, refresh: fetchSettings, updateSettings };
};
