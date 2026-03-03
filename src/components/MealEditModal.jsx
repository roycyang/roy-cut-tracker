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

export default function MealEditModal({ meal, onSave, onClose }) {
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [hint, setHint] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState('');
  const fileInputRef = useRef(null);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    const { base64, mimeType } = await resizeImage(file);
    setImageData({ base64, mimeType });
    setError(null);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const body = {
      type: tab === 'photo' ? 'image' : tab,
      plannedMeal: `${meal.name} — ${meal.ingredients}`,
    };

    if (tab === 'text') {
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
      setResult(data);
      setRevision('');
    } catch (err) {
      setError(err.message || 'Could not analyze meal. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!revision.trim() || !result) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'revision',
          previousResult: result,
          revision: revision.trim(),
          plannedMeal: `${meal.name} — ${meal.ingredients}`,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      setResult(data);
      setRevision('');
    } catch (err) {
      setError(err.message || 'Could not revise. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    const entry = {
      name: result.name,
      ingredients: result.ingredients,
      cal: result.cal,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      source: tab,
    };
    if (imageData) {
      entry.photo = `data:image/jpeg;base64,${imageData.base64}`;
    }
    onSave(entry);
  };

  const canAnalyze = tab === 'text' ? text.trim().length > 0 : !!imageData;

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
            { id: 'text', label: 'Type It' },
            { id: 'photo', label: 'Photo' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setResult(null); setError(null); setRevision(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-[#2a2a2a] text-white' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {!result && (
          <>
            {tab === 'text' ? (
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. grilled chicken breast with rice and broccoli"
                rows={3}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none mb-3"
              />
            ) : (
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
              </>
            )}

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

        {/* Result comparison */}
        {result && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Planned */}
              <div className="bg-[#111] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Planned</p>
                <p className="text-sm font-semibold mb-2">{meal.name}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Cal</span><span className="text-orange-400">{meal.cal}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Protein</span><span className="text-blue-400">{meal.protein}g</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Carbs</span><span className="text-green-400">{meal.carbs}g</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Fat</span><span className="text-yellow-400">{meal.fat || '—'}g</span></div>
                </div>
              </div>
              {/* Actual */}
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-3">
                <p className="text-[10px] text-blue-400 uppercase tracking-wide mb-2">Actual (AI)</p>
                <p className="text-sm font-semibold mb-2">{result.name}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Cal</span><span className="text-orange-400 font-semibold">{result.cal}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Protein</span><span className="text-blue-400 font-semibold">{result.protein}g</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Carbs</span><span className="text-green-400 font-semibold">{result.carbs}g</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Fat</span><span className="text-yellow-400 font-semibold">{result.fat}g</span></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">{result.ingredients}</p>

            {/* Revision input */}
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

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setResult(null); setError(null); setRevision(''); }}
                className="flex-1 py-3 rounded-xl bg-[#333] text-gray-300 font-semibold"
              >
                Redo
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold"
              >
                Use This
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
