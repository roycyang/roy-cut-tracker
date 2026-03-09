import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Today', icon: '\u{1F3E0}' },
  { path: '/progress', label: 'Progress', icon: '\u{1F4C8}' },
  { path: '/feed', label: 'Feed', icon: '\u{1F465}' },
  { path: '/coach', label: 'Coach', icon: '\u{1F916}' },
  { path: '/settings', label: 'More', icon: '\u2699\uFE0F' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#2a2a2a] z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
        {tabs.map(tab => {
          const isActive = tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                isActive ? 'text-white' : 'text-gray-500'
              }`}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
