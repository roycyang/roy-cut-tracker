import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playBadgeUnlocked } from '../utils/sounds';
import { getBadgeInfo } from '../utils/badges';

export default function BadgeUnlockModal({ badgeId, onDone }) {
  const badge = getBadgeInfo(badgeId);

  useEffect(() => {
    playBadgeUnlocked();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 flex flex-col items-center justify-center" onClick={onDone}>
      <div className="animate-badge-pop text-8xl mb-4">{badge.emoji}</div>
      <h2 className="text-2xl font-bold text-white mb-2">{badge.name}</h2>
      <p className="text-yellow-400 font-semibold text-lg">Unlocked!</p>
      <p className="text-gray-400 text-sm mt-2">{badge.description}</p>
    </div>
  );
}
