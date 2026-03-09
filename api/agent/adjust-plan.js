import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { adjustments } = req.body;

    if (!adjustments || typeof adjustments !== 'object') {
      return res.status(400).json({ error: 'adjustments object is required' });
    }

    // Only allow updating specific safe fields
    const allowedFields = [
      'weekly_targets',
      'phase_config',
      'training_schedule',
      'eating_window',
      'supplements',
      'meal_templates',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (adjustments[field] !== undefined) {
        updates[field] = adjustments[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: plan, error } = await supabase
      .from('user_plans')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Adjust plan error:', error);
      return res.status(500).json({ error: 'Failed to adjust plan' });
    }

    return res.status(200).json({
      success: true,
      updated_fields: Object.keys(updates),
      plan: {
        start_date: plan.start_date,
        end_date: plan.end_date,
        start_weight: plan.start_weight,
        goal_weight_min: plan.goal_weight_min,
        goal_weight_max: plan.goal_weight_max,
        total_weeks: plan.total_weeks,
        weekly_targets: plan.weekly_targets,
        phase_config: plan.phase_config,
        training_schedule: plan.training_schedule,
      },
    });
  } catch (err) {
    console.error('Adjust plan error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
