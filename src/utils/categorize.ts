// Maps ingredient name keywords to grocery categories.
// This is a best-effort categorization — items that don't match go to 'Other'.
import { GroceryCategory } from '../types/shoppingItem';

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  'Produce': [
    'lettuce', 'spinach', 'kale', 'arugula', 'cabbage', 'broccoli', 'cauliflower',
    'zucchini', 'cucumber', 'celery', 'carrot', 'onion', 'garlic', 'tomato',
    'pepper', 'mushroom', 'avocado', 'lemon', 'lime', 'berry', 'berries',
    'apple', 'banana', 'orange', 'grape', 'herb', 'basil', 'cilantro',
    'parsley', 'green bean', 'asparagus', 'squash', 'radish', 'beet',
  ],
  'Meat & Seafood': [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage', 'ham',
    'steak', 'ground beef', 'ground turkey', 'brisket', 'ribs', 'salmon',
    'tuna', 'shrimp', 'tilapia', 'cod', 'fish', 'seafood', 'crab', 'lobster',
    'pepperoni', 'prosciutto', 'salami',
  ],
  'Dairy & Eggs': [
    'egg', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream',
    'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'brie',
    'half and half', 'heavy cream', 'whipping cream', 'ghee',
  ],
  'Pantry': [
    'oil', 'olive oil', 'coconut oil', 'vinegar', 'salt', 'pepper', 'spice',
    'sauce', 'broth', 'stock', 'mayo', 'mustard', 'ketchup', 'soy sauce',
    'hot sauce', 'almond flour', 'coconut flour', 'flour', 'sugar', 'honey',
    'nuts', 'almond', 'walnut', 'pecan', 'seed', 'canned', 'tomato paste',
    'coconut milk', 'baking', 'extract', 'bread', 'wrap', 'tortilla',
  ],
  'Frozen': [
    'frozen', 'ice cream', 'frozen vegetable', 'frozen fruit', 'edamame',
  ],
  'Other': [],
};

export function categorizeIngredient(ingredientName: string): GroceryCategory {
  const normalized = ingredientName.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'Other') continue;
    const matched = keywords.some((keyword) => normalized.includes(keyword));
    if (matched) return category as GroceryCategory;
  }

  return 'Other';
}