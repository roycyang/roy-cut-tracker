// Phase 1 meals (Weeks 1-6)
const PHASE1_MEAL1 = {
  time: '9:00am',
  name: 'Post-Workout Shake',
  ingredients: '1 scoop Whey Isolate + Collagen Peptides + 8oz almond milk + 5g Creatine',
  cal: 210, protein: 39, carbs: 2, fat: 2,
};

const PHASE1_MEAL2 = {
  0: { // Sunday
    time: '12:00pm', name: 'Whole Food (Rest Day)',
    ingredients: '3 eggs + 4oz chicken + salad (no avocado)',
    cal: 480, protein: 42, carbs: 5,
  },
  1: { // Monday (Lift)
    time: '12:00pm', name: 'Whole Food (Lift Day)',
    ingredients: '4 eggs + 5oz grilled chicken + salad + ½ avocado',
    cal: 650, protein: 50, carbs: 8,
  },
  2: { // Tuesday (Core)
    time: '12:00pm', name: 'Whole Food (Core Day)',
    ingredients: '3 eggs + 4oz turkey + salad + olive oil & lemon',
    cal: 550, protein: 44, carbs: 6,
  },
  3: { // Wednesday (Lift)
    time: '12:00pm', name: 'Whole Food (Lift Day)',
    ingredients: '4 eggs + 5oz grilled chicken + salad + ½ avocado',
    cal: 650, protein: 50, carbs: 8,
  },
  4: { // Thursday (Core)
    time: '12:00pm', name: 'Whole Food (Core Day)',
    ingredients: '3 eggs + 4oz turkey + salad + olive oil & lemon',
    cal: 550, protein: 44, carbs: 6,
  },
  5: { // Friday (Lift)
    time: '12:00pm', name: 'Whole Food (Lift Day)',
    ingredients: '4 eggs + 5oz lean steak + salad + ½ avocado',
    cal: 680, protein: 52, carbs: 8,
  },
  6: { // Saturday (Core)
    time: '12:00pm', name: 'Whole Food (Core Day)',
    ingredients: '3 eggs + 4oz turkey + salad + olive oil & lemon',
    cal: 550, protein: 44, carbs: 6,
  },
};

const PHASE1_MEAL3 = {
  0: { time: '5:30pm', name: 'White Cheddar Chicken & Broccoli "Grits"', cal: 500, protein: 38, carbs: 12 },
  1: { time: '5:30pm', name: 'Smoky Queso Shredded Beef', cal: 540, protein: 42, carbs: 11 },
  2: { time: '5:30pm', name: 'Garlic & Herb Chicken Breast', cal: 440, protein: 44, carbs: 8 },
  3: { time: '5:30pm', name: 'Italian-Style Chicken & Mozzarella', cal: 480, protein: 43, carbs: 7 },
  4: { time: '5:30pm', name: 'Garlic & Herb Chicken Breast', cal: 440, protein: 44, carbs: 8 },
  5: { time: '5:30pm', name: 'Bacon & Onion Pork Tenderloin', cal: 510, protein: 40, carbs: 6 },
  6: { time: '5:30pm', name: 'Chicken Florentine', cal: 470, protein: 41, carbs: 9 },
};

// Phase 2/3 meals (Weeks 7-10)
const PHASE3_MEAL1 = {
  time: '9:00am',
  name: 'Post-Workout Shake (UPGRADED)',
  ingredients: '2 scoops Whey Isolate + Collagen Peptides + 8oz almond milk + 5g Creatine',
  cal: 330, protein: 63, carbs: 3, fat: 3,
};

const PHASE3_MEAL2 = {
  time: '12:00pm',
  name: 'Lean Whole Food',
  ingredients: '3 eggs + 3oz chicken or turkey + large salad + lemon/vinegar dressing only',
  cal: 380, protein: 40, carbs: 4,
};

const PHASE3_MEAL3_ROTATION = [
  { time: '5:30pm', name: 'Garlic & Herb Chicken Breast', cal: 440, protein: 44, carbs: 8 },
  { time: '5:30pm', name: 'Chicken Florentine', cal: 470, protein: 41, carbs: 9 },
  { time: '5:30pm', name: 'Italian-Style Chicken & Mozzarella', cal: 480, protein: 43, carbs: 7 },
];

export function getMealsForDay(date, phase) {
  const dayOfWeek = date.getDay();
  const isBarrysDay = phase >= 2 && dayOfWeek === 3; // Wednesday

  if (phase >= 2) {
    // Phase 2/3 meals
    const meal3 = isBarrysDay
      ? PHASE3_MEAL3_ROTATION[2] // Italian-Style Chicken & Mozzarella (highest cal)
      : PHASE3_MEAL3_ROTATION[dayOfWeek % 3];

    return {
      meals: [
        { ...PHASE3_MEAL1, id: 'meal1' },
        { ...PHASE3_MEAL2, id: 'meal2' },
        { ...meal3, id: 'meal3' },
      ],
      isBarrysDay,
      barrysNote: isBarrysDay ? "Barry's day — calorie target ~1,450. Consider ½ banana pre-class." : null,
    };
  }

  // Phase 1 meals
  return {
    meals: [
      { ...PHASE1_MEAL1, id: 'meal1' },
      { ...PHASE1_MEAL2[dayOfWeek], id: 'meal2' },
      { ...PHASE1_MEAL3[dayOfWeek], id: 'meal3' },
    ],
    isBarrysDay: false,
    barrysNote: null,
  };
}
