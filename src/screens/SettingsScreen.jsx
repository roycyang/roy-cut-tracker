import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';

export default function SettingsScreen({ onSoundToggle }) {
  const storage = useStorage();

  const [sound, setSound] = useState(storage.isSoundEnabled());
  const [goalWeight, setGoalWeightState] = useState(storage.getGoalWeight());
  const [phaseOverride, setPhaseOverrideState] = useState(storage.getPhaseOverride());
  const [showReset, setShowReset] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(goalWeight));

  const handleSoundToggle = () => {
    const next = !sound;
    setSound(next);
    storage.setSoundEnabled(next);
    onSoundToggle?.(next);
  };

  const handleGoalSave = () => {
    const num = parseFloat(goalInput);
    if (num > 0 && num < 300) {
      storage.setGoalWeight(num);
      setGoalWeightState(num);
      setEditingGoal(false);
    }
  };

  const handlePhaseOverride = (p) => {
    const val = p === phaseOverride ? null : p;
    storage.setPhaseOverride(val);
    setPhaseOverrideState(val);
  };

  const handleExport = () => {
    const csv = storage.exportWeightsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weight-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    storage.resetAllData();
  };

  return (
    <div className="pb-4 animate-fade-in">
      <h2 className="text-lg font-bold mb-4">Settings</h2>

      {/* Goal Weight */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Goal Weight</span>
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                className="bg-[#111] border border-[#333] rounded-lg px-3 py-1.5 text-sm w-20 text-right text-white focus:outline-none focus:border-blue-500"
              />
              <button onClick={handleGoalSave} className="text-sm text-blue-400 font-medium">Save</button>
            </div>
          ) : (
            <button onClick={() => setEditingGoal(true)} className="text-sm text-gray-400">
              {goalWeight} lbs →
            </button>
          )}
        </div>
      </div>

      {/* Phase Override */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
        <span className="font-medium text-sm block mb-3">Phase Override</span>
        <div className="flex gap-2">
          {[1, 2, 3].map(p => (
            <button
              key={p}
              onClick={() => handlePhaseOverride(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                phaseOverride === p
                  ? p === 1 ? 'bg-blue-600 text-white'
                  : p === 2 ? 'bg-red-600 text-white'
                  : 'bg-purple-600 text-white'
                  : 'bg-[#111] text-gray-400'
              }`}
            >
              P{p}
            </button>
          ))}
        </div>
        {phaseOverride && (
          <p className="text-xs text-yellow-500 mt-2">Manual override active — tap again to disable</p>
        )}
      </div>

      {/* Sound */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Sound</span>
          <button
            onClick={handleSoundToggle}
            className={`w-12 h-7 rounded-full relative transition-colors ${
              sound ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                sound ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Export */}
      <button
        onClick={handleExport}
        className="w-full bg-[#1a1a1a] rounded-xl p-4 mb-3 text-left font-medium text-sm text-blue-400"
      >
        Export Weight Log (CSV) →
      </button>

      {/* Reset */}
      {!showReset ? (
        <button
          onClick={() => setShowReset(true)}
          className="w-full bg-[#1a1a1a] rounded-xl p-4 text-left font-medium text-sm text-red-400"
        >
          Reset All Data
        </button>
      ) : (
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
          <p className="text-sm text-red-400 mb-3">This will delete ALL your data. Are you sure?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowReset(false)}
              className="flex-1 py-2 rounded-xl bg-[#333] text-gray-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold"
            >
              Yes, Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
