export default function PhaseTransition({ phase, onDismiss }) {
  const config = {
    2: {
      bg: 'from-black to-red-950',
      icon: '⚡',
      title: 'PHASE 2',
      subtitle: 'THE REAL WORK STARTS.',
      color: 'text-red-500',
    },
    3: {
      bg: 'from-black to-purple-950',
      icon: '💀',
      title: 'PHASE 3',
      subtitle: 'NO MERCY.',
      color: 'text-purple-500',
    },
  };

  const c = config[phase];
  if (!c) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] bg-gradient-to-b ${c.bg} flex flex-col items-center justify-center cursor-pointer`}
      onClick={onDismiss}
    >
      <div className="animate-badge-pop text-8xl mb-6">{c.icon}</div>
      <h1 className={`text-5xl font-extrabold ${c.color} mb-4`}>{c.title}</h1>
      <p className="text-xl text-gray-300 font-medium">{c.subtitle}</p>
      <p className="text-sm text-gray-500 mt-8">Tap anywhere to continue</p>
    </div>
  );
}
