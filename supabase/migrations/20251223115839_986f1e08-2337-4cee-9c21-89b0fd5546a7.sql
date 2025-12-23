
-- Fix handle_push_updated function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_push_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix rebalance_league_shards function with secure search_path
CREATE OR REPLACE FUNCTION public.rebalance_league_shards(shard_size integer DEFAULT 200)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE base_league TEXT;
BEGIN
  FOR base_league IN SELECT DISTINCT current_league FROM public.profiles LOOP
    WITH ranked AS (
      SELECT id,
        ROW_NUMBER() OVER (ORDER BY total_points DESC) AS rn
      FROM public.profiles
      WHERE current_league = base_league
        AND COALESCE(explorer_mode, false) = false
        AND COALESCE(social_league, false) = false
    ),
    computed AS (
      SELECT id,
        base_league || '-' || ((rn - 1) / shard_size + 1)::text AS shard
      FROM ranked
    )
    UPDATE public.profiles p
      SET league_shard = computed.shard
    FROM computed
    WHERE p.id = computed.id;
  END LOOP;
END;
$function$;
