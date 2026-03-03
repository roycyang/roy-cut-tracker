import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function WeightModal({ onSave, onClose, lastWeight }) {
  const [value, setValue] = useState(lastWeight ? String(lastWeight) : '');

  const handleSave = () => {
    const num = parseFloat(value);
    if (num > 0 && num < 300) {
      onSave(num);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Log Today's Weight</h3>
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="e.g. 144.5"
          className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-2xl text-center text-white font-bold focus:outline-none focus:border-blue-500"
        />
        <p className="text-gray-500 text-xs text-center mt-2">lbs</p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#333] text-gray-300 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
