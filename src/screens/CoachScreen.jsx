import { useState, useRef, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStorage } from '../hooks/useStorage';
import { usePlan } from '../context/UserPlanContext';
import { getCurrentWeek, getCurrentPhase, toDateKey } from '../utils/dateUtils';
import { computeStreaks } from '../utils/streaks';

export default function CoachScreen() {
  const { showToast } = useOutletContext();
  const storage = useStorage();
  const plan = usePlan();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I'm your AI coach. I can help with your cut plan, answer nutrition questions, suggest adjustments, or just give you a pep talk. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = useCallback(() => {
    const today = new Date();
    const dateKey = toDateKey(today);
    const week = getCurrentWeek(today, plan);
    const phase = getCurrentPhase(today, storage.getPhaseOverride(), plan);
    const streaks = computeStreaks(storage);
    const weight = storage.getWeightForDate(dateKey);
    const xp = storage.getXP();
    const weights = storage.getWeights();
    const recentWeights = Object.entries(weights)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7)
      .map(([date, w]) => `${date}: ${w} lbs`);

    return {
      week,
      phase,
      streaks,
      todayWeight: weight,
      xp,
      recentWeights,
      plan: {
        start_weight: plan.start_weight,
        goal_weight_min: plan.goal_weight_min,
        goal_weight_max: plan.goal_weight_max,
        total_weeks: plan.total_weeks,
        phase_config: plan.phase_config,
      },
    };
  }, [storage, plan]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const context = buildContext();
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-10), // last 10 messages for context
          context,
        }),
      });

      if (!res.ok) throw new Error('Coach unavailable');
      const data = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

      // Handle tool calls if any
      if (data.actions) {
        for (const action of data.actions) {
          if (action.type === 'log_weight' && action.weight) {
            storage.logWeight(action.date || toDateKey(new Date()), action.weight);
            showToast(`Logged ${action.weight} lbs`);
          }
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-4 animate-fade-in flex flex-col" style={{ minHeight: 'calc(100vh - 140px)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Coach</h2>
        <span className="text-xs text-gray-500 bg-[#1a1a1a] px-2 py-1 rounded-full">AI - Free</span>
      </div>

      {/* Chat messages */}
      <div className="flex-1 space-y-3 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a1a] rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Upgrade banner */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/30 rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Want human coaching?</p>
            <p className="text-[10px] text-gray-400">Get personalized feedback from a real coach.</p>
          </div>
          <button className="text-xs bg-purple-600 px-3 py-1.5 rounded-lg font-semibold text-white">
            From $29
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask your coach anything..."
          className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="px-4 py-3 bg-blue-600 rounded-xl text-white font-semibold disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
