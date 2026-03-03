const tabs = [
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'badges', label: 'Badges', icon: '🏅' },
  { id: 'supplements', label: 'Supps', icon: '💊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomNav({ active, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#2a2a2a] z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
              active === tab.id ? 'text-white' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-0.5">{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
