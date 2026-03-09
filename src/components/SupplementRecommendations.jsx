import { useState } from 'react';

// Amazon affiliate tag — replace with your actual Associates tag
const AFFILIATE_TAG = 'cutapp-20';

const TIERS = [
  {
    id: 'essential',
    label: 'Essential',
    tagline: 'The only two you actually need',
    color: '#22c55e',
    items: [
      {
        name: 'Whey Protein Isolate',
        why: 'Most efficient way to hit your protein target. Decades of research, fast-absorbing, versatile.',
        pick: 'Optimum Nutrition Gold Standard 100% Whey',
        asin: 'B000QSNYGI',
        price: '~$30',
      },
      {
        name: 'Creatine Monohydrate',
        why: 'The most researched supplement in existence. Proven to improve strength, recovery, and even cognition. Dirt cheap.',
        pick: 'Thorne Creatine Monohydrate',
        asin: 'B0021FQHPM',
        price: '~$20',
      },
    ],
  },
  {
    id: 'worth_it',
    label: 'Worth It',
    tagline: 'Genuinely helpful if you\'re going hard',
    color: '#3b82f6',
    items: [
      {
        name: 'Collagen Peptides',
        why: 'Supports joint health during hard training. Especially valuable during aggressive cuts when your body is under stress.',
        pick: 'Vital Proteins Collagen Peptides',
        asin: 'B00K6JUG4K',
        price: '~$25',
      },
      {
        name: 'Pre-Workout',
        why: 'Convenience + consistency. Not magic — it\'s mostly caffeine + citrulline. But it helps you show up and perform.',
        pick: 'Transparent Labs BULK Pre-Workout',
        asin: 'B087TFC12C',
        price: '~$50',
      },
      {
        name: 'Electrolytes',
        why: 'During aggressive calorie cuts, you lose more electrolytes. Prevents cramps, brain fog, and fatigue.',
        pick: 'LMNT Electrolyte Drink Mix',
        asin: 'B08GSTFF99',
        price: '~$45',
      },
    ],
  },
  {
    id: 'save_money',
    label: 'Save Your Money',
    tagline: 'We\'re not going to sell you stuff you don\'t need',
    color: '#ef4444',
    items: [
      {
        name: 'BCAAs',
        why: 'If you\'re hitting your protein target (and you are, with this plan), BCAAs are redundant. Your whey shake already has them.',
        pick: null,
        verdict: 'Skip it',
      },
      {
        name: 'Fat Burners',
        why: 'Mostly caffeine in a fancy package with a 10x markup. Have a coffee instead. The calorie deficit does the work.',
        pick: null,
        verdict: 'Skip it',
      },
      {
        name: '"Recovery" Supplements',
        why: 'Sleep, protein, and water beat any recovery supplement on the market. Save your money for actual food.',
        pick: null,
        verdict: 'Skip it',
      },
    ],
  },
];

function affiliateUrl(asin) {
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

export default function SupplementRecommendations() {
  const [expandedTier, setExpandedTier] = useState('essential');

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Supplement Guide</h3>

      {/* Transparent disclosure */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-3">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          <span className="text-white font-medium">Full transparency:</span> Links below are Amazon affiliate
          links — I get a small % that helps keep Cut free. I'm an indie developer building this for the
          love of the sport, not to sell you stuff you don't need. That's why I tell you what to <span className="text-red-400">skip</span> too.
        </p>
      </div>

      {TIERS.map(tier => {
        const isExpanded = expandedTier === tier.id;
        return (
          <div key={tier.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedTier(isExpanded ? null : tier.id)}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="font-semibold text-sm">{tier.label}</span>
                <span className="text-[10px] text-gray-500">{tier.tagline}</span>
              </div>
              <span className="text-gray-500 text-xs">{isExpanded ? '\u25BE' : '\u25B8'}</span>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {tier.items.map(item => (
                  <div key={item.name} className="bg-[#111] rounded-xl p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-semibold text-sm">{item.name}</span>
                      {item.verdict && (
                        <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full font-medium">
                          {item.verdict}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{item.why}</p>
                    {item.pick && item.asin && (
                      <a
                        href={affiliateUrl(item.asin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500 transition-colors"
                      >
                        <span className="font-medium">{item.pick}</span>
                        <span className="text-gray-500">{item.price}</span>
                        <span className="text-blue-400 ml-1">{'\u2192'}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
