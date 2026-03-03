import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WEEKLY_TARGETS, PHASE_CONFIG, START_WEIGHT } from '../data/config';
import { getCurrentWeek, toDateKey, formatDateRange, getWeekDateRange } from '../utils/dateUtils';
import { getWeights, getXP } from '../utils/storage';
import { getWeightsForWeek } from '../utils/badges';

export default function ProgressScreen() {
  const today = new Date();
  const currentWeek = getCurrentWeek(today);
  const weights = getWeights();
  const xp = getXP();

  // Build chart data
  const chartData = WEEKLY_TARGETS.map(wt => {
    const weekWeights = getWeightsForWeek(wt.week);
    const avg = weekWeights.length > 0
      ? parseFloat((weekWeights.reduce((a, b) => a + b, 0) / weekWeights.length).toFixed(1))
      : null;
    return {
      name: `W${wt.week}`,
      target: wt.target,
      actual: avg,
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
          const weekWeights = getWeightsForWeek(wt.week);
          const avg = weekWeights.length > 0
            ? (weekWeights.reduce((a, b) => a + b, 0) / weekWeights.length).toFixed(1)
            : null;
          const hitTarget = avg !== null && parseFloat(avg) <= wt.target;
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
                  {avg !== null ? (
                    <span className={`font-bold text-sm ${hitTarget ? 'text-green-400' : 'text-white'}`}>
                      {avg} lbs {hitTarget && '✓'}
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

      {/* Total XP */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
        <div className="text-3xl font-bold text-yellow-400">{xp.toLocaleString()}</div>
        <div className="text-sm text-gray-400 mt-1">Total Discipline Points</div>
      </div>
    </div>
  );
}
