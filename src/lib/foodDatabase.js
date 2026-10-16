// Built-in food database — zero-credit, client-side. All values per serving (quantity/unit).
// Sources: USDA-equivalent averages. Approximate; for estimation only.

export const FOOD_CATEGORIES = [
  'All', 'Protein', 'Dairy & Cheese', 'Grains', 'Fruits', 'Vegetables',
  'Legumes & Nuts', 'Drinks', 'Supplements', 'Fast Food', 'Snacks & Desserts', 'Condiments', 'Custom',
];

export const FOODS = [
  // --- Protein (chicken, beef, pork, fish, seafood, eggs, turkey) ---
  { name: 'Chicken Breast (grilled)', category: 'Protein', quantity: 100, unit: 'g', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0, sugar_g: 0, sodium_mg: 74 },
  { name: 'Chicken Thigh (grilled, skinless)', category: 'Protein', quantity: 100, unit: 'g', calories: 209, protein_g: 26, carbs_g: 0, fat_g: 11, fiber_g: 0, sugar_g: 0, sodium_mg: 88 },
  { name: 'Ground Beef 85% (cooked)', category: 'Protein', quantity: 100, unit: 'g', calories: 250, protein_g: 17, carbs_g: 0, fat_g: 20, fiber_g: 0, sugar_g: 0, sodium_mg: 75 },
  { name: 'Ground Beef 93% (cooked)', category: 'Protein', quantity: 100, unit: 'g', calories: 176, protein_g: 24, carbs_g: 0, fat_g: 8, fiber_g: 0, sugar_g: 0, sodium_mg: 70 },
  { name: 'Sirloin Steak (grilled)', category: 'Protein', quantity: 100, unit: 'g', calories: 271, protein_g: 25, carbs_g: 0, fat_g: 19, fiber_g: 0, sugar_g: 0, sodium_mg: 56 },
  { name: 'Pork Chop (grilled)', category: 'Protein', quantity: 100, unit: 'g', calories: 231, protein_g: 26, carbs_g: 0, fat_g: 15, fiber_g: 0, sugar_g: 0, sodium_mg: 62 },
  { name: 'Turkey Breast (roasted)', category: 'Protein', quantity: 100, unit: 'g', calories: 135, protein_g: 30, carbs_g: 0, fat_g: 1, fiber_g: 0, sugar_g: 0, sodium_mg: 54 },
  { name: 'Ground Turkey (cooked)', category: 'Protein', quantity: 100, unit: 'g', calories: 189, protein_g: 27, carbs_g: 0, fat_g: 8, fiber_g: 0, sugar_g: 0, sodium_mg: 66 },
  { name: 'Bacon (2 slices)', category: 'Protein', quantity: 2, unit: 'slices', calories: 92, protein_g: 6, carbs_g: 0.2, fat_g: 7, fiber_g: 0, sugar_g: 0, sodium_mg: 680 },
  { name: 'Salmon (baked)', category: 'Protein', quantity: 100, unit: 'g', calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, fiber_g: 0, sugar_g: 0, sodium_mg: 59 },
  { name: 'Tuna (canned in water)', category: 'Protein', quantity: 100, unit: 'g', calories: 116, protein_g: 26, carbs_g: 0, fat_g: 1, fiber_g: 0, sugar_g: 0, sodium_mg: 247 },
  { name: 'Cod (baked)', category: 'Protein', quantity: 100, unit: 'g', calories: 82, protein_g: 18, carbs_g: 0, fat_g: 0.7, fiber_g: 0, sugar_g: 0, sodium_mg: 54 },
  { name: 'Tilapia (baked)', category: 'Protein', quantity: 100, unit: 'g', calories: 96, protein_g: 20, carbs_g: 0, fat_g: 2, fiber_g: 0, sugar_g: 0, sodium_mg: 52 },
  { name: 'Shrimp (cooked)', category: 'Protein', quantity: 100, unit: 'g', calories: 99, protein_g: 24, carbs_g: 0.2, fat_g: 0.3, fiber_g: 0, sugar_g: 0, sodium_mg: 111 },
  { name: 'Egg (whole, large)', category: 'Protein', quantity: 1, unit: 'egg', calories: 72, protein_g: 6.3, carbs_g: 0.4, fat_g: 4.8, fiber_g: 0, sugar_g: 0.1, sodium_mg: 71 },
  { name: 'Egg White (1 large)', category: 'Protein', quantity: 1, unit: 'egg white', calories: 17, protein_g: 3.6, carbs_g: 0.2, fat_g: 0, fiber_g: 0, sugar_g: 0.1, sodium_mg: 55 },
  { name: 'Scrambled Eggs (2 eggs)', category: 'Protein', quantity: 2, unit: 'eggs', calories: 182, protein_g: 12, carbs_g: 2, fat_g: 14, fiber_g: 0, sugar_g: 1, sodium_mg: 308 },
  { name: 'Chicken Wing (1 piece)', category: 'Protein', quantity: 1, unit: 'wing', calories: 86, protein_g: 8, carbs_g: 0, fat_g: 6, fiber_g: 0, sugar_g: 0, sodium_mg: 64 },
  { name: 'Ham Slice (85g)', category: 'Protein', quantity: 85, unit: 'g', calories: 139, protein_g: 18, carbs_g: 1.5, fat_g: 6, fiber_g: 0, sugar_g: 1, sodium_mg: 1100 },
  { name: 'Roast Beef (85g)', category: 'Protein', quantity: 85, unit: 'g', calories: 122, protein_g: 17, carbs_g: 0, fat_g: 5, fiber_g: 0, sugar_g: 0, sodium_mg: 360 },

  // --- Dairy & Cheese ---
  { name: 'Greek Yogurt (plain)', category: 'Dairy & Cheese', quantity: 170, unit: 'g', calories: 100, protein_g: 17, carbs_g: 6, fat_g: 0.7, fiber_g: 0, sugar_g: 6, sodium_mg: 62 },
  { name: 'Yogurt (plain, low-fat)', category: 'Dairy & Cheese', quantity: 170, unit: 'g', calories: 121, protein_g: 8, carbs_g: 12, fat_g: 4, fiber_g: 0, sugar_g: 12, sodium_mg: 100 },
  { name: 'Milk (whole, 1 cup)', category: 'Dairy & Cheese', quantity: 1, unit: 'cup', calories: 149, protein_g: 8, carbs_g: 12, fat_g: 8, fiber_g: 0, sugar_g: 12, sodium_mg: 105 },
  { name: 'Milk (skim, 1 cup)', category: 'Dairy & Cheese', quantity: 1, unit: 'cup', calories: 83, protein_g: 8, carbs_g: 12, fat_g: 0.2, fiber_g: 0, sugar_g: 12, sodium_mg: 103 },
  { name: 'Almond Milk (1 cup)', category: 'Dairy & Cheese', quantity: 1, unit: 'cup', calories: 39, protein_g: 1, carbs_g: 1.5, fat_g: 2.5, fiber_g: 0.5, sugar_g: 0.6, sodium_mg: 173 },
  { name: 'Oat Milk (1 cup)', category: 'Dairy & Cheese', quantity: 1, unit: 'cup', calories: 120, protein_g: 3, carbs_g: 16, fat_g: 5, fiber_g: 2, sugar_g: 7, sodium_mg: 115 },
  { name: 'Cottage Cheese (1 cup)', category: 'Dairy & Cheese', quantity: 1, unit: 'cup', calories: 206, protein_g: 28, carbs_g: 6, fat_g: 9, fiber_g: 0, sugar_g: 6, sodium_mg: 747 },
  { name: 'Cheddar Cheese (28g)', category: 'Dairy & Cheese', quantity: 28, unit: 'g', calories: 113, protein_g: 7, carbs_g: 0.4, fat_g: 9, fiber_g: 0, sugar_g: 0.1, sodium_mg: 174 },
  { name: 'Mozzarella (28g)', category: 'Dairy & Cheese', quantity: 28, unit: 'g', calories: 85, protein_g: 6, carbs_g: 0.6, fat_g: 6.3, fiber_g: 0, sugar_g: 0.3, sodium_mg: 150 },
  { name: 'Parmesan (28g)', category: 'Dairy & Cheese', quantity: 28, unit: 'g', calories: 111, protein_g: 10, carbs_g: 0.9, fat_g: 7.3, fiber_g: 0, sugar_g: 0.2, sodium_mg: 390 },
  { name: 'Cream Cheese (28g)', category: 'Dairy & Cheese', quantity: 28, unit: 'g', calories: 99, protein_g: 2, carbs_g: 0.8, fat_g: 9.7, fiber_g: 0, sugar_g: 0.5, sodium_mg: 84 },
  { name: 'Butter (1 tbsp)', category: 'Dairy & Cheese', quantity: 1, unit: 'tbsp', calories: 102, protein_g: 0.1, carbs_g: 0, fat_g: 11.5, fiber_g: 0, sugar_g: 0, sodium_mg: 82 },
  { name: 'String Cheese (1 stick)', category: 'Dairy & Cheese', quantity: 1, unit: 'stick', calories: 80, protein_g: 7, carbs_g: 1, fat_g: 6, fiber_g: 0, sugar_g: 0.5, sodium_mg: 200 },

  // --- Grains (rice, pasta, bread, cereals, oats) ---
  { name: 'White Rice (cooked, 1 cup)', category: 'Grains', quantity: 1, unit: 'cup', calories: 205, protein_g: 4.3, carbs_g: 45, fat_g: 0.4, fiber_g: 0.6, sugar_g: 0, sodium_mg: 2 },
  { name: 'Brown Rice (cooked, 1 cup)', category: 'Grains', quantity: 1, unit: 'cup', calories: 216, protein_g: 5, carbs_g: 45, fat_g: 1.8, fiber_g: 3.5, sugar_g: 0.7, sodium_mg: 10 },
  { name: 'Pasta (cooked, 1 cup)', category: 'Grains', quantity: 1, unit: 'cup', calories: 220, protein_g: 8, carbs_g: 43, fat_g: 1.3, fiber_g: 2.5, sugar_g: 1, sodium_mg: 6 },
  { name: 'Whole Wheat Bread (1 slice)', category: 'Grains', quantity: 1, unit: 'slice', calories: 81, protein_g: 4, carbs_g: 14, fat_g: 1.1, fiber_g: 1.9, sugar_g: 1.4, sodium_mg: 134 },
  { name: 'White Bread (1 slice)', category: 'Grains', quantity: 1, unit: 'slice', calories: 77, protein_g: 2.6, carbs_g: 14, fat_g: 1, fiber_g: 0.8, sugar_g: 1.6, sodium_mg: 142 },
  { name: 'Oats (dry, 40g)', category: 'Grains', quantity: 40, unit: 'g', calories: 150, protein_g: 5, carbs_g: 27, fat_g: 3, fiber_g: 4, sugar_g: 0.5, sodium_mg: 2 },
  { name: 'Oatmeal (cooked, 1 cup)', category: 'Grains', quantity: 1, unit: 'cup', calories: 154, protein_g: 6, carbs_g: 27, fat_g: 3, fiber_g: 4, sugar_g: 1, sodium_mg: 115 },
  { name: 'Quinoa (cooked, 1 cup)', category: 'Grains', quantity: 1, unit: 'cup', calories: 222, protein_g: 8, carbs_g: 39, fat_g: 3.6, fiber_g: 5, sugar_g: 1.6, sodium_mg: 13 },
  { name: 'Bagel (1 medium)', category: 'Grains', quantity: 1, unit: 'bagel', calories: 245, protein_g: 10, carbs_g: 48, fat_g: 1.5, fiber_g: 1.6, sugar_g: 4, sodium_mg: 430 },
  { name: 'Tortilla (1 medium)', category: 'Grains', quantity: 1, unit: 'tortilla', calories: 144, protein_g: 4, carbs_g: 24, fat_g: 3.5, fiber_g: 1.5, sugar_g: 1, sodium_mg: 340 },
  { name: 'Cornflakes (1 cup)', category: 'Grains', quantity: 1, unit: 'cup', calories: 100, protein_g: 2, carbs_g: 24, fat_g: 0, fiber_g: 1, sugar_g: 3, sodium_mg: 202 },
  { name: 'Couscous (cooked, 1 cup)', category: 'Grains', quantity: 1, unit: 'cup', calories: 176, protein_g: 6, carbs_g: 36, fat_g: 0.2, fiber_g: 2.2, sugar_g: 0.2, sodium_mg: 8 },
  { name: 'Pancake (1 medium)', category: 'Grains', quantity: 1, unit: 'pancake', calories: 149, protein_g: 4, carbs_g: 22, fat_g: 4.5, fiber_g: 0.7, sugar_g: 5, sodium_mg: 290 },
  { name: 'Granola (1/2 cup)', category: 'Grains', quantity: 0.5, unit: 'cup', calories: 212, protein_g: 5, carbs_g: 33, fat_g: 8, fiber_g: 4, sugar_g: 12, sodium_mg: 65 },

  // --- Fruits ---
  { name: 'Banana (1 medium)', category: 'Fruits', quantity: 1, unit: 'banana', calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4, fiber_g: 3.1, sugar_g: 14, sodium_mg: 1 },
  { name: 'Apple (1 medium)', category: 'Fruits', quantity: 1, unit: 'apple', calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, fiber_g: 4.4, sugar_g: 19, sodium_mg: 2 },
  { name: 'Orange (1 medium)', category: 'Fruits', quantity: 1, unit: 'orange', calories: 62, protein_g: 1.2, carbs_g: 15, fat_g: 0.2, fiber_g: 3, sugar_g: 12, sodium_mg: 0 },
  { name: 'Strawberries (1 cup)', category: 'Fruits', quantity: 1, unit: 'cup', calories: 49, protein_g: 1, carbs_g: 12, fat_g: 0.5, fiber_g: 3, sugar_g: 7.4, sodium_mg: 2 },
  { name: 'Blueberries (1 cup)', category: 'Fruits', quantity: 1, unit: 'cup', calories: 84, protein_g: 1.1, carbs_g: 21, fat_g: 0.5, fiber_g: 3.6, sugar_g: 15, sodium_mg: 1 },
  { name: 'Grapes (1 cup)', category: 'Fruits', quantity: 1, unit: 'cup', calories: 104, protein_g: 1.1, carbs_g: 27, fat_g: 0.2, fiber_g: 1.4, sugar_g: 23, sodium_mg: 3 },
  { name: 'Watermelon (1 cup)', category: 'Fruits', quantity: 1, unit: 'cup', calories: 46, protein_g: 0.9, carbs_g: 11, fat_g: 0.2, fiber_g: 0.6, sugar_g: 9, sodium_mg: 2 },
  { name: 'Pineapple (1 cup)', category: 'Fruits', quantity: 1, unit: 'cup', calories: 82, protein_g: 0.9, carbs_g: 22, fat_g: 0.2, fiber_g: 2.3, sugar_g: 16, sodium_mg: 2 },
  { name: 'Mango (1 cup)', category: 'Fruits', quantity: 1, unit: 'cup', calories: 99, protein_g: 1.4, carbs_g: 25, fat_g: 0.6, fiber_g: 2.6, sugar_g: 23, sodium_mg: 2 },
  { name: 'Pear (1 medium)', category: 'Fruits', quantity: 1, unit: 'pear', calories: 101, protein_g: 0.6, carbs_g: 27, fat_g: 0.2, fiber_g: 5.5, sugar_g: 17, sodium_mg: 2 },
  { name: 'Peach (1 medium)', category: 'Fruits', quantity: 1, unit: 'peach', calories: 59, protein_g: 1.4, carbs_g: 15, fat_g: 0.4, fiber_g: 2.3, sugar_g: 13, sodium_mg: 0 },
  { name: 'Avocado (1/2 medium)', category: 'Fruits', quantity: 0.5, unit: 'avocado', calories: 161, protein_g: 2, carbs_g: 8.6, fat_g: 15, fiber_g: 6.7, sugar_g: 0.7, sodium_mg: 7 },
  { name: 'Cantaloupe (1 cup)', category: 'Fruits', quantity: 1, unit: 'cup', calories: 54, protein_g: 1.4, carbs_g: 13, fat_g: 0.3, fiber_g: 1.4, sugar_g: 12, sodium_mg: 14 },
  { name: 'Raspberries (1 cup)', category: 'Fruits', quantity: 1, unit: 'cup', calories: 64, protein_g: 1.5, carbs_g: 15, fat_g: 0.8, fiber_g: 8, sugar_g: 5.4, sodium_mg: 1 },
  { name: 'Lemon (1 medium)', category: 'Fruits', quantity: 1, unit: 'lemon', calories: 17, protein_g: 0.6, carbs_g: 5.4, fat_g: 0.2, fiber_g: 1.6, sugar_g: 1.5, sodium_mg: 1 },

  // --- Vegetables ---
  { name: 'Broccoli (cooked, 1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 55, protein_g: 3.7, carbs_g: 11, fat_g: 0.6, fiber_g: 5, sugar_g: 2.2, sodium_mg: 64 },
  { name: 'Spinach (raw, 1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 7, protein_g: 0.9, carbs_g: 1.1, fat_g: 0.1, fiber_g: 0.7, sugar_g: 0.1, sodium_mg: 24 },
  { name: 'Carrot (1 medium)', category: 'Vegetables', quantity: 1, unit: 'carrot', calories: 25, protein_g: 0.6, carbs_g: 6, fat_g: 0.1, fiber_g: 1.7, sugar_g: 2.9, sodium_mg: 42 },
  { name: 'Sweet Potato (1 medium)', category: 'Vegetables', quantity: 1, unit: 'potato', calories: 103, protein_g: 2.3, carbs_g: 24, fat_g: 0.1, fiber_g: 3.8, sugar_g: 7, sodium_mg: 41 },
  { name: 'Baked Potato (1 medium)', category: 'Vegetables', quantity: 1, unit: 'potato', calories: 161, protein_g: 4.3, carbs_g: 37, fat_g: 0.2, fiber_g: 3.8, sugar_g: 1.6, sodium_mg: 17 },
  { name: 'Tomato (1 medium)', category: 'Vegetables', quantity: 1, unit: 'tomato', calories: 22, protein_g: 1.1, carbs_g: 4.8, fat_g: 0.2, fiber_g: 1.5, sugar_g: 3.2, sodium_mg: 6 },
  { name: 'Cucumber (1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 16, protein_g: 0.7, carbs_g: 3.8, fat_g: 0.1, fiber_g: 0.5, sugar_g: 1.7, sodium_mg: 2 },
  { name: 'Bell Pepper (1 medium)', category: 'Vegetables', quantity: 1, unit: 'pepper', calories: 24, protein_g: 0.9, carbs_g: 5.3, fat_g: 0.1, fiber_g: 2, sugar_g: 3.6, sodium_mg: 2 },
  { name: 'Onion (1 medium)', category: 'Vegetables', quantity: 1, unit: 'onion', calories: 44, protein_g: 1.2, carbs_g: 10, fat_g: 0.1, fiber_g: 1.9, sugar_g: 4.7, sodium_mg: 4 },
  { name: 'Lettuce (1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 5, protein_g: 0.5, carbs_g: 1, fat_g: 0.1, fiber_g: 0.5, sugar_g: 0.5, sodium_mg: 2 },
  { name: 'Asparagus (1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 27, protein_g: 3, carbs_g: 5, fat_g: 0.3, fiber_g: 2.8, sugar_g: 1.9, sodium_mg: 3 },
  { name: 'Mushrooms (1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 15, protein_g: 2.2, carbs_g: 2.3, fat_g: 0.2, fiber_g: 0.7, sugar_g: 1.4, sodium_mg: 4 },
  { name: 'Zucchini (1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 19, protein_g: 1.5, carbs_g: 3.9, fat_g: 0.3, fiber_g: 1.2, sugar_g: 2.5, sodium_mg: 9 },
  { name: 'Cauliflower (1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 25, protein_g: 2.3, carbs_g: 4.9, fat_g: 0.1, fiber_g: 2, sugar_g: 1.9, sodium_mg: 30 },
  { name: 'Green Beans (1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 31, protein_g: 1.8, carbs_g: 7, fat_g: 0.1, fiber_g: 2.7, sugar_g: 1.4, sodium_mg: 6 },
  { name: 'Brussels Sprouts (1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 38, protein_g: 3, carbs_g: 8, fat_g: 0.3, fiber_g: 3.3, sugar_g: 2, sodium_mg: 22 },
  { name: 'Kale (1 cup)', category: 'Vegetables', quantity: 1, unit: 'cup', calories: 33, protein_g: 2.9, carbs_g: 6.7, fat_g: 0.6, fiber_g: 1.3, sugar_g: 1.4, sodium_mg: 18 },

  // --- Legumes & Nuts ---
  { name: 'Black Beans (1 cup)', category: 'Legumes & Nuts', quantity: 1, unit: 'cup', calories: 227, protein_g: 15, carbs_g: 41, fat_g: 0.9, fiber_g: 15, sugar_g: 0.7, sodium_mg: 1 },
  { name: 'Chickpeas (1 cup)', category: 'Legumes & Nuts', quantity: 1, unit: 'cup', calories: 269, protein_g: 14.5, carbs_g: 45, fat_g: 4.2, fiber_g: 12.5, sugar_g: 8, sodium_mg: 47 },
  { name: 'Lentils (1 cup)', category: 'Legumes & Nuts', quantity: 1, unit: 'cup', calories: 230, protein_g: 18, carbs_g: 40, fat_g: 0.8, fiber_g: 16, sugar_g: 3.6, sodium_mg: 4 },
  { name: 'Almonds (28g)', category: 'Legumes & Nuts', quantity: 28, unit: 'g', calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14, fiber_g: 3.5, sugar_g: 1.2, sodium_mg: 0 },
  { name: 'Peanut Butter (2 tbsp)', category: 'Legumes & Nuts', quantity: 2, unit: 'tbsp', calories: 188, protein_g: 8, carbs_g: 6, fat_g: 16, fiber_g: 2, sugar_g: 3, sodium_mg: 152 },
  { name: 'Walnuts (28g)', category: 'Legumes & Nuts', quantity: 28, unit: 'g', calories: 185, protein_g: 4.3, carbs_g: 3.9, fat_g: 18, fiber_g: 1.9, sugar_g: 1, sodium_mg: 1 },
  { name: 'Cashews (28g)', category: 'Legumes & Nuts', quantity: 28, unit: 'g', calories: 157, protein_g: 5, carbs_g: 8.6, fat_g: 12, fiber_g: 0.9, sugar_g: 1.3, sodium_mg: 3 },
  { name: 'Peanuts (28g)', category: 'Legumes & Nuts', quantity: 28, unit: 'g', calories: 161, protein_g: 7.3, carbs_g: 4.6, fat_g: 14, fiber_g: 2.4, sugar_g: 1.3, sodium_mg: 95 },
  { name: 'Chia Seeds (28g)', category: 'Legumes & Nuts', quantity: 28, unit: 'g', calories: 138, protein_g: 5, carbs_g: 12, fat_g: 9, fiber_g: 10, sugar_g: 0, sodium_mg: 5 },
  { name: 'Flax Seeds (28g)', category: 'Legumes & Nuts', quantity: 28, unit: 'g', calories: 152, protein_g: 5.2, carbs_g: 8.2, fat_g: 12, fiber_g: 7.6, sugar_g: 0.4, sodium_mg: 9 },
  { name: 'Hummus (2 tbsp)', category: 'Legumes & Nuts', quantity: 2, unit: 'tbsp', calories: 70, protein_g: 2, carbs_g: 6, fat_g: 3.6, fiber_g: 2, sugar_g: 0.4, sodium_mg: 130 },
  { name: 'Tofu (100g)', category: 'Legumes & Nuts', quantity: 100, unit: 'g', calories: 76, protein_g: 8, carbs_g: 1.9, fat_g: 4.8, fiber_g: 0.3, sugar_g: 0.6, sodium_mg: 14 },
  { name: 'Edamame (1 cup)', category: 'Legumes & Nuts', quantity: 1, unit: 'cup', calories: 189, protein_g: 17, carbs_g: 14, fat_g: 8, fiber_g: 8, sugar_g: 3, sodium_mg: 9 },
  { name: 'Pistachios (28g)', category: 'Legumes & Nuts', quantity: 28, unit: 'g', calories: 158, protein_g: 5.8, carbs_g: 7.7, fat_g: 12.6, fiber_g: 3, sugar_g: 2.2, sodium_mg: 135 },
  { name: 'Pumpkin Seeds (28g)', category: 'Legumes & Nuts', quantity: 28, unit: 'g', calories: 151, protein_g: 8, carbs_g: 5, fat_g: 12, fiber_g: 1.7, sugar_g: 0.4, sodium_mg: 5 },

  // --- Drinks ---
  { name: 'Coffee (black, 1 cup)', category: 'Drinks', quantity: 1, unit: 'cup', calories: 2, protein_g: 0.3, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 5 },
  { name: 'Coffee with Milk (1 cup)', category: 'Drinks', quantity: 1, unit: 'cup', calories: 56, protein_g: 3, carbs_g: 5, fat_g: 2.5, fiber_g: 0, sugar_g: 5, sodium_mg: 45 },
  { name: 'Green Tea (1 cup)', category: 'Drinks', quantity: 1, unit: 'cup', calories: 2, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 2 },
  { name: 'Orange Juice (1 cup)', category: 'Drinks', quantity: 1, unit: 'cup', calories: 112, protein_g: 1.7, carbs_g: 26, fat_g: 0.5, fiber_g: 0.5, sugar_g: 21, sodium_mg: 2 },
  { name: 'Cola (1 can)', category: 'Drinks', quantity: 1, unit: 'can', calories: 140, protein_g: 0, carbs_g: 39, fat_g: 0, fiber_g: 0, sugar_g: 39, sodium_mg: 45 },
  { name: 'Diet Cola (1 can)', category: 'Drinks', quantity: 1, unit: 'can', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 40 },
  { name: 'Energy Drink (1 can)', category: 'Drinks', quantity: 1, unit: 'can', calories: 110, protein_g: 0, carbs_g: 28, fat_g: 0, fiber_g: 0, sugar_g: 28, sodium_mg: 100 },
  { name: 'Beer (1 can)', category: 'Drinks', quantity: 1, unit: 'can', calories: 154, protein_g: 1.6, carbs_g: 13, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 14 },
  { name: 'Red Wine (5 oz)', category: 'Drinks', quantity: 5, unit: 'oz', calories: 125, protein_g: 0.1, carbs_g: 3.8, fat_g: 0, fiber_g: 0, sugar_g: 0.9, sodium_mg: 6 },
  { name: 'Smoothie (mixed, 1 cup)', category: 'Drinks', quantity: 1, unit: 'cup', calories: 130, protein_g: 2, carbs_g: 28, fat_g: 1, fiber_g: 3, sugar_g: 22, sodium_mg: 20 },
  { name: 'Coconut Water (1 cup)', category: 'Drinks', quantity: 1, unit: 'cup', calories: 46, protein_g: 1.7, carbs_g: 8.9, fat_g: 0.5, fiber_g: 1.5, sugar_g: 6.3, sodium_mg: 252 },
  { name: 'Apple Juice (1 cup)', category: 'Drinks', quantity: 1, unit: 'cup', calories: 114, protein_g: 0.5, carbs_g: 28, fat_g: 0.3, fiber_g: 0.5, sugar_g: 24, sodium_mg: 10 },
  { name: 'Iced Tea (1 cup)', category: 'Drinks', quantity: 1, unit: 'cup', calories: 80, protein_g: 0, carbs_g: 20, fat_g: 0, fiber_g: 0, sugar_g: 20, sodium_mg: 5 },

  // --- Supplements ---
  { name: 'Whey Protein (1 scoop, 30g)', category: 'Supplements', quantity: 1, unit: 'scoop', calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1.5, fiber_g: 0, sugar_g: 1, sodium_mg: 100 },
  { name: 'Casein Protein (1 scoop, 30g)', category: 'Supplements', quantity: 1, unit: 'scoop', calories: 110, protein_g: 24, carbs_g: 3, fat_g: 1, fiber_g: 0, sugar_g: 1, sodium_mg: 90 },
  { name: 'Plant Protein (1 scoop, 30g)', category: 'Supplements', quantity: 1, unit: 'scoop', calories: 115, protein_g: 20, carbs_g: 5, fat_g: 2, fiber_g: 2, sugar_g: 1, sodium_mg: 110 },
  { name: 'BCAA (1 scoop)', category: 'Supplements', quantity: 1, unit: 'scoop', calories: 0, protein_g: 5, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 },
  { name: 'Creatine (5g)', category: 'Supplements', quantity: 5, unit: 'g', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 },
  { name: 'Pre-Workout (1 scoop)', category: 'Supplements', quantity: 1, unit: 'scoop', calories: 15, protein_g: 0, carbs_g: 3, fat_g: 0, fiber_g: 0, sugar_g: 3, sodium_mg: 50 },
  { name: 'Protein Bar (1 bar)', category: 'Supplements', quantity: 1, unit: 'bar', calories: 220, protein_g: 20, carbs_g: 20, fat_g: 7, fiber_g: 5, sugar_g: 8, sodium_mg: 200 },
  { name: 'Meal Replacement Shake', category: 'Supplements', quantity: 1, unit: 'shake', calories: 200, protein_g: 20, carbs_g: 20, fat_g: 6, fiber_g: 5, sugar_g: 5, sodium_mg: 250 },
  { name: 'Electrolyte Drink (1 scoop)', category: 'Supplements', quantity: 1, unit: 'scoop', calories: 80, protein_g: 0, carbs_g: 20, fat_g: 0, fiber_g: 0, sugar_g: 20, sodium_mg: 380 },
  { name: 'Fish Oil (1 softgel)', category: 'Supplements', quantity: 1, unit: 'softgel', calories: 10, protein_g: 0, carbs_g: 0, fat_g: 1, fiber_g: 0, sugar_g: 0, sodium_mg: 0 },

  // --- Fast Food ---
  { name: 'Cheeseburger (1)', category: 'Fast Food', quantity: 1, unit: 'burger', calories: 303, protein_g: 15, carbs_g: 33, fat_g: 14, fiber_g: 1.5, sugar_g: 7, sodium_mg: 680 },
  { name: 'Pizza Slice (1)', category: 'Fast Food', quantity: 1, unit: 'slice', calories: 285, protein_g: 12, carbs_g: 36, fat_g: 10, fiber_g: 2.5, sugar_g: 4, sodium_mg: 640 },
  { name: 'French Fries (medium)', category: 'Fast Food', quantity: 1, unit: 'serving', calories: 365, protein_g: 4, carbs_g: 48, fat_g: 17, fiber_g: 4, sugar_g: 0.3, sodium_mg: 246 },
  { name: 'Fried Chicken (1 piece)', category: 'Fast Food', quantity: 1, unit: 'piece', calories: 320, protein_g: 21, carbs_g: 11, fat_g: 19, fiber_g: 0.5, sugar_g: 0, sodium_mg: 750 },
  { name: 'Taco (1)', category: 'Fast Food', quantity: 1, unit: 'taco', calories: 170, protein_g: 8, carbs_g: 13, fat_g: 9, fiber_g: 3, sugar_g: 1, sodium_mg: 360 },
  { name: 'Burrito (1)', category: 'Fast Food', quantity: 1, unit: 'burrito', calories: 326, protein_g: 14, carbs_g: 44, fat_g: 11, fiber_g: 6, sugar_g: 3, sodium_mg: 950 },
  { name: 'Hot Dog (1)', category: 'Fast Food', quantity: 1, unit: 'hot dog', calories: 151, protein_g: 5, carbs_g: 2, fat_g: 13, fiber_g: 0, sugar_g: 1, sodium_mg: 560 },
  { name: 'Sub Sandwich (6 inch)', category: 'Fast Food', quantity: 1, unit: 'sub', calories: 282, protein_g: 18, carbs_g: 46, fat_g: 3.5, fiber_g: 3, sugar_g: 6, sodium_mg: 950 },
  { name: 'Chicken Nuggets (6 pieces)', category: 'Fast Food', quantity: 6, unit: 'pieces', calories: 280, protein_g: 13, carbs_g: 15, fat_g: 18, fiber_g: 0.5, sugar_g: 0.3, sodium_mg: 540 },
  { name: 'Sushi Roll (8 pieces)', category: 'Fast Food', quantity: 8, unit: 'pieces', calories: 290, protein_g: 9, carbs_g: 38, fat_g: 11, fiber_g: 2, sugar_g: 8, sodium_mg: 590 },
  { name: 'Fried Rice (1 cup)', category: 'Fast Food', quantity: 1, unit: 'cup', calories: 333, protein_g: 12, carbs_g: 43, fat_g: 12, fiber_g: 2, sugar_g: 1, sodium_mg: 600 },
  { name: 'Ramen (1 bowl)', category: 'Fast Food', quantity: 1, unit: 'bowl', calories: 436, protein_g: 10, carbs_g: 60, fat_g: 16, fiber_g: 3, sugar_g: 4, sodium_mg: 1820 },

  // --- Snacks & Desserts ---
  { name: 'Potato Chips (28g)', category: 'Snacks & Desserts', quantity: 28, unit: 'g', calories: 152, protein_g: 2, carbs_g: 15, fat_g: 10, fiber_g: 1.4, sugar_g: 0.2, sodium_mg: 149 },
  { name: 'Popcorn (1 cup)', category: 'Snacks & Desserts', quantity: 1, unit: 'cup', calories: 31, protein_g: 1, carbs_g: 6, fat_g: 0.4, fiber_g: 1.2, sugar_g: 0.1, sodium_mg: 96 },
  { name: 'Dark Chocolate (28g)', category: 'Snacks & Desserts', quantity: 28, unit: 'g', calories: 170, protein_g: 2.2, carbs_g: 13, fat_g: 12, fiber_g: 2, sugar_g: 10, sodium_mg: 3 },
  { name: 'Cookie (1 medium)', category: 'Snacks & Desserts', quantity: 1, unit: 'cookie', calories: 148, protein_g: 1.5, carbs_g: 20, fat_g: 7, fiber_g: 0.6, sugar_g: 12, sodium_mg: 95 },
  { name: 'Ice Cream (1/2 cup)', category: 'Snacks & Desserts', quantity: 0.5, unit: 'cup', calories: 137, protein_g: 2.3, carbs_g: 16, fat_g: 7, fiber_g: 0.5, sugar_g: 14, sodium_mg: 53 },
  { name: 'Granola Bar (1 bar)', category: 'Snacks & Desserts', quantity: 1, unit: 'bar', calories: 132, protein_g: 3, carbs_g: 18, fat_g: 5, fiber_g: 1, sugar_g: 8, sodium_mg: 110 },
  { name: 'Crackers (5 pieces)', category: 'Snacks & Desserts', quantity: 5, unit: 'crackers', calories: 80, protein_g: 1, carbs_g: 10, fat_g: 4, fiber_g: 0.5, sugar_g: 1.5, sodium_mg: 140 },
  { name: 'Pretzels (28g)', category: 'Snacks & Desserts', quantity: 28, unit: 'g', calories: 108, protein_g: 3, carbs_g: 22, fat_g: 1, fiber_g: 1, sugar_g: 1, sodium_mg: 385 },
  { name: 'Pudding (1 cup)', category: 'Snacks & Desserts', quantity: 1, unit: 'cup', calories: 210, protein_g: 4, carbs_g: 40, fat_g: 5, fiber_g: 0.5, sugar_g: 28, sodium_mg: 450 },
  { name: 'Brownie (1 piece)', category: 'Snacks & Desserts', quantity: 1, unit: 'brownie', calories: 132, protein_g: 2, carbs_g: 18, fat_g: 7, fiber_g: 1, sugar_g: 13, sodium_mg: 100 },
  { name: 'Rice Cakes (1)', category: 'Snacks & Desserts', quantity: 1, unit: 'cake', calories: 35, protein_g: 0.7, carbs_g: 7, fat_g: 0.3, fiber_g: 0.4, sugar_g: 0, sodium_mg: 23 },
  { name: 'Trail Mix (28g)', category: 'Snacks & Desserts', quantity: 28, unit: 'g', calories: 132, protein_g: 4, carbs_g: 12, fat_g: 8, fiber_g: 2, sugar_g: 6, sodium_mg: 70 },

  // --- Condiments ---
  { name: 'Olive Oil (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 119, protein_g: 0, carbs_g: 0, fat_g: 14, fiber_g: 0, sugar_g: 0, sodium_mg: 0 },
  { name: 'Ketchup (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 17, protein_g: 0.4, carbs_g: 4, fat_g: 0, fiber_g: 0.1, sugar_g: 3.2, sodium_mg: 154 },
  { name: 'Mayonnaise (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 90, protein_g: 0.1, carbs_g: 0.1, fat_g: 10, fiber_g: 0, sugar_g: 0.1, sodium_mg: 88 },
  { name: 'Mustard (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 10, protein_g: 0.5, carbs_g: 1, fat_g: 0.6, fiber_g: 0.3, sugar_g: 0.3, sodium_mg: 120 },
  { name: 'Soy Sauce (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 8, protein_g: 0.9, carbs_g: 0.8, fat_g: 0.1, fiber_g: 0, sugar_g: 0.2, sodium_mg: 879 },
  { name: 'Hot Sauce (1 tsp)', category: 'Condiments', quantity: 1, unit: 'tsp', calories: 1, protein_g: 0, carbs_g: 0.2, fat_g: 0, fiber_g: 0, sugar_g: 0.1, sodium_mg: 130 },
  { name: 'Honey (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 64, protein_g: 0.1, carbs_g: 17, fat_g: 0, fiber_g: 0, sugar_g: 17, sodium_mg: 1 },
  { name: 'Maple Syrup (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 52, protein_g: 0, carbs_g: 13, fat_g: 0, fiber_g: 0, sugar_g: 12, sodium_mg: 2 },
  { name: 'BBQ Sauce (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 29, protein_g: 0, carbs_g: 7, fat_g: 0, fiber_g: 0.1, sugar_g: 6, sodium_mg: 175 },
  { name: 'Ranch Dressing (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 73, protein_g: 0.4, carbs_g: 0.8, fat_g: 7.7, fiber_g: 0, sugar_g: 0.5, sodium_mg: 122 },
  { name: 'Salsa (1/4 cup)', category: 'Condiments', quantity: 0.25, unit: 'cup', calories: 10, protein_g: 0.5, carbs_g: 2, fat_g: 0, fiber_g: 0.6, sugar_g: 1, sodium_mg: 230 },
  { name: 'Vinegar (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 3, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 },
  { name: 'Sugar (1 tsp)', category: 'Condiments', quantity: 1, unit: 'tsp', calories: 16, protein_g: 0, carbs_g: 4, fat_g: 0, fiber_g: 0, sugar_g: 4, sodium_mg: 0 },
  { name: 'Pesto (1 tbsp)', category: 'Condiments', quantity: 1, unit: 'tbsp', calories: 80, protein_g: 1.5, carbs_g: 1, fat_g: 8, fiber_g: 0.3, sugar_g: 0.3, sodium_mg: 150 },
  { name: 'Sriracha (1 tsp)', category: 'Condiments', quantity: 1, unit: 'tsp', calories: 5, protein_g: 0.1, carbs_g: 1, fat_g: 0.1, fiber_g: 0, sugar_g: 0.8, sodium_mg: 100 },
];

// ============================================================
// Quantity parsing & proportional nutrition helpers (deterministic)
// ============================================================

// Parse a quantity string that may use '.' or ',' as decimal separator.
// Normalizes comma to dot and returns a decimal number (never NaN).
export function parseQty(val) {
  if (val == null || val === '') return 0;
  const s = String(val).replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Whether a food is defined per 100g (quantity entered as a multiplier of 100g).
export function isPer100g(food) {
  return Number(food.quantity) === 100 && food.unit === 'g';
}

// Default quantity when the user enters nothing.
// Per-100g foods default to 1 (one 100g portion); other foods default to their base quantity.
export function defaultQty(food) {
  return isPer100g(food) ? 1 : Number(food.quantity) || 1;
}

// Compute the proportional factor for a food given an entered quantity.
// Per-100g foods: qty is a multiplier (0.5 = 50g = 50% of 100g values).
// Other foods: qty is the actual amount/count, factor = qty / base quantity.
export function foodFactor(food, qty) {
  const q = parseQty(qty);
  if (!q) return 0;
  return isPer100g(food) ? q : q / (Number(food.quantity) || 1);
}

// Convert a FoodItem entity record to the FOODS shape used by the nutrition UI.
export function foodItemToFood(item) {
  return {
    name: item.name,
    category: item.category || 'Custom',
    quantity: item.serving_size || 100,
    unit: item.serving_unit || 'g',
    calories: item.calories_per_serving || 0,
    protein_g: item.protein_g || 0,
    carbs_g: item.carbs_g || 0,
    fat_g: item.fat_g || 0,
    fiber_g: item.fiber_g || 0,
    sugar_g: item.sugar_g || 0,
    sodium_mg: item.sodium_mg || 0,
    _custom: true,
    _foodItemId: item.id,
  };
}