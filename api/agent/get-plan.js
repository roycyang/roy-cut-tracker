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

    const { data: plan, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !plan) {
      return res.status(404).json({ error: 'No plan found' });
    }

    return res.status(200).json({
      start_date: plan.start_date,
      end_date: plan.end_date,
      start_weight: plan.start_weight,
      goal_weight_min: plan.goal_weight_min,
      goal_weight_max: plan.goal_weight_max,
      total_weeks: plan.total_weeks,
      eating_window: plan.eating_window,
      weekly_targets: plan.weekly_targets,
      phase_config: plan.phase_config,
      training_schedule: plan.training_schedule,
      supplements: plan.supplements,
      meal_templates: plan.meal_templates,
      badges: plan.badges,
      xp_values: plan.xp_values,
      motivation: plan.motivation,
    });
  } catch (err) {
    console.error('Get plan error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
