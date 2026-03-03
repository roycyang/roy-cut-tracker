import { useEffect, useState } from 'react';

export default function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 48px)' }}
      className={`fixed left-4 right-4 z-[100] flex justify-center transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl px-5 py-3 shadow-lg max-w-sm text-center text-sm font-medium">
        {message}
      </div>
    </div>
  );
}
