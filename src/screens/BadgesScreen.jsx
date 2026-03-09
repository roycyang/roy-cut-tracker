import { usePlan } from '../context/UserPlanContext';
import { useStorage } from '../hooks/useStorage';

export default function BadgesScreen() {
  const { getBadges } = useStorage();
  const plan = usePlan();
  const unlockedBadges = getBadges();

  return (
    <div className="pb-4 animate-fade-in">
      <h2 className="text-lg font-bold mb-4">Badges</h2>
      <div className="grid grid-cols-3 gap-3">
        {plan.badges.map(badge => {
          const unlocked = unlockedBadges[badge.id];
          const unlockedDate = unlocked
            ? new Date(unlocked.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : null;

          return (
            <div
              key={badge.id}
              className={`bg-[#1a1a1a] rounded-xl p-4 text-center transition-all ${
                unlocked
                  ? 'border border-yellow-700/30 shadow-[0_0_12px_rgba(234,179,8,0.1)]'
                  : 'opacity-40 grayscale'
              }`}
            >
              <div className="text-3xl mb-2">
                {unlocked ? badge.emoji : '🔒'}
              </div>
              <div className="text-xs font-semibold mb-1">{badge.name}</div>
              <div className="text-[10px] text-gray-500">
                {unlocked ? unlockedDate : badge.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
