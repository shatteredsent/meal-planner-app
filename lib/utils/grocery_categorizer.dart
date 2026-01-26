class GroceryCategorizer {
  static const String produce = 'Produce';
  static const String meat = 'Meat';
  static const String dairy = 'Dairy & Eggs';
  static const String pantry = 'Pantry';
  static const String bakery = 'Bakery';
  static const String frozen = 'Frozen';
  static const String other = 'Other';

  static final Map<String, Set<String>> _keywords = {
    produce: {
      'apple', 'apricot', 'asparagus', 'avocado', 'banana', 'bean', 'berry', 
      'broccoli', 'cabbage', 'carrot', 'cauliflower', 'celery', 'cherry', 
      'citrus', 'corn', 'cucumber', 'eggplant', 'fruit', 'garlic', 'ginger', 
      'grape', 'greens', 'herb', 'kale', 'lemon', 'lettuce', 'lime', 'melon', 
      'mushroom', 'onion', 'orange', 'pea', 'peach', 'pear', 'pepper', 
      'pineapple', 'plum', 'potato', 'pumpkin', 'radish', 'salad', 'spinach', 
      'squash', 'strawberry', 'tomato', 'turnip', 'vegetable', 'zucchini',
      'cilantro', 'parsley', 'basil', 'thyme', 'rosemary', 'okra', 'coleslaw'
    },
    meat: {
      'bacon', 'beef', 'chicken', 'chop', 'duck', 'fish', 'ham', 'lamb', 
      'meat', 'pork', 'poultry', 'rib', 'roast', 'salmon', 'sausage', 
      'shrimp', 'steak', 'tuna', 'turkey', 'veal', 'wings', 'ground beef',
      'burger', 'bratwurst', 'hot dog', 'pepperoni', 'salami', 'kabob'
    },
    dairy: {
      'butter', 'cheese', 'cream', 'egg', 'milk', 'yogurt', 'margarine', 
      'custard', 'feta', 'mozzarella', 'cheddar', 'parmesan', 'sour cream', 
      'whipping cream', 'half and half', 'ghee'
    },
    pantry: {
      'baking', 'bean', 'bread', 'broth', 'cannan', 'cereal', 'chip', 
      'chocolate', 'coffee', 'condiment', 'cracker', 'flour', 'honey', 'jam', 
      'jelly', 'juice', 'ketchup', 'mustard', 'mayo', 'noodle', 'nut', 
      'oil', 'olive', 'pasta', 'peanut', 'pickle', 'rice', 'salt', 'sauce', 
      'seasoning', 'soup', 'spice', 'sugar', 'syrup', 'tea', 'vanilla', 
      'vinegar', 'water', 'yeast', 'stock', 'bouillon', 'can', 'jar'
    },
    bakery: {
      'bagel', 'bun', 'cake', 'cookie', 'croissant', 'donut', 'muffin', 
      'pastry', 'pie', 'roll', 'scone', 'toast', 'tortilla', 'wrap'
    },
    frozen: {
      'ice cream', 'pizza', 'frozen', 'tater tot', 'fries'
    }
  };

  static String categorize(String itemName) {
    if (itemName.isEmpty) return other;
    
    final lowerName = itemName.toLowerCase().trim();

    // Check strict matches first or contains logic
    for (var entry in _keywords.entries) {
      final category = entry.key;
      final keywords = entry.value;

      if (keywords.any((k) => lowerName.contains(k))) {
        return category;
      }
    }

    return other;
  }
}
