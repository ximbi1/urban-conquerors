CREATE OR REPLACE FUNCTION public.rebalance_league_shards(shard_size INTEGER DEFAULT 200)
RETURNS void
LANGUAGE plpgsql
AS $$
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
$$;
