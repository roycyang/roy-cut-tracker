import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      current_weight,
      goal_weight,
      weeks,
      exercise,
      dietary,
      cutting_for,
      cutting_for_detail,
    } = req.body;

    if (!current_weight || !goal_weight || !weeks) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const totalLoss = current_weight - goal_weight;
    const weeklyLoss = totalLoss / weeks;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    // Start on the upcoming Monday
    const dayOfWeek = startDate.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    startDate.setDate(startDate.getDate() + daysUntilMonday);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeks * 7 - 1);

    // Generate weekly targets (linear interpolation)
    const weeklyTargets = [];
    for (let w = 1; w <= weeks; w++) {
      const targetWeight = parseFloat((current_weight - weeklyLoss * w).toFixed(1));
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (w - 1) * 7);

      // Determine phase: 60% foundation, 15% intensify, 25% final push
      const progress = w / weeks;
      let phase;
      if (progress <= 0.6) phase = 1;
      else if (progress <= 0.75) phase = 2;
      else phase = 3;

      weeklyTargets.push({
        week: w,
        startDate: weekStart.toISOString().split('T')[0],
        target: targetWeight,
        phase,
      });
    }

    // Phase config: calorie and protein targets
    const bmr = current_weight * 12; // rough TDEE estimate
    const phaseConfig = {
      1: {
        label: 'Phase 1',
        color: '#2563eb',
        calRange: `${Math.round(bmr * 0.75)}–${Math.round(bmr * 0.82)}`,
        protein: `${Math.round(current_weight * 0.9)}g+`,
      },
      2: {
        label: 'Phase 2',
        color: '#dc2626',
        calRange: `${Math.round(bmr * 0.65)}–${Math.round(bmr * 0.75)}`,
        protein: `${Math.round(current_weight * 1.0)}g+`,
      },
      3: {
        label: 'Phase 3',
        color: '#7c3aed',
        calRange: `${Math.round(bmr * 0.6)}–${Math.round(bmr * 0.65)}`,
        protein: `${Math.round(current_weight * 1.0)}g+`,
      },
    };

    // Training schedule based on exercise preference
    const trainingSchedules = {
      gym: {
        early: {
          0: { type: 'Rest', emoji: '\u{1F634}' },
          1: { type: 'Lift', emoji: '\u{1F4AA}' },
          2: { type: 'Core', emoji: '\u{1F9D8}' },
          3: { type: 'Lift', emoji: '\u{1F4AA}' },
          4: { type: 'Core', emoji: '\u{1F9D8}' },
          5: { type: 'Lift', emoji: '\u{1F4AA}' },
          6: { type: 'Core', emoji: '\u{1F9D8}' },
        },
        late: {
          0: { type: 'Active Recovery', emoji: '\u{1F6B6}' },
          1: { type: 'Lift', emoji: '\u{1F4AA}' },
          2: { type: 'Core', emoji: '\u{1F9D8}' },
          3: { type: 'HIIT', emoji: '\u{1F525}' },
          4: { type: 'Core', emoji: '\u{1F9D8}' },
          5: { type: 'Lift', emoji: '\u{1F4AA}' },
          6: { type: 'Core', emoji: '\u{1F9D8}' },
        },
      },
      classes: {
        early: {
          0: { type: 'Rest', emoji: '\u{1F634}' },
          1: { type: 'Class', emoji: '\u{1F525}' },
          2: { type: 'Core', emoji: '\u{1F9D8}' },
          3: { type: 'Class', emoji: '\u{1F525}' },
          4: { type: 'Rest', emoji: '\u{1F634}' },
          5: { type: 'Class', emoji: '\u{1F525}' },
          6: { type: 'Core', emoji: '\u{1F9D8}' },
        },
        late: {
          0: { type: 'Active Recovery', emoji: '\u{1F6B6}' },
          1: { type: 'Class', emoji: '\u{1F525}' },
          2: { type: 'Core', emoji: '\u{1F9D8}' },
          3: { type: 'Class', emoji: '\u{1F525}' },
          4: { type: 'Core', emoji: '\u{1F9D8}' },
          5: { type: 'Class', emoji: '\u{1F525}' },
          6: { type: 'Core', emoji: '\u{1F9D8}' },
        },
      },
      home: {
        early: {
          0: { type: 'Rest', emoji: '\u{1F634}' },
          1: { type: 'Bodyweight', emoji: '\u{1F4AA}' },
          2: { type: 'Core', emoji: '\u{1F9D8}' },
          3: { type: 'Bodyweight', emoji: '\u{1F4AA}' },
          4: { type: 'Core', emoji: '\u{1F9D8}' },
          5: { type: 'Bodyweight', emoji: '\u{1F4AA}' },
          6: { type: 'Walk', emoji: '\u{1F6B6}' },
        },
        late: {
          0: { type: 'Active Recovery', emoji: '\u{1F6B6}' },
          1: { type: 'Bodyweight', emoji: '\u{1F4AA}' },
          2: { type: 'HIIT', emoji: '\u{1F525}' },
          3: { type: 'Core', emoji: '\u{1F9D8}' },
          4: { type: 'Bodyweight', emoji: '\u{1F4AA}' },
          5: { type: 'HIIT', emoji: '\u{1F525}' },
          6: { type: 'Core', emoji: '\u{1F9D8}' },
        },
      },
      running: {
        early: {
          0: { type: 'Rest', emoji: '\u{1F634}' },
          1: { type: 'Run', emoji: '\u{1F3C3}' },
          2: { type: 'Core', emoji: '\u{1F9D8}' },
          3: { type: 'Run', emoji: '\u{1F3C3}' },
          4: { type: 'Core', emoji: '\u{1F9D8}' },
          5: { type: 'Run', emoji: '\u{1F3C3}' },
          6: { type: 'Long Run', emoji: '\u{1F3C3}' },
        },
        late: {
          0: { type: 'Active Recovery', emoji: '\u{1F6B6}' },
          1: { type: 'Tempo Run', emoji: '\u{1F3C3}' },
          2: { type: 'Core', emoji: '\u{1F9D8}' },
          3: { type: 'Intervals', emoji: '\u{1F525}' },
          4: { type: 'Core', emoji: '\u{1F9D8}' },
          5: { type: 'Run', emoji: '\u{1F3C3}' },
          6: { type: 'Long Run', emoji: '\u{1F3C3}' },
        },
      },
      mixed: {
        early: {
          0: { type: 'Rest', emoji: '\u{1F634}' },
          1: { type: 'Lift', emoji: '\u{1F4AA}' },
          2: { type: 'Core', emoji: '\u{1F9D8}' },
          3: { type: 'Lift', emoji: '\u{1F4AA}' },
          4: { type: 'Core', emoji: '\u{1F9D8}' },
          5: { type: 'Lift', emoji: '\u{1F4AA}' },
          6: { type: 'Core', emoji: '\u{1F9D8}' },
        },
        late: {
          0: { type: 'Active Recovery', emoji: '\u{1F6B6}' },
          1: { type: 'Lift', emoji: '\u{1F4AA}' },
          2: { type: 'Core', emoji: '\u{1F9D8}' },
          3: { type: 'HIIT', emoji: '\u{1F525}' },
          4: { type: 'Core', emoji: '\u{1F9D8}' },
          5: { type: 'Lift', emoji: '\u{1F4AA}' },
          6: { type: 'Core', emoji: '\u{1F9D8}' },
        },
      },
    };

    const schedule = trainingSchedules[exercise] || trainingSchedules.mixed;

    // Generate badges (dynamic based on plan length)
    const midpoint = Math.ceil(weeks / 2);
    const badges = [
      { id: 'first_blood', name: 'First Weigh In', emoji: '\u{1FA78}', description: 'Log weight on Day 1' },
      { id: 'week1_warrior', name: 'Week 1 Warrior', emoji: '\u2694\uFE0F', description: 'Complete Week 1' },
      { id: 'halfway', name: 'Halfway There', emoji: '\u{1F9D7}', description: `Complete Week ${midpoint}` },
      { id: 'phase_shifter', name: 'Phase Shifter', emoji: '\u26A1', description: 'Enter Phase 2' },
      { id: 'red_zone', name: 'Red Zone', emoji: '\u{1F534}', description: 'Enter Phase 3' },
      { id: 'iron_will', name: 'Iron Will', emoji: '\u{1F9BE}', description: '7-day meal streak' },
      { id: 'supplement_king', name: 'Supplement King', emoji: '\u{1F451}', description: '14-day supplement streak' },
      { id: 'on_target', name: 'On Target', emoji: '\u{1F3AF}', description: 'Hit any weekly weight target' },
      { id: 'five_for_five', name: '5 for 5', emoji: '\u{1F3F9}', description: 'Hit 5 weekly targets in a row' },
      { id: 'shredded', name: 'Shredded', emoji: '\u{1F3C6}', description: `Hit goal weight (${goal_weight} lbs)` },
      { id: 'the_full_cut', name: 'The Full Cut', emoji: '\u{1F396}\uFE0F', description: `Complete all ${weeks} weeks` },
    ];

    const xpValues = {
      logWeight: 10,
      checkMeal: 15,
      allMeals: 25,
      checkSupplement: 5,
      allSupplements: 20,
      weeklyTarget: 100,
      streak7: 50,
      badgeUnlocked: 75,
      barrysSession: 50,
      completePhase1: 200,
      completePhase2: 100,
      finalGoal: 500,
    };

    // Use AI to generate motivation quotes personalized to their "why"
    let motivation;
    try {
      const motivationRes = await openai.chat.completions.create({
        model: 'gpt-4.1',
        max_tokens: 512,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Generate motivational quotes for someone on a fitness cut. Return JSON with keys "1", "2", "3", "final" each containing an array of 5 short motivational strings. Phase 1 = foundation/building habits, Phase 2 = intensifying, Phase 3 = final push, final = last week. Personalize to their reason for cutting.',
          },
          {
            role: 'user',
            content: `Cutting for: ${cutting_for}${cutting_for_detail ? ` (${cutting_for_detail})` : ''}. Duration: ${weeks} weeks. Current: ${current_weight} lbs, Goal: ${goal_weight} lbs.`,
          },
        ],
      });
      motivation = JSON.parse(motivationRes.choices[0].message.content);
    } catch {
      // Fallback motivation
      motivation = {
        1: [
          'Slow is smooth. Smooth is shredded.',
          'Every meal logged is a rep toward your goal.',
          "You don't need motivation. You have a plan.",
          'Trust the process. The mirror will catch up.',
          'Consistency beats intensity every time.',
        ],
        2: [
          'You just leveled up the difficulty. Good.',
          'Phase 2. This is where most people quit. Not you.',
          'The discomfort is the point.',
          'Dig deeper. You have more in the tank.',
          'Half the battle is showing up. You showed up.',
        ],
        3: [
          'The finish line is visible. Don\'t blink.',
          'Pain is temporary. Results are forever.',
          `${weeks} weeks of discipline for a year of confidence.`,
          "You're in the red zone. Finish strong.",
          'Everything you\'ve built leads here.',
        ],
        final: [
          'One week left. Leave nothing on the table.',
          'The version of you that started this would be proud.',
          'Almost there. Don\'t you dare slow down now.',
          'This is it. Make it count.',
          'You earned this. Now go get it.',
        ],
      };
    }

    // Default supplements
    const supplements = [
      { id: 'preworkout', name: 'Pre-Workout', time: '7:30am' },
      { id: 'creatine', name: 'Creatine (5g)', time: null },
      { id: 'whey', name: 'Whey Protein Isolate', time: null },
      { id: 'collagen', name: 'Collagen Peptides', time: null },
    ];

    const plan = {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      start_weight: current_weight,
      goal_weight_min: goal_weight - 0.5,
      goal_weight_max: goal_weight + 0.5,
      total_weeks: weeks,
      eating_window: { start: '9:00am', end: '6:00pm' },
      weekly_targets: weeklyTargets,
      phase_config: phaseConfig,
      training_schedule: schedule,
      training_weeks_1_6: schedule.early,
      training_weeks_7_10: schedule.late,
      supplements,
      meal_templates: null,
      badges,
      xp_values: xpValues,
      motivation,
    };

    return res.status(200).json(plan);
  } catch (err) {
    console.error('Plan generation error:', err);
    return res.status(500).json({ error: 'Failed to generate plan' });
  }
}
