import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Cell } from 'recharts';
import { WEEKLY_TARGETS, PHASE_CONFIG, START_WEIGHT, START_DATE } from '../data/config';
import { getCurrentWeek, getCurrentPhase, formatDateRange, getWeekDateRange, toDateKey } from '../utils/dateUtils';
import { getMealsForDay } from '../data/meals';
import { useStorage } from '../hooks/useStorage';
import { useData } from '../context/DataContext';
import { getWeightsForWeek } from '../utils/badges';

const PHASE_COLORS = { 1: '#2563eb', 2: '#dc2626', 3: '#7c3aed' };

export default function ProgressScreen() {
  const { getWeights, getXP } = useStorage();
  const { dailyLogs } = useData();
  const today = new Date();
  const currentWeek = getCurrentWeek(today);
  const weights = getWeights();
  const xp = getXP();

  // Build chart data
  const chartData = WEEKLY_TARGETS.map(wt => {
    const weekWeights = getWeightsForWeek(wt.week, weights);
    const lowest = weekWeights.length > 0
      ? parseFloat(Math.min(...weekWeights).toFixed(1))
      : null;
    return {
      name: `W${wt.week}`,
      target: wt.target,
      actual: lowest,
      week: wt.week,
    };
  });

  // Add start point
  const fullChartData = [{ name: 'Start', target: START_WEIGHT, actual: START_WEIGHT, week: 0 }, ...chartData];

  return (
    <div className="pb-4 animate-fade-in">
      <h2 className="text-lg font-bold mb-4">Progress</h2>

      {/* Chart */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={fullChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 11 }} />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#666', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#999' }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#666"
              strokeDasharray="5 5"
              dot={false}
              name="Target"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 4 }}
              connectNulls
              name="Actual"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Week grid */}
      <div className="space-y-2 mb-4">
        {WEEKLY_TARGETS.map(wt => {
          const { start, end } = getWeekDateRange(wt.week);
          const weekWeights = getWeightsForWeek(wt.week, weights);
          const lowest = weekWeights.length > 0
            ? Math.min(...weekWeights).toFixed(1)
            : null;
          const hitTarget = lowest !== null && parseFloat(lowest) <= wt.target;
          const isCurrent = wt.week === currentWeek;
          const isFuture = wt.week > currentWeek;
          const phaseConfig = PHASE_CONFIG[wt.phase];

          return (
            <div
              key={wt.week}
              className={`bg-[#1a1a1a] rounded-xl p-3 border transition-all ${
                hitTarget ? 'border-green-700/50 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                : isCurrent ? 'border-[#333]'
                : 'border-transparent'
              } ${isFuture ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Week {wt.week}</span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: phaseConfig.color + '33', color: phaseConfig.color }}
                  >
                    P{wt.phase}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/10 text-white">
                      NOW
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {lowest !== null ? (
                    <span className={`font-bold text-sm ${hitTarget ? 'text-green-400' : 'text-white'}`}>
                      {lowest} lbs {hitTarget && '✓'}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-sm">—</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">{formatDateRange(start, end)}</span>
                <span className="text-xs text-gray-500">Target: {wt.target}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calorie Bar Chart */}
      <CalorieChart dailyLogs={dailyLogs} />

      {/* Total XP */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
        <div className="text-3xl font-bold text-yellow-400">{xp.toLocaleString()}</div>
        <div className="text-sm text-gray-400 mt-1">Total Discipline Points</div>
      </div>
    </div>
  );
}

function CalorieChart({ dailyLogs }) {
  const data = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const result = [];
    const d = new Date(START_DATE);

    while (d <= today) {
      const dateKey = toDateKey(d);
      const log = dailyLogs[dateKey];
      const phase = getCurrentPhase(d);
      const { meals } = getMealsForDay(d, phase);
      const mealChecks = log?.meals || {};
      const overrides = log?.meal_overrides || {};
      const extraMeals = log?.extra_meals || [];

      let cal = 0;
      for (const m of meals) {
        if (mealChecks[m.id]) {
          const resolved = overrides[m.id] ? { ...m, ...overrides[m.id] } : m;
          cal += resolved.cal;
        }
      }
      for (const em of extraMeals) {
        cal += em.cal || 0;
      }

      if (cal > 0) {
        result.push({
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          cal,
          phase,
        });
      }

      d.setDate(d.getDate() + 1);
    }
    return result;
  }, [dailyLogs]);

  if (data.length === 0) return null;

  // Calorie target range from phase config (use phase 1 as default band)
  const calMin = 1200;
  const calMax = 1650;

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Daily Calories</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} interval={Math.max(0, Math.floor(data.length / 8))} />
          <YAxis domain={[0, 'dataMax + 200']} tick={{ fill: '#666', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
            labelStyle={{ color: '#999' }}
            formatter={(value) => [`${value} cal`, 'Calories']}
          />
          <ReferenceArea y1={calMin} y2={calMax} fill="#22c55e" fillOpacity={0.08} />
          <Bar dataKey="cal" name="Calories" radius={[2, 2, 0, 0]} maxBarSize={16}>
            {data.map((entry, i) => (
              <Cell key={i} fill={PHASE_COLORS[entry.phase] || '#2563eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-2">
        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          <span className="w-2 h-2 rounded-full bg-[#2563eb]" /> P1
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          <span className="w-2 h-2 rounded-full bg-[#dc2626]" /> P2
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          <span className="w-2 h-2 rounded-full bg-[#7c3aed]" /> P3
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          <span className="w-2 h-2 rounded-sm bg-green-500/20 border border-green-500/30" /> Target
        </span>
      </div>
    </div>
  );
}
