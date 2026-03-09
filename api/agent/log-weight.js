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

    const { date_key, weight } = req.body;

    if (!date_key || !weight) {
      return res.status(400).json({ error: 'date_key and weight are required' });
    }

    if (typeof weight !== 'number' || weight < 50 || weight > 500) {
      return res.status(400).json({ error: 'Weight must be a number between 50 and 500' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date_key)) {
      return res.status(400).json({ error: 'date_key must be YYYY-MM-DD format' });
    }

    // Upsert the weight into daily_logs
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert(
        { user_id: user.id, date_key, weight },
        { onConflict: 'user_id,date_key' }
      )
      .select()
      .single();

    if (error) {
      console.error('Log weight error:', error);
      return res.status(500).json({ error: 'Failed to log weight' });
    }

    return res.status(200).json({
      success: true,
      date_key,
      weight: data.weight,
    });
  } catch (err) {
    console.error('Log weight error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
