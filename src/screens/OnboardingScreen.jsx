import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlanContext } from '../context/UserPlanContext';
import { supabase } from '../utils/supabase';

const CUTTING_FOR_OPTIONS = [
  { id: 'summer', label: 'Summer body', emoji: '\u2600\uFE0F' },
  { id: 'wedding', label: 'Wedding', emoji: '\u{1F492}' },
  { id: 'health', label: 'Health milestone', emoji: '\u{1FA7A}' },
  { id: 'athletic', label: 'Athletic performance', emoji: '\u{1F3C3}' },
  { id: 'confidence', label: 'Confidence', emoji: '\u{1F4AA}' },
  { id: 'event', label: 'Reunion / Event', emoji: '\u{1F389}' },
  { id: 'postbaby', label: 'Post-baby', emoji: '\u{1F476}' },
  { id: 'newyear', label: 'New year reset', emoji: '\u{1F386}' },
  { id: 'bet', label: 'Bet / Challenge', emoji: '\u{1F91D}' },
];

const EXERCISE_OPTIONS = [
  { id: 'gym', label: 'Gym / Weight training' },
  { id: 'classes', label: 'Fitness classes (Barry\'s, Solidcore, etc.)' },
  { id: 'home', label: 'Home workouts' },
  { id: 'running', label: 'Running / Cardio' },
  { id: 'mixed', label: 'Mix of everything' },
];

