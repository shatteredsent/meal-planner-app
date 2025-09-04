import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../providers/meal_provider.dart';
import '../providers/recipe_provider.dart';
import '../providers/shopping_list_provider.dart';
import '../models/models.dart';

class AddMealDialog extends StatefulWidget {
  final String dayOfWeek;

  const AddMealDialog({
    super.key,
    required this.dayOfWeek,
  });

  @override
  State<AddMealDialog> createState() => _AddMealDialogState();
}

class _AddMealDialogState extends State<AddMealDialog> {
  String _selectedMealType = 'dinner';
  Recipe? _selectedRecipe;
  bool _isMeatAndTwoSides = false;

  final List<String> _mealTypes = ['breakfast', 'lunch', 'dinner'];

  // Meat options in the requested order
  final List<String> _meatOptions = [
    'Hamburger Steaks',
    'Steaks',
    'Grilled Chicken',
    'Fried Chicken',
    'Pork Chops',
    'Boston Butt',
    'Pork Kabobs',
    'Pork Loin',
    'Ribs',
    'Ham',
    'Pork Roast',
  ];

  // Side options from your previous list
  final List<String> _sideOptions = [
    'Asparagus',
    'Beans',
    'Broccoli',
    'Brussels Sprouts',
    'Cabbage (Coleslaw)',
    'Carrots',
    'Cauliflower',
    'Corn',
    'French Fries',
    'Green Beans',
    'Greens',
    'Mushrooms',
    'Okra',
    'Potatoes (Sweet)',
    'Salad',
    'Spinach',
    'Squash',
    'Tater Tots',
    'Zucchini',
  ];

  String? _selectedMeat;
  String? _selectedSide1;
  String? _selectedSide2;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Add Meal for ${widget.dayOfWeek}'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Meal Type Selection
            const Text('Meal Type:',
                style: TextStyle(fontWeight: FontWeight.bold)),
            DropdownButton<String>(
              value: _selectedMealType,
              isExpanded: true,
              items: _mealTypes.map((type) {
                return DropdownMenuItem(
                  value: type,
                  child: Text(type.toUpperCase()),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedMealType = value!;
                });
              },
            ),
            const SizedBox(height: 16),

            // Option Selection
            const Text('Choose Option:',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),

            // Recipe Option
            Card(
              child: RadioListTile<bool>(
                title: const Text('Pre-created Recipe'),
                value: false,
                groupValue: _isMeatAndTwoSides,
                onChanged: (value) {
                  setState(() {
                    _isMeatAndTwoSides = value!;
                  });
                },
              ),
            ),

            if (!_isMeatAndTwoSides) ...[
              const SizedBox(height: 8),
              Consumer<RecipeProvider>(
                builder: (context, recipeProvider, child) {
                  if (recipeProvider.recipes.isEmpty) {
                    return const Text(
                        'No recipes available. Add recipes first.');
                  }

                  return DropdownButton<Recipe>(
                    value: _selectedRecipe,
                    hint: const Text('Select a recipe'),
                    isExpanded: true,
                    items: recipeProvider.recipes.map((recipe) {
                      return DropdownMenuItem(
                        value: recipe,
                        child: Text(recipe.name),
                      );
                    }).toList(),
                    onChanged: (recipe) {
                      setState(() {
                        _selectedRecipe = recipe;
                      });
                    },
                  );
                },
              ),
            ],

            // Meat and Two Sides Option
            Card(
              child: RadioListTile<bool>(
                title: const Text('Meat and Two Sides'),
                value: true,
                groupValue: _isMeatAndTwoSides,
                onChanged: (value) {
                  setState(() {
                    _isMeatAndTwoSides = value!;
                    _selectedRecipe = null;
                  });
                },
              ),
            ),

            if (_isMeatAndTwoSides) ...[
              const SizedBox(height: 8),

              // Meat Selection
              const Text('Select Meat:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              DropdownButton<String>(
                value: _selectedMeat,
                hint: const Text('Choose a meat'),
                isExpanded: true,
                items: _meatOptions.map((meat) {
                  return DropdownMenuItem(
                    value: meat,
                    child: Text(meat),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedMeat = value;
                  });
                },
              ),
              const SizedBox(height: 16),

              // First Side Selection
              const Text('Select First Side:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              DropdownButton<String>(
                value: _selectedSide1,
                hint: const Text('Choose first side'),
                isExpanded: true,
                items: _sideOptions.map((side) {
                  return DropdownMenuItem(
                    value: side,
                    child: Text(side),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedSide1 = value;
                  });
                },
              ),
              const SizedBox(height: 16),

              // Second Side Selection
              const Text('Select Second Side:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              DropdownButton<String>(
                value: _selectedSide2,
                hint: const Text('Choose second side'),
                isExpanded: true,
                items: _sideOptions
                    .where((side) => side != _selectedSide1)
                    .map((side) {
                  return DropdownMenuItem(
                    value: side,
                    child: Text(side),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedSide2 = value;
                  });
                },
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _canAddMeal() ? () => _addMeal() : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green,
            foregroundColor: Colors.white,
          ),
          child: const Text('Add Meal'),
        ),
      ],
    );
  }

  bool _canAddMeal() {
    if (_isMeatAndTwoSides) {
      return _selectedMeat != null &&
          _selectedSide1 != null &&
          _selectedSide2 != null;
    } else {
      return _selectedRecipe != null;
    }
  }

  void _addMeal() {
    const uuid = Uuid();

    if (_isMeatAndTwoSides) {
      final meal = Meal(
        id: uuid.v4(),
        recipeId: '',
        recipeName: 'Meat and Two Sides',
        dayOfWeek: widget.dayOfWeek,
        mealType: _selectedMealType,
        sides: [_selectedSide1!, _selectedSide2!],
        ingredients: [_selectedMeat!, _selectedSide1!, _selectedSide2!],
        isMeatAndTwoVeggies: true, // Keep this for backward compatibility
      );

      context.read<MealProvider>().addMeal(meal);
    } else if (_selectedRecipe != null) {
      final meal = Meal(
        id: uuid.v4(),
        recipeId: _selectedRecipe!.id,
        recipeName: _selectedRecipe!.name,
        dayOfWeek: widget.dayOfWeek,
        mealType: _selectedMealType,
        sides: [],
        ingredients: _selectedRecipe!.ingredients,
        isMeatAndTwoVeggies: false,
      );

      context.read<MealProvider>().addMeal(meal);
    }

    // Update shopping list
    final meals = context.read<MealProvider>().meals;
    context.read<ShoppingListProvider>().syncShoppingListFromMeals(meals);

    Navigator.of(context).pop();
  }
}
