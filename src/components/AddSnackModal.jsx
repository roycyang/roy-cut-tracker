import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function AddSnackModal({ onSave, onClose }) {
  const [name, setName] = useState('Snack');
  const [cal, setCal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const handleSave = () => {
    const calNum = parseInt(cal, 10);
    if (!calNum || calNum <= 0) return;
    onSave({
      name: name.trim() || 'Snack',
      cal: calNum,
      protein: parseInt(protein, 10) || 0,
      carbs: parseInt(carbs, 10) || 0,
      fat: parseInt(fat, 10) || 0,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] rounded-t-2xl p-6 w-full max-w-sm animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">Add Snack / Extra Meal</h3>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white font-semibold mb-3 focus:outline-none focus:border-blue-500"
        />

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Calories *</label>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              value={cal}
              onChange={e => setCal(e.target.value)}
              placeholder="0"
              className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2.5 text-white text-center font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Protein (g)</label>
            <input
              type="number"
              inputMode="numeric"
              value={protein}
              onChange={e => setProtein(e.target.value)}
              placeholder="0"
              className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2.5 text-white text-center font-bold focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Carbs (g)</label>
            <input
              type="number"
              inputMode="numeric"
              value={carbs}
              onChange={e => setCarbs(e.target.value)}
              placeholder="0"
              className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2.5 text-white text-center font-bold focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fat (g)</label>
            <input
              type="number"
              inputMode="numeric"
              value={fat}
              onChange={e => setFat(e.target.value)}
              placeholder="0"
              className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2.5 text-white text-center font-bold focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#333] text-gray-300 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold"
          >
            Add
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
