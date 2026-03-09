import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

const REACTIONS = [
  { id: 'fire', emoji: '\u{1F525}' },
  { id: 'flex', emoji: '\u{1F4AA}' },
  { id: 'clap', emoji: '\u{1F44F}' },
  { id: 'heart', emoji: '\u2764\uFE0F' },
  { id: 'hundred', emoji: '\u{1F4AF}' },
];

const EVENT_TEMPLATES = {
  badge_earned: (data) => ({
    title: `earned a badge!`,
    emoji: '\u{1F3C5}',
    detail: `"${data.badge_name}" \u2014 ${data.badge_description}`,
  }),
  weekly_target_hit: (data) => ({
    title: `hit their weekly target!`,
    emoji: '\u{1F3AF}',
    detail: `${data.percentage}% of the way to their goal`,
  }),
  streak_milestone: (data) => ({
    title: `hit a ${data.count}-day ${data.streak_type} streak!`,
    emoji: '\u{1F525}',
    detail: `Consistency is the real superpower`,
  }),
  progress_photo: () => ({
    title: `shared a progress photo`,
    emoji: '\u{1F4F8}',
    detail: null,
  }),
  plan_started: () => ({
    title: `started their cut!`,
    emoji: '\u{1F680}',
    detail: `A new journey begins`,
  }),
  plan_completed: (data) => ({
    title: `completed their ${data.weeks}-week cut!`,
    emoji: '\u{1F389}',
    detail: `What a journey. Absolute legend.`,
  }),
};

function FeedItem({ event, currentUserId }) {
  const [myReaction, setMyReaction] = useState(null);
  const [reactionCount, setReactionCount] = useState(event.reaction_count || 0);
  const template = EVENT_TEMPLATES[event.event_type]?.(event.event_data) || {
    title: 'did something awesome!',
    emoji: '\u2B50',
    detail: null,
  };

  const handleReact = async (reactionId) => {
    if (!currentUserId) return;
    if (myReaction === reactionId) {
      // Remove reaction
      setMyReaction(null);
      setReactionCount(c => Math.max(0, c - 1));
      await supabase.from('encouragements').delete()
        .eq('event_id', event.id)
        .eq('user_id', currentUserId);
    } else {
      // Add/update reaction
      if (!myReaction) setReactionCount(c => c + 1);
      setMyReaction(reactionId);
      await supabase.from('encouragements').upsert({
        event_id: event.id,
        user_id: currentUserId,
        reaction: reactionId,
      });
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-lg flex-shrink-0">
          {event.profile?.avatar_url ? (
            <img src={event.profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            event.profile?.display_name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-semibold">{event.profile?.display_name || 'Someone'}</span>
            {' '}{template.title} {template.emoji}
          </p>
          {template.detail && (
            <p className="text-xs text-gray-400 mt-1">{template.detail}</p>
          )}
          <p className="text-[10px] text-gray-600 mt-1">
            {new Date(event.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Reaction bar */}
      <div className="flex items-center gap-1">
        {REACTIONS.map(r => (
          <button
            key={r.id}
            onClick={() => handleReact(r.id)}
            className={`px-2 py-1 rounded-lg text-base transition-all ${
              myReaction === r.id
                ? 'bg-white/10 scale-110'
                : 'active:scale-110'
            }`}
          >
            {r.emoji}
          </button>
        ))}
        {reactionCount > 0 && (
          <span className="text-[10px] text-gray-500 ml-1">{reactionCount} cheered</span>
        )}
      </div>
    </div>
  );
}

export default function FeedScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_events')
        .select(`
          *,
          profile:profiles(display_name, avatar_url),
          encouragements(count)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setEvents((data || []).map(e => ({
        ...e,
        profile: e.profile,
        reaction_count: e.encouragements?.[0]?.count || 0,
      })));
    } catch (err) {
      console.warn('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <div className="pb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Feed</h2>
        <button onClick={loadFeed} className="text-xs text-gray-500 active:text-white">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">{'\u{1F465}'}</div>
          <h3 className="font-semibold mb-1">No activity yet</h3>
          <p className="text-gray-500 text-sm">
            When you or people you follow hit milestones, they'll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <FeedItem key={event.id} event={event} currentUserId={user?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
