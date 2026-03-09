import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    // Get user state
    const { data: state } = await supabase
      .from('user_state_v2')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get recent weights (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const dateKey = twoWeeksAgo.toISOString().split('T')[0];

    const { data: logs } = await supabase
      .from('daily_logs')
      .select('date_key, weight')
      .eq('user_id', user.id)
      .gte('date_key', dateKey)
      .not('weight', 'is', null)
      .order('date_key', { ascending: false });

    // Get user plan
    const { data: plan } = await supabase
      .from('user_plans')
      .select('start_weight, goal_weight_min, goal_weight_max, total_weeks, start_date')
      .eq('user_id', user.id)
      .single();

    const recentWeights = (logs || []).map(l => ({ date: l.date_key, weight: l.weight }));
    const currentWeight = recentWeights[0]?.weight || null;
    const goalWeight = plan ? (plan.goal_weight_min + plan.goal_weight_max) / 2 : null;
    const progress = plan && currentWeight
      ? Math.round(((plan.start_weight - currentWeight) / (plan.start_weight - goalWeight)) * 100)
      : null;

    return res.status(200).json({
      xp: state?.xp || 0,
      badges: state?.badges || {},
      streaks: state?.streaks || {},
      current_weight: currentWeight,
      goal_weight: goalWeight,
      start_weight: plan?.start_weight || null,
      progress_percentage: progress,
      recent_weights: recentWeights,
    });
  } catch (err) {
    console.error('Get progress error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
