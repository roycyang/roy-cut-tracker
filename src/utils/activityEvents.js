import { supabase } from './supabase';

export async function emitActivityEvent(userId, eventType, eventData) {
  if (!userId || userId === '__legacy__') return;

  // Check if user is in social mode before emitting
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('privacy_mode')
      .eq('id', userId)
      .single();

    if (profile?.privacy_mode !== 'social') return;

    await supabase.from('activity_events').insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
    });
  } catch (err) {
    console.warn('Failed to emit activity event:', err);
  }
}

export function emitBadgeEarned(userId, badge) {
  return emitActivityEvent(userId, 'badge_earned', {
    badge_id: badge.id,
    badge_name: badge.name,
    badge_description: badge.description,
    badge_emoji: badge.emoji,
  });
}

export function emitWeeklyTargetHit(userId, week, percentage) {
  return emitActivityEvent(userId, 'weekly_target_hit', {
    week,
    percentage: Math.round(percentage),
  });
}

export function emitStreakMilestone(userId, streakType, count) {
  return emitActivityEvent(userId, 'streak_milestone', {
    streak_type: streakType,
    count,
  });
}

export function emitProgressPhoto(userId, weekNumber) {
  return emitActivityEvent(userId, 'progress_photo', {
    week_number: weekNumber,
  });
}

export function emitPlanStarted(userId) {
  return emitActivityEvent(userId, 'plan_started', {});
}

export function emitPlanCompleted(userId, weeks) {
  return emitActivityEvent(userId, 'plan_completed', { weeks });
}
