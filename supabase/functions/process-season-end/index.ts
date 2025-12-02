import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeagueConfig {
  name: string;
  min: number;
  max?: number;
}

const LEAGUES: { [key: string]: LeagueConfig } = {
  legend: { name: 'Leyenda', min: 7000 },
  diamond: { name: 'Diamante', min: 3500, max: 6999 },
  gold: { name: 'Oro', min: 1500, max: 3499 },
  silver: { name: 'Plata', min: 500, max: 1499 },
  bronze: { name: 'Bronce', min: 0, max: 499 },
};

function calculateLeague(points: number): string {
  if (points >= 7000) return 'legend';
  if (points >= 3500) return 'diamond';
  if (points >= 1500) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting season end process...');

    // Obtener temporada activa
    const { data: activeSeason, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('active', true)
      .single();

    if (seasonError || !activeSeason) {
      throw new Error('No active season found');
    }

    console.log('Active season:', activeSeason.name);

    // Obtener todos los perfiles ordenados por season_points
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, season_points, current_league, total_territories, total_distance')
      .order('season_points', { ascending: false });

    if (profilesError) throw profilesError;

    console.log(`Processing ${profiles?.length || 0} profiles...`);

    // Agrupar por liga
    const leagueGroups: { [key: string]: any[] } = {
      legend: [],
      diamond: [],
      gold: [],
      silver: [],
      bronze: [],
    };

    profiles?.forEach(profile => {
      const league = profile.current_league || 'bronze';
      if (leagueGroups[league]) {
        leagueGroups[league].push(profile);
      }
    });

    // Procesar cada usuario
    for (const league in leagueGroups) {
      const usersInLeague = leagueGroups[league];
      usersInLeague.sort((a, b) => b.season_points - a.season_points);

      for (let index = 0; index < usersInLeague.length; index++) {
        const profile = usersInLeague[index];
        const rank = index + 1;
        const totalInLeague = usersInLeague.length;

        // Determinar nueva liga
        let newLeague = league;
        
        // Top 20% promocionan (excepto Leyenda)
        if (league !== 'legend' && rank <= Math.ceil(totalInLeague * 0.2)) {
          const leagues = ['bronze', 'silver', 'gold', 'diamond', 'legend'];
          const currentIndex = leagues.indexOf(league);
          if (currentIndex < leagues.length - 1) {
            newLeague = leagues[currentIndex + 1];
          }
        }
        // Bottom 20% descienden (excepto Bronce)
        else if (league !== 'bronze' && rank > Math.ceil(totalInLeague * 0.8)) {
          const leagues = ['bronze', 'silver', 'gold', 'diamond', 'legend'];
          const currentIndex = leagues.indexOf(league);
          if (currentIndex > 0) {
            newLeague = leagues[currentIndex - 1];
          }
        }

        // Guardar resultado de temporada
        await supabase
          .from('season_results')
          .insert({
            user_id: profile.id,
            season_id: activeSeason.id,
            final_points: profile.season_points,
            final_league: league,
            final_rank: rank,
            territories_conquered: profile.total_territories,
            total_distance: profile.total_distance,
          });

        // Actualizar perfil
        await supabase
          .from('profiles')
          .update({
            season_points: 0,
            previous_league: league,
            current_league: newLeague,
          })
          .eq('id', profile.id);

        // Crear notificación
        await supabase
          .from('notifications')
          .insert({
            user_id: profile.id,
            type: 'season_end',
            title: '¡Temporada finalizada!',
            message: `Has terminado en la posición ${rank} de ${LEAGUES[league].name}. ${
              newLeague !== league 
                ? newLeague > league 
                  ? `¡Has ascendido a ${LEAGUES[newLeague].name}!` 
                  : `Has descendido a ${LEAGUES[newLeague].name}.`
                : 'Te mantienes en tu liga.'
            }`,
          });
      }
    }

    // Borrar todos los territorios
    const { error: deleteError } = await supabase
      .from('territories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Borrar todos

    if (deleteError) {
      console.error('Error deleting territories:', deleteError);
    }

    // Desactivar temporada actual
    await supabase
      .from('seasons')
      .update({ active: false })
      .eq('id', activeSeason.id);

    // Crear nueva temporada (20 días)
    const { error: newSeasonError } = await supabase
      .from('seasons')
      .insert({
        name: `Temporada ${parseInt(activeSeason.name.split(' ')[1] || '1') + 1}`,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
      });

    if (newSeasonError) throw newSeasonError;

    console.log('Season end process completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Season ended and new season started',
        profilesProcessed: profiles?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing season end:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});