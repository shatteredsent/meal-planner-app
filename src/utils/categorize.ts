// Maps ingredient name keywords to grocery aisles.
// This is a best-effort categorization — items that don't match go to 'Other'.
import { GroceryCategory } from '../types/shoppingItem';

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  'Produce': [
    'lettuce', 'romaine', 'spinach', 'kale', 'arugula', 'cabbage', 'broccoli',
    'brussels', 'cauliflower', 'zucchini', 'cucumber', 'celery', 'carrot',
    'onion', 'scallion', 'shallot', 'garlic', 'ginger', 'tomato', 'pepper',
    'mushroom', 'avocado', 'lemon', 'lime', 'berry', 'berries', 'blueberr',
    'strawberr', 'raspberr', 'apple', 'banana', 'orange', 'grape', 'herb',
    'basil', 'cilantro', 'parsley', 'dill', 'rosemary', 'thyme', 'sage',
    'green bean', 'asparagus', 'squash', 'radish', 'beet', 'potato',
    'sweet potato', 'leek', 'fennel', 'peach', 'pear',
  ],
  'Meat & Seafood': [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage', 'ham',
    'steak', 'flank', 'ground beef', 'ground turkey', 'brisket', 'ribs',
    'thigh', 'breast', 'salmon', 'tuna', 'shrimp', 'tilapia', 'cod', 'fish',
    'fillet', 'seafood', 'crab', 'lobster', 'scallop', 'pepperoni',
    'prosciutto', 'salami',
  ],
  'Dairy & Eggs': [
    'egg', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream',
    'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'brie',
    'havarti', 'cotija', 'ricotta', 'half and half', 'heavy cream',
    'whipping cream', 'ghee', 'tofu',
  ],
  'Pantry': [
    'oil', 'olive oil', 'sesame oil', 'coconut oil', 'vinegar', 'salt',
    'spice', 'paprika', 'cumin', 'oregano', 'cinnamon', 'chili powder',
    'baking powder', 'sauce', 'marinara', 'broth', 'stock', 'mayo', 'mustard',
    'dijon', 'ketchup', 'soy sauce', 'hot sauce', 'dressing', 'almond flour',
    'coconut flour', 'flour', 'sugar', 'honey', 'maple syrup', 'syrup',
    'nuts', 'almond', 'walnut', 'pecan', 'peanut butter', 'seed', 'chia',
    'granola', 'oats', 'rice', 'farro', 'couscous', 'quinoa', 'pasta',
    'ziti', 'noodle', 'bean', 'lentil', 'chickpea', 'canned', 'crushed tomato',
    'tomato paste', 'coconut milk', 'baking', 'extract', 'tortilla',
  ],
  'Bakery': [
    'bread', 'sourdough', 'rye', 'baguette', 'roll', 'bun', 'bagel',
    'pita', 'wrap', 'naan', 'croissant', 'muffin', 'brioche', 'ciabatta',
  ],
  'Frozen': [
    'frozen', 'ice cream', 'frozen vegetable', 'frozen fruit', 'edamame',
  ],
  'Other': [],
};

/**
 * Aisle match order — deliberately not the display order.
 *
 * 'Bakery' is checked before 'Pantry' so 'rye bread' lands in Bakery rather
 * than being caught by Pantry's 'bread', and 'Frozen' goes first so
 * 'frozen green beans' beats Produce's 'green bean'.
 */
const MATCH_ORDER: GroceryCategory[] = [
  'Frozen',
  'Bakery',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Produce',
  'Pantry',
];

export function categorizeIngredient(ingredientName: string): GroceryCategory {
  const normalized = ingredientName.toLowerCase().trim();

  for (const category of MATCH_ORDER) {
    const matched = CATEGORY_KEYWORDS[category].some((keyword) =>
      normalized.includes(keyword)
    );
    if (matched) return category;
  }

  return 'Other';
}
