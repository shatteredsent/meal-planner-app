import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../providers/meal_provider.dart';
import '../providers/recipe_provider.dart';
import '../providers/shopping_list_provider.dart';
import '../models/models.dart';
import '../widgets/add_meal_dialog.dart';

class PlanTab extends StatefulWidget {
  const PlanTab({super.key});

  @override
  State<PlanTab> createState() => _PlanTabState();
}

class _PlanTabState extends State<PlanTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MealProvider>().loadMeals();
      context.read<RecipeProvider>().loadRecipes();
      context.read<ShoppingListProvider>().loadShoppingList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Weekly Meal Plan'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
      ),
      body: Consumer2<MealProvider, RecipeProvider>(
        builder: (context, mealProvider, recipeProvider, child) {
          if (mealProvider.isLoading || recipeProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          return ListView.builder(
            itemCount: mealProvider.daysOfWeek.length,
            itemBuilder: (context, index) {
              final day = mealProvider.daysOfWeek[index];
              final mealsForDay = mealProvider.getMealsForDay(day);

              return Card(
                margin: const EdgeInsets.all(8.0),
                child: ExpansionTile(
                  title: Text(
                    day,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  children: [
                    ...mealsForDay.map((meal) => _buildMealItem(meal)),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => _showAddMealDialog(day),
                              icon: const Icon(Icons.add),
                              label: const Text('Add Meal'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => _showAddSideDialog(day),
                              icon: const Icon(Icons.add_box),
                              label: const Text('Add Side'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildMealItem(Meal meal) {
    // For "Meat and Two Sides" meals, the meat is stored as the first ingredient.
    // Use that as the title instead of the generic "Meat and Two Sides" string.
    final String displayTitle = (meal.isMeatAndTwoVeggies && meal.ingredients.isNotEmpty)
        ? meal.ingredients.first
        : meal.recipeName;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        title: Text(displayTitle, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Type: ${meal.mealType}'),
            if (meal.sides.isNotEmpty) Text('Sides: ${meal.sides.join(', ')}'),
            if (meal.isMeatAndTwoVeggies)
              const Text('Meat and Two Veggies',
                  style: TextStyle(fontStyle: FontStyle.italic)),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.add_box),
              onPressed: () => _showAddSideToMealDialog(meal),
              tooltip: 'Add Side',
            ),
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              onPressed: () => _deleteMeal(meal),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddMealDialog(String day) {
    showDialog(
      context: context,
      builder: (context) => AddMealDialog(dayOfWeek: day),
    );
  }

  void _showAddSideDialog(String day) {
    final List<String> availableSides = [
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

    final Map<String, bool> selectedSides = {};
    for (String side in availableSides) {
      selectedSides[side] = false;
    }

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text('Add Sides for $day'),
          content: SizedBox(
            width: double.maxFinite,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Select up to 3 sides:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Flexible(
                  child: SingleChildScrollView(
                    child: Column(
                      children: availableSides.map((side) {
                        return CheckboxListTile(
                          title: Text(side),
                          value: selectedSides[side],
                          onChanged: (bool? value) {
                            final currentlySelected =
                                selectedSides.values.where((v) => v).length;
                            if (value == true && currentlySelected >= 3) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content:
                                      Text('You can only select up to 3 sides'),
                                  duration: Duration(seconds: 2),
                                ),
                              );
                              return;
                            }
                            setState(() {
                              selectedSides[side] = value ?? false;
                            });
                          },
                          activeColor: Colors.green,
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final selected = selectedSides.entries
                    .where((entry) => entry.value)
                    .map((entry) => entry.key)
                    .toList();

                if (selected.isNotEmpty) {
                  _createSideDishMeal(day, selected);
                }
                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: const Text('Add Sides'),
            ),
          ],
        ),
      ),
    );
  }

  void _createSideDishMeal(String day, List<String> selectedSides) {
    const uuid = Uuid();
    final meal = Meal(
      id: uuid.v4(),
      recipeId: '',
      recipeName: 'Side Dishes',
      dayOfWeek: day,
      mealType: 'side',
      sides: selectedSides,
      ingredients: selectedSides,
      isMeatAndTwoVeggies: false,
    );

    context.read<MealProvider>().addMeal(meal);
    _updateShoppingList();
  }

  void _showAddSideToMealDialog(Meal meal) {
    final TextEditingController controller = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Side'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Side dish',
            hintText: 'e.g., Rice, Salad, Bread',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                context
                    .read<MealProvider>()
                    .addSideToMeal(meal.id, controller.text.trim());
                _updateShoppingList();
                Navigator.of(context).pop();
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _deleteMeal(Meal meal) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Meal'),
        content: Text('Are you sure you want to delete "${meal.recipeName}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
              onPressed: () async {
                await context.read<MealProvider>().deleteMeal(meal.id);
                if (context.mounted) {
                  _updateShoppingList();
                  Navigator.of(context).pop();
                }
              },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _updateShoppingList() {
    final meals = context.read<MealProvider>().meals;
    context.read<ShoppingListProvider>().syncShoppingListFromMeals(meals);
  }
}
