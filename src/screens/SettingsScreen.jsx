import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { handleSoundToggle: onSoundToggle, handleThemeToggle: onThemeToggle } = useOutletContext();
  const navigate = useNavigate();
  const storage = useStorage();
  const { user, profile, signOut } = useAuth();

  const [sound, setSound] = useState(storage.isSoundEnabled());
  const [theme, setThemeState] = useState(storage.getTheme());
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

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    storage.setTheme(next);
    onThemeToggle?.(next);
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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {
      // If signOut fails, just reload
      window.location.reload();
    }
  };

  return (
    <div className="pb-4 animate-fade-in">
      <h2 className="text-lg font-bold mb-4">Settings</h2>

      {/* Profile section */}
      {user && profile && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-xl">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              profile.display_name?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{profile.display_name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      )}

      {/* Quick nav links */}
      <div className="space-y-1 mb-4">
        {[
          { path: '/badges', label: 'Badges', icon: '\u{1F3C5}' },
          { path: '/supplements', label: 'Supplements & Streaks', icon: '\u{1F48A}' },
          { path: '/photos', label: 'Progress Photos', icon: '\u{1F4F8}' },
        ].map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="w-full bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-3 text-left active:bg-[#222]"
          >
            <span className="text-lg">{link.icon}</span>
            <span className="font-medium text-sm flex-1">{link.label}</span>
            <span className="text-gray-600">{'\u203A'}</span>
          </button>
        ))}
      </div>

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
              {goalWeight} lbs {'\u203A'}
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

      {/* Theme */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Light Mode</span>
          <button
            onClick={handleThemeToggle}
            className={`w-12 h-7 rounded-full relative transition-colors ${
              theme === 'light' ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                theme === 'light' ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
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
        Export Weight Log (CSV) {'\u203A'}
      </button>

      {/* Legal */}
      <div className="space-y-1 mb-3">
        {[
          { path: '/privacy', label: 'Privacy Policy' },
          { path: '/terms', label: 'Terms of Use' },
        ].map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="w-full bg-[#1a1a1a] rounded-xl p-4 text-left font-medium text-sm text-gray-400 active:bg-[#222]"
          >
            {link.label} {'\u203A'}
          </button>
        ))}
      </div>

      {/* Sign Out */}
      {user && (
        <button
          onClick={handleSignOut}
          className="w-full bg-[#1a1a1a] rounded-xl p-4 mb-3 text-left font-medium text-sm text-orange-400"
        >
          Sign Out
        </button>
      )}

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
