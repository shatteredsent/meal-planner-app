class Recipe {
  final String id;
  final String name;
  final List<String> ingredients;
  final String instructions;
  final String description;
  final int cookTime;
  final int prepTime;
  final int servings;
  final String category;

  Recipe({
    required this.id,
    required this.name,
    required this.ingredients,
    required this.instructions,
    required this.description,
    required this.cookTime,
    required this.prepTime,
    required this.servings,
    required this.category,
  });

  factory Recipe.fromMap(Map<String, dynamic> map, String id) {
    // Handle ingredients field - it might be a string or array
    List<String> ingredientsList = [];
    if (map['ingredients'] != null) {
      if (map['ingredients'] is List) {
        // If it's already a list, convert to List<String>
        final rawList = map['ingredients'] as List;
        ingredientsList = rawList.map((item) => item.toString()).toList();
      } else if (map['ingredients'] is String) {
        // If it's a string, split by semicolon or comma
        final ingredientsString = map['ingredients'] as String;
        ingredientsList = ingredientsString
            .split(RegExp(r'[;,]'))
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList();
      }
    }

    return Recipe(
      id: id,
      name: map['name']?.toString() ?? '',
      ingredients: ingredientsList,
      instructions: map['instructions']?.toString() ?? '',
      description: map['description']?.toString() ?? '',
      cookTime: _safeParseInt(map['cookTime']),
      prepTime: _safeParseInt(map['prepTime']),
      servings: _safeParseInt(map['servings']) == 0
          ? 4
          : _safeParseInt(map['servings']), // Default to 4 if 0 or null
      category: map['category']?.toString() ?? 'Main',
    );
  }

  // Helper method to safely parse integers
  static int _safeParseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.round();
    if (value is String) {
      return int.tryParse(value) ?? 0;
    }
    return 0;
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'ingredients': ingredients,
      'instructions': instructions,
      'description': description,
      'cookTime': cookTime,
      'prepTime': prepTime,
      'servings': servings,
      'category': category,
    };
  }

  // Helper getter for display
  String get totalTime {
    if (cookTime > 0 && prepTime > 0) {
      return '${prepTime + cookTime} min total';
    } else if (cookTime > 0) {
      return '$cookTime min cook';
    } else if (prepTime > 0) {
      return '$prepTime min prep';
    }
    return '';
  }
}

class Meal {
  final String id;
  final String recipeId;
  final String recipeName;
  final String dayOfWeek;
  final String mealType; // breakfast, lunch, dinner
  final List<String> sides;
  final List<String> ingredients;
  final bool isMeatAndTwoVeggies;

  Meal({
    required this.id,
    required this.recipeId,
    required this.recipeName,
    required this.dayOfWeek,
    required this.mealType,
    required this.sides,
    required this.ingredients,
    this.isMeatAndTwoVeggies = false,
  });

  factory Meal.fromMap(Map<String, dynamic> map, String id) {
    return Meal(
      id: id,
      recipeId: map['recipeId']?.toString() ?? '',
      recipeName: map['recipeName']?.toString() ?? '',
      dayOfWeek: map['dayOfWeek']?.toString() ?? '',
      mealType: map['mealType']?.toString() ?? 'dinner',
      sides: List<String>.from(map['sides'] ?? []),
      ingredients: List<String>.from(map['ingredients'] ?? []),
      isMeatAndTwoVeggies: map['isMeatAndTwoVeggies'] == true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'recipeId': recipeId,
      'recipeName': recipeName,
      'dayOfWeek': dayOfWeek,
      'mealType': mealType,
      'sides': sides,
      'ingredients': ingredients,
      'isMeatAndTwoVeggies': isMeatAndTwoVeggies,
    };
  }
}

class ShoppingListItem {
  final String id;
  final String name;
  final bool isChecked;
  final String mealId;
  final String dayOfWeek;

  ShoppingListItem({
    required this.id,
    required this.name,
    required this.isChecked,
    required this.mealId,
    required this.dayOfWeek,
  });

  factory ShoppingListItem.fromMap(Map<String, dynamic> map, String id) {
    return ShoppingListItem(
      id: id,
      name: map['name']?.toString() ?? '',
      isChecked: map['isChecked'] == true,
      mealId: map['mealId']?.toString() ?? '',
      dayOfWeek: map['dayOfWeek']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'isChecked': isChecked,
      'mealId': mealId,
      'dayOfWeek': dayOfWeek,
    };
  }
}
