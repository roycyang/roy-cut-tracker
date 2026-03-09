import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
);

const tools = [
  {
    type: 'function',
    function: {
      name: 'log_weight',
      description: 'Log or update the user\'s weight for a specific date',
      parameters: {
        type: 'object',
        properties: {
          date_key: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          weight: { type: 'number', description: 'Weight in lbs' },
        },
        required: ['date_key', 'weight'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_progress',
      description: 'Get the user\'s current progress including weight, streaks, XP, and badges',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_plan',
      description: 'Get the user\'s full cut plan including targets, phases, and training schedule',
      parameters: { type: 'object', properties: {} },
    },
  },
];

async function executeTool(toolName, args, userId) {
  switch (toolName) {
    case 'log_weight': {
      const { date_key, weight } = args;
      const { data, error } = await supabase
        .from('daily_logs')
        .upsert({ user_id: userId, date_key, weight }, { onConflict: 'user_id,date_key' })
        .select()
        .single();
      if (error) return { error: error.message };
      return { success: true, date_key, weight: data.weight };
    }
    case 'get_progress': {
      const { data: state } = await supabase
        .from('user_state_v2').select('*').eq('user_id', userId).single();
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const { data: logs } = await supabase
        .from('daily_logs').select('date_key, weight').eq('user_id', userId)
        .gte('date_key', twoWeeksAgo.toISOString().split('T')[0])
        .not('weight', 'is', null).order('date_key', { ascending: false });
      const { data: plan } = await supabase
        .from('user_plans').select('start_weight, goal_weight_min, goal_weight_max')
        .eq('user_id', userId).single();
      const weights = (logs || []).map(l => ({ date: l.date_key, weight: l.weight }));
      const current = weights[0]?.weight || null;
      return { xp: state?.xp || 0, badges: state?.badges || {}, streaks: state?.streaks || {},
        current_weight: current, recent_weights: weights,
        goal: plan ? `${plan.goal_weight_min}-${plan.goal_weight_max}` : null };
    }
    case 'get_plan': {
      const { data: plan } = await supabase
        .from('user_plans').select('*').eq('user_id', userId).single();
      if (!plan) return { error: 'No plan found' };
      return { start_date: plan.start_date, end_date: plan.end_date,
        start_weight: plan.start_weight, goal: `${plan.goal_weight_min}-${plan.goal_weight_max}`,
        total_weeks: plan.total_weeks, phase_config: plan.phase_config,
        weekly_targets: plan.weekly_targets, training_schedule: plan.training_schedule };
    }
    default:
      return { error: 'Unknown tool' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, context } = req.body;

    // Authenticate if token provided
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    const systemPrompt = `You are a supportive, knowledgeable fitness coach in the Cut app. You help users with their weight loss (cutting) journey.

CURRENT USER CONTEXT:
- Week ${context.week} of ${context.plan.total_weeks}
- Phase ${context.phase} (${JSON.stringify(context.plan.phase_config[context.phase])})
- Start weight: ${context.plan.start_weight} lbs
- Goal: ${context.plan.goal_weight_min}-${context.plan.goal_weight_max} lbs
- Today's weight: ${context.todayWeight ? context.todayWeight + ' lbs' : 'not logged yet'}
- Recent weights: ${context.recentWeights?.join(', ') || 'none'}
- Streaks: Logging ${context.streaks.logging} days, Meals ${context.streaks.meals} days, Supps ${context.streaks.supplements} days
- XP: ${context.xp}

RULES:
- Be encouraging and supportive, never judgmental
- Give specific, actionable advice
- Reference their actual data when relevant
- Keep responses concise (2-4 sentences usually)
- If they're struggling, acknowledge it and help problem-solve
- Never recommend extreme measures or crash diets
- Use the log_weight tool when a user asks you to log their weight
- Use get_progress to check on their latest stats if needed
- Use get_plan to review their plan details if needed
- If asked about something outside your expertise, recommend they consult a professional`;

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    let completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: chatMessages,
      tools: userId ? tools : undefined,
      max_tokens: 300,
    });

    let choice = completion.choices[0];
    const actions = [];

    // Handle tool calls (up to 3 rounds)
    let rounds = 0;
    while (choice.finish_reason === 'tool_calls' && rounds < 3) {
      rounds++;
      const toolCalls = choice.message.tool_calls;
      chatMessages.push(choice.message);

      for (const tc of toolCalls) {
        const args = JSON.parse(tc.function.arguments);
        const result = await executeTool(tc.function.name, args, userId);
        actions.push({ tool: tc.function.name, args, result });
        chatMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: chatMessages,
        tools,
        max_tokens: 300,
      });
      choice = completion.choices[0];
    }

    return res.status(200).json({
      message: choice.message.content,
      actions,
    });
  } catch (err) {
    console.error('Coach chat error:', err);
    return res.status(500).json({ error: 'Coach unavailable' });
  }
}
