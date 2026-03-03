import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

function resizeImage(file, maxSize = 1024) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function MealEditModal({ meal, override, onSave, onClose }) {
  const initial = override || meal;
  const [tab, setTab] = useState('manual');
  const [name, setName] = useState(initial.name);
  const [cal, setCal] = useState(String(initial.cal));
  const [protein, setProtein] = useState(String(initial.protein));
  const [carbs, setCarbs] = useState(String(initial.carbs));
  const [fat, setFat] = useState(String(initial.fat || ''));
  const [text, setText] = useState('');
  const [hint, setHint] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleSave = () => {
    const calNum = parseInt(cal, 10);
    if (!calNum || calNum <= 0) return;
    const entry = {
      name: name.trim() || meal.name,
      ingredients: lastResult?.ingredients || meal.ingredients,
      cal: calNum,
      protein: parseInt(protein, 10) || 0,
      carbs: parseInt(carbs, 10) || 0,
      fat: parseInt(fat, 10) || 0,
      source: tab,
    };
    if (imageData) {
      entry.photo = `data:image/jpeg;base64,${imageData.base64}`;
    }
    onSave(entry);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    const { base64, mimeType } = await resizeImage(file);
    setImageData({ base64, mimeType });
    setError(null);
  };

  const applyResult = (data) => {
    setName(data.name || meal.name);
    setCal(String(data.cal || ''));
    setProtein(String(data.protein || ''));
    setCarbs(String(data.carbs || ''));
    setFat(String(data.fat || ''));
    setLastResult(data);
    setAiDone(true);
    setRevision('');
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    const body = {
      type: tab === 'photo' ? 'image' : 'text',
      plannedMeal: `${meal.name} — ${meal.ingredients}`,
    };

    if (tab === 'describe') {
      if (!text.trim()) { setLoading(false); return; }
      body.text = text.trim();
    } else {
      if (!imageData) { setLoading(false); return; }
      body.imageBase64 = imageData.base64;
      body.imageMimeType = imageData.mimeType;
      if (hint.trim()) body.hint = hint.trim();
    }

    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      applyResult(data);
    } catch (err) {
      setError(err.message || 'Could not analyze meal. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!revision.trim() || !lastResult) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'revision',
          previousResult: lastResult,
          revision: revision.trim(),
          plannedMeal: `${meal.name} — ${meal.ingredients}`,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      applyResult(data);
    } catch (err) {
      setError(err.message || 'Could not revise. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedo = () => {
    setAiDone(false);
    setLastResult(null);
    setName(meal.name);
    setCal(String(meal.cal));
    setProtein(String(meal.protein));
    setCarbs(String(meal.carbs));
    setFat(String(meal.fat || ''));
    setError(null);
    setRevision('');
  };

  const canAnalyze = tab === 'describe' ? text.trim().length > 0 : !!imageData;
  const showForm = tab === 'manual' || aiDone;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Edit Meal</h3>
          <button onClick={onClose} className="text-gray-500 text-xl leading-none">&times;</button>
        </div>

        {/* Planned meal reference */}
        <div className="bg-[#111] rounded-xl p-3 mb-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Planned</p>
          <p className="text-sm text-gray-300">{meal.name}</p>
          <p className="text-xs text-gray-500">{meal.ingredients}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111] rounded-xl p-1 mb-4">
          {[
            { id: 'manual', label: 'Manual' },
            { id: 'describe', label: 'Describe' },
            { id: 'photo', label: 'Photo' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); handleRedo(); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-[#2a2a2a] text-white' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Describe input */}
        {tab === 'describe' && !aiDone && (
          <>
            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="e.g. grilled chicken breast with rice and broccoli"
              rows={3}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none mb-3"
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
                canAnalyze && !loading ? 'bg-blue-600 active:bg-blue-700' : 'bg-[#333] text-gray-500'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                'Analyze with AI'
              )}
            </button>
          </>
        )}

        {/* Photo input */}
        {tab === 'photo' && !aiDone && (
          <>
            <div className="mb-3">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Meal" className="w-full h-48 object-cover rounded-xl" />
                  <button
                    onClick={() => { setImagePreview(null); setImageData(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white text-sm"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 border-2 border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center text-gray-500 active:border-blue-500"
                >
                  <span className="text-3xl mb-1">📷</span>
                  <span className="text-sm">Tap to take or choose a photo</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <textarea
              value={hint}
              onChange={e => setHint(e.target.value)}
              placeholder="Optional: describe what's in the photo (e.g. poke bowl without rice, low carb)"
              rows={2}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none mb-3"
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
                canAnalyze && !loading ? 'bg-blue-600 active:bg-blue-700' : 'bg-[#333] text-gray-500'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                'Analyze with AI'
              )}
            </button>
          </>
        )}

        {/* Editable form: Manual tab always, or after AI prefill */}
        {showForm && (
          <>
            {aiDone && (
              <p className="text-[10px] text-blue-400 uppercase tracking-wide mb-2">AI Estimate — edit if needed</p>
            )}
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name"
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white font-semibold mb-3 focus:outline-none focus:border-blue-500"
            />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Calories *</label>
                <input
                  type="number"
                  inputMode="numeric"
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

            {/* Revision input — after AI results */}
            {aiDone && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={revision}
                  onChange={e => setRevision(e.target.value)}
                  placeholder="Adjust: e.g. no rice, smaller portion"
                  className="flex-1 bg-[#111] border border-[#333] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  onKeyDown={e => e.key === 'Enter' && handleRevise()}
                />
                <button
                  onClick={handleRevise}
                  disabled={!revision.trim() || loading}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    revision.trim() && !loading ? 'bg-blue-600 text-white active:bg-blue-700' : 'bg-[#333] text-gray-500'
                  }`}
                >
                  {loading ? '...' : 'Revise'}
                </button>
              </div>
            )}

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <div className="flex gap-3">
              {aiDone ? (
                <>
                  <button onClick={handleRedo} className="flex-1 py-3 rounded-xl bg-[#333] text-gray-300 font-semibold">
                    Redo
                  </button>
                  <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold">
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-[#333] text-gray-300 font-semibold">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold">
                    Save
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
