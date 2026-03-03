export const START_DATE = new Date(2026, 2, 2); // Mar 2, 2026
export const END_DATE = new Date(2026, 4, 10);  // May 10, 2026
export const START_WEIGHT = 148.4;
export const GOAL_WEIGHT_MIN = 137;
export const GOAL_WEIGHT_MAX = 138;
export const EATING_WINDOW = { start: '9:00am', end: '6:00pm' };

export const WEEKLY_TARGETS = [
  { week: 1, startDate: '2026-03-02', target: 145.5, phase: 1 },
  { week: 2, startDate: '2026-03-09', target: 144.8, phase: 1 },
  { week: 3, startDate: '2026-03-16', target: 144.0, phase: 1 },
  { week: 4, startDate: '2026-03-23', target: 143.2, phase: 1 },
  { week: 5, startDate: '2026-03-30', target: 142.5, phase: 1 },
  { week: 6, startDate: '2026-04-06', target: 141.8, phase: 1 },
  { week: 7, startDate: '2026-04-13', target: 141.0, phase: 2 },
  { week: 8, startDate: '2026-04-20', target: 140.0, phase: 3 },
  { week: 9, startDate: '2026-04-27', target: 138.5, phase: 3 },
  { week: 10, startDate: '2026-05-04', target: 137.5, phase: 3 },
];

export const PHASE_CONFIG = {
  1: { label: 'Phase 1', color: '#2563eb', calRange: '1,500–1,650', protein: '130g+' },
  2: { label: 'Phase 2', color: '#dc2626', calRange: '1,300–1,450', protein: '145g+' },
  3: { label: 'Phase 3', color: '#7c3aed', calRange: '1,200–1,300', protein: '145g+' },
};

// 0=Sun, 1=Mon, ... 6=Sat
export const TRAINING_WEEKS_1_6 = {
  0: { type: 'Rest', emoji: '😴' },
  1: { type: 'Lift', emoji: '💪' },
  2: { type: 'Core', emoji: '🧘' },
  3: { type: 'Lift', emoji: '💪' },
  4: { type: 'Core', emoji: '🧘' },
  5: { type: 'Lift', emoji: '💪' },
  6: { type: 'Core', emoji: '🧘' },
};

export const TRAINING_WEEKS_7_10 = {
  0: { type: 'Active Recovery', emoji: '🚶' },
  1: { type: 'Lift', emoji: '💪' },
  2: { type: 'Core', emoji: '🧘' },
  3: { type: "Barry's", emoji: '🔥' },
  4: { type: 'Core', emoji: '🧘' },
  5: { type: 'Lift', emoji: '💪' },
  6: { type: 'Core', emoji: '🧘' },
};

export const SUPPLEMENTS = [
  { id: 'preworkout', name: 'Pre-Workout', time: '7:30am' },
  { id: 'creatine', name: 'Creatine (5g)', time: null },
  { id: 'whey', name: 'Whey Protein Isolate', time: null },
  { id: 'collagen', name: 'Collagen Peptides', time: null },
];

export const MOTIVATION = {
  1: [
    "Slow is smooth. Smooth is shredded.",
    "Every meal logged is a rep toward your goal.",
    "Phase 1 is where discipline is built.",
    "You don't need motivation. You have a plan.",
    "Trust the process. The mirror will catch up.",
    "Consistency beats intensity every time.",
    "Your future self is watching.",
  ],
  2: [
    "Barry's is your secret weapon. Use it.",
    "You just leveled up the difficulty. Good.",
    "Phase 2. This is where most people quit. Not you.",
    "One Barry's session = a week of extra fat gone.",
    "The discomfort is the point.",
  ],
  3: [
    "The finish line is visible. Don't blink.",
    "Pain is temporary. Abs are forever.",
    "10 weeks of discipline for a year of confidence.",
    "You're in the red zone. Finish strong.",
    "This is it. Everything you've built leads here.",
  ],
  final: [
    "One week left. Leave nothing on the table.",
    "The version of you that started this would be proud.",
    "This is it. Everything you've built leads here.",
    "Almost there. Don't you dare slow down now.",
  ],
};

export const BADGES = [
  { id: 'first_blood', name: 'First Blood', emoji: '🩸', description: 'Log weight on Day 1' },
  { id: 'week1_warrior', name: 'Week 1 Warrior', emoji: '⚔️', description: 'Complete Week 1' },
  { id: 'halfway', name: 'Halfway There', emoji: '🧗', description: 'Complete Week 5' },
  { id: 'phase_shifter', name: 'Phase Shifter', emoji: '⚡', description: 'Enter Phase 2' },
  { id: 'red_zone', name: 'Red Zone', emoji: '🔴', description: 'Enter Phase 3' },
  { id: 'iron_will', name: 'Iron Will', emoji: '🦾', description: '7-day meal streak' },
  { id: 'supplement_king', name: 'Supplement King', emoji: '👑', description: '14-day supplement streak' },
  { id: 'on_target', name: 'On Target', emoji: '🎯', description: 'Hit any weekly weight target' },
  { id: 'five_for_five', name: '5 for 5', emoji: '🏹', description: 'Hit 5 weekly targets in a row' },
  { id: 'barrys_beast', name: "Barry's Beast", emoji: '🥊', description: "Complete all 4 Barry's sessions" },
  { id: 'full_send', name: 'Full Send', emoji: '💯', description: "Barry's + all meals + all supps same day" },
  { id: 'shredded', name: 'Shredded', emoji: '🏆', description: 'Hit final goal weight (≤137.5)' },
  { id: 'the_full_cut', name: 'The Full Cut', emoji: '🎖️', description: 'Complete all 10 weeks' },
];

export const XP_VALUES = {
  logWeight: 10,
  checkMeal: 15,
  allMeals: 25,
  checkSupplement: 5,
  allSupplements: 20,
  weeklyTarget: 100,
  streak7: 50,
  badgeUnlocked: 75,
  barrysSession: 50,
  completePhase1: 200,
  completePhase2: 100,
  finalGoal: 500,
};