const STEPS = [
  'welcome',
  'cutting_for',
  'current_weight',
  'goal_weight',
  'timeframe',
  'exercise',
  'dietary',
  'privacy',
  'photos',
  'terms',
  'generating',
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { setPlan } = usePlanContext();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    cutting_for: null,
    cutting_for_detail: '',
    current_weight: '',
    goal_weight: '',
    weeks: '',
    exercise: null,
    dietary: '',
    privacy_mode: 'social',
    share_photos_mode: 'blur',
    terms_accepted: false,
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  const currentStep = STEPS[step];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [step]);

  const update = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));
  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          ...answers,
          current_weight: parseFloat(answers.current_weight),
          goal_weight: parseFloat(answers.goal_weight),
          weeks: parseInt(answers.weeks, 10),
        }),
      });
      if (!res.ok) throw new Error('Failed to generate plan');
      const plan = await res.json();

      // Save plan to Supabase
      if (user) {
        await supabase.from('user_plans').upsert({
          user_id: user.id,
          ...plan,
        });
        await updateProfile({
          onboarding_completed: true,
          cutting_for: answers.cutting_for,
          cutting_for_detail: answers.cutting_for_detail,
          privacy_mode: answers.privacy_mode,
          share_photos_mode: answers.share_photos_mode,
        });
      }

      // Update local plan context
      setPlan(plan);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 max-w-lg mx-auto"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)' }}>

      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        {STEPS.filter(s => s !== 'generating').map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-blue-500' : 'bg-[#333]'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 space-y-6">
        {/* Welcome */}
        {currentStep === 'welcome' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2">Let's build your plan</h1>
            <p className="text-gray-400 text-sm mb-6">
              Answer a few questions and AI will create a personalized cut plan tailored to your goals.
            </p>
            <button onClick={next} className="w-full py-3 bg-blue-600 rounded-xl font-semibold text-white">
              Let's go
            </button>
          </div>
        )}

        {/* Cutting for */}
        {currentStep === 'cutting_for' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold mb-1">What are you cutting for?</h2>
            <p className="text-gray-500 text-sm mb-4">This helps us personalize your motivation.</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {CUTTING_FOR_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { update('cutting_for', opt.id); next(); }}
                  className={`p-3 rounded-xl text-left text-sm transition-all ${
                    answers.cutting_for === opt.id
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-[#1a1a1a] border border-transparent active:border-[#444]'
                  }`}
                >
                  <span className="text-lg mr-2">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current weight */}
        {currentStep === 'current_weight' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold mb-1">What's your current weight?</h2>
            <p className="text-gray-500 text-sm mb-4">In pounds. Be honest - this is just for you.</p>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={answers.current_weight}
              onChange={e => update('current_weight', e.target.value)}
              placeholder="e.g. 180"
              autoFocus
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-4 text-2xl text-white text-center font-bold focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={back} className="flex-1 py-3 bg-[#1a1a1a] rounded-xl text-gray-400 font-medium">Back</button>
              <button
                onClick={next}
                disabled={!answers.current_weight}
                className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Goal weight */}
        {currentStep === 'goal_weight' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold mb-1">What's your goal weight?</h2>
            <p className="text-gray-500 text-sm mb-4">We'll create a safe, gradual path to get there.</p>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={answers.goal_weight}
              onChange={e => update('goal_weight', e.target.value)}
              placeholder="e.g. 165"
              autoFocus
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-4 text-2xl text-white text-center font-bold focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={back} className="flex-1 py-3 bg-[#1a1a1a] rounded-xl text-gray-400 font-medium">Back</button>
              <button
                onClick={next}
                disabled={!answers.goal_weight}
                className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Timeframe */}
        {currentStep === 'timeframe' && (() => {
          const delta = parseFloat(answers.current_weight) - parseFloat(answers.goal_weight);
          const minWeeks = Math.max(4, Math.ceil(delta / 2)); // aggressive: 2 lbs/week
          const maxWeeks = Math.max(minWeeks + 2, Math.ceil(delta / 1)); // conservative: 1 lb/week
          const midLow = Math.round(minWeeks + (maxWeeks - minWeeks) * 0.33);
          const midHigh = Math.round(minWeeks + (maxWeeks - minWeeks) * 0.66);
          // Deduplicate and sort
          const options = [...new Set([minWeeks, midLow, midHigh, maxWeeks])].sort((a, b) => a - b);
          const recommendedWeek = String(midLow);
          // Auto-select recommended if current selection is out of range
          if (!options.map(String).includes(answers.weeks)) {
            update('weeks', recommendedWeek);
          }
          return (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold mb-1">How many weeks?</h2>
            <p className="text-gray-500 text-sm mb-4">
              We recommend 1-2 lbs/week for safe, sustainable loss.
              {delta > 0 && (
                <span className="block mt-1 text-blue-400">
                  That's {delta.toFixed(1)} lbs to lose.
                </span>
              )}
            </p>
            <div className="flex gap-2 mb-4">
              {options.map(w => {
                const ws = String(w);
                const isRecommended = ws === recommendedWeek;
                return (
                <button
                  key={w}
                  onClick={() => update('weeks', ws)}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all relative ${
                    answers.weeks === ws
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-400'
                  }`}
                >
                  {w}
                  {isRecommended && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">rec</span>
                  )}
                </button>
                );
              })}
            </div>
            <p className="text-gray-600 text-xs mb-4 text-center">
              {options[0]} wks = ~{(delta / options[0]).toFixed(1)} lbs/wk (aggressive) · {options[options.length - 1]} wks = ~{(delta / options[options.length - 1]).toFixed(1)} lbs/wk (steady)
            </p>
            <div className="flex gap-3">
              <button onClick={back} className="flex-1 py-3 bg-[#1a1a1a] rounded-xl text-gray-400 font-medium">Back</button>
              <button onClick={next} className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold text-white">Next</button>
            </div>
          </div>
          );
        })()}

        {/* Exercise */}
        {currentStep === 'exercise' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold mb-1">How do you like to train?</h2>
            <p className="text-gray-500 text-sm mb-4">We'll build your training schedule around this.</p>
            <div className="space-y-2 mb-4">
              {EXERCISE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { update('exercise', opt.id); next(); }}
                  className={`w-full p-3 rounded-xl text-left text-sm transition-all ${
                    answers.exercise === opt.id
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-[#1a1a1a] border border-transparent active:border-[#444]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={back} className="w-full py-3 bg-[#1a1a1a] rounded-xl text-gray-400 font-medium">Back</button>
          </div>
        )}

        {/* Dietary */}
        {currentStep === 'dietary' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold mb-1">Any dietary restrictions?</h2>
            <p className="text-gray-500 text-sm mb-4">Leave blank if none. We'll customize your meal templates.</p>
            <textarea
              value={answers.dietary}
              onChange={e => update('dietary', e.target.value)}
              placeholder="e.g. vegetarian, no dairy, keto, gluten-free..."
              rows={3}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={back} className="flex-1 py-3 bg-[#1a1a1a] rounded-xl text-gray-400 font-medium">Back</button>
              <button onClick={next} className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold text-white">Next</button>
            </div>
          </div>
        )}

        {/* Privacy */}
        {currentStep === 'privacy' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold mb-1">Social or private?</h2>
            <p className="text-gray-500 text-sm mb-4">You can change this anytime in settings.</p>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => { update('privacy_mode', 'social'); next(); }}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  answers.privacy_mode === 'social'
                    ? 'bg-blue-600/20 border border-blue-500'
                    : 'bg-[#1a1a1a] border border-transparent'
                }`}
              >
                <div className="font-semibold text-sm mb-1">Social</div>
                <div className="text-xs text-gray-400">Share milestones in the celebration feed. Your friends can cheer you on.</div>
              </button>
              <button
                onClick={() => { update('privacy_mode', 'private'); next(); }}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  answers.privacy_mode === 'private'
                    ? 'bg-blue-600/20 border border-blue-500'
                    : 'bg-[#1a1a1a] border border-transparent'
                }`}
              >
                <div className="font-semibold text-sm mb-1">Private</div>
                <div className="text-xs text-gray-400">Track in stealth mode. Nobody sees your progress but you.</div>
              </button>
            </div>
            <button onClick={back} className="w-full py-3 bg-[#1a1a1a] rounded-xl text-gray-400 font-medium">Back</button>
          </div>
        )}

        {/* Photos */}
        {currentStep === 'photos' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold mb-1">Progress photos in feed?</h2>
            <p className="text-gray-500 text-sm mb-4">If you share photos, how should they appear?</p>
            <div className="space-y-2 mb-4">
              {[
                { id: 'show', label: 'Show as-is', desc: 'Photos visible as you took them' },
                { id: 'blur', label: 'Blur face', desc: 'Face auto-blurred in the feed (you still see the original)' },
                { id: 'private', label: 'Keep private', desc: 'Photos never shared, visible only to you' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { update('share_photos_mode', opt.id); next(); }}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    answers.share_photos_mode === opt.id
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-[#1a1a1a] border border-transparent'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">{opt.label}</div>
                  <div className="text-xs text-gray-400">{opt.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={back} className="w-full py-3 bg-[#1a1a1a] rounded-xl text-gray-400 font-medium">Back</button>
          </div>
        )}

        {/* Terms */}
        {currentStep === 'terms' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold mb-1">Almost there</h2>
            <p className="text-gray-500 text-sm mb-4">Review and accept to generate your plan.</p>

            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Goal</span>
                <span className="text-white">{answers.current_weight} lbs → {answers.goal_weight} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration</span>
                <span className="text-white">{answers.weeks} weeks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Training</span>
                <span className="text-white">{EXERCISE_OPTIONS.find(o => o.id === answers.exercise)?.label || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mode</span>
                <span className="text-white capitalize">{answers.privacy_mode}</span>
              </div>
            </div>

            <label className="flex items-start gap-3 mb-4">
              <input
                type="checkbox"
                checked={answers.terms_accepted}
                onChange={e => update('terms_accepted', e.target.checked)}
                className="mt-1 w-5 h-5 accent-blue-600"
              />
              <span className="text-xs text-gray-400">
                I agree to the{' '}
                <a href="/privacy" target="_blank" className="text-blue-400 underline">Privacy Policy</a>
                {' '}and{' '}
                <a href="/terms" target="_blank" className="text-blue-400 underline">Terms of Use</a>.
                This is not medical advice. Consult a doctor before starting any diet.
              </span>
            </label>

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <div className="flex gap-3">
              <button onClick={back} className="flex-1 py-3 bg-[#1a1a1a] rounded-xl text-gray-400 font-medium">Back</button>
              <button
                onClick={() => { next(); handleGenerate(); }}
                disabled={!answers.terms_accepted || generating}
                className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold text-white disabled:opacity-40"
              >
                Generate My Plan
              </button>
            </div>
          </div>
        )}

        {/* Generating */}
        {currentStep === 'generating' && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4" />
            <h2 className="text-lg font-bold mb-2">Building your plan...</h2>
            <p className="text-gray-500 text-sm text-center">
              AI is creating a personalized {answers.weeks}-week cut plan just for you.
            </p>
            {error && (
              <div className="mt-4">
                <p className="text-red-400 text-sm mb-2">{error}</p>
                <button onClick={handleGenerate} className="text-blue-400 text-sm">Try again</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={chatEndRef} />
    </div>
  );
}
