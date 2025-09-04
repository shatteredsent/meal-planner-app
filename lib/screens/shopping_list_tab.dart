import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/shopping_list_provider.dart';
import '../providers/meal_provider.dart';

class ShoppingListTab extends StatefulWidget {
  const ShoppingListTab({super.key});

  @override
  State<ShoppingListTab> createState() => _ShoppingListTabState();
}

class _ShoppingListTabState extends State<ShoppingListTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() async {
    await context.read<ShoppingListProvider>().loadShoppingList();
    await context.read<MealProvider>().loadMeals();

    // Sync shopping list with current meals
    final meals = context.read<MealProvider>().meals;
    context.read<ShoppingListProvider>().syncShoppingListFromMeals(meals);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shopping List'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: Consumer<ShoppingListProvider>(
        builder: (context, shoppingListProvider, child) {
          if (shoppingListProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (shoppingListProvider.items.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shopping_cart, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'No items in shopping list',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Add meals to your plan to populate the shopping list',
                    style: TextStyle(color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          final itemsByCategory =
              _groupItemsByCategory(shoppingListProvider.items);
          final categories = ['Meat', 'Vegetables', 'Other'];

          return ListView.builder(
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final category = categories[index];
              final categoryItems = itemsByCategory[category] ?? {};

              if (categoryItems.isEmpty) return const SizedBox.shrink();

              return Card(
                margin: const EdgeInsets.all(8.0),
                child: ExpansionTile(
                  title: Text(
                    category,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  subtitle: Text('${categoryItems.length} items'),
                  children: categoryItems.entries
                      .map(
                          (entry) => _buildShoppingItem(entry.key, entry.value))
                      .toList(),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Map<String, Map<String, ShoppingItemInfo>> _groupItemsByCategory(items) {
    final Map<String, Map<String, ShoppingItemInfo>> categorizedItems = {
      'Meat': {},
      'Vegetables': {},
      'Other': {},
    };

    // Define meat options
    final meatItems = {
      'hamburger steaks',
      'steaks',
      'grilled chicken',
      'fried chicken',
      'pork chops',
      'boston butt',
      'pork kabobs',
      'pork loin',
      'ribs',
      'ham',
      'pork roast',
      'chicken',
      'beef',
      'pork',
      'turkey',
      'fish',
      'ground beef',
      'chicken breast'
    };

    // Define vegetable/side options
    final vegetableItems = {
      'asparagus',
      'beans',
      'broccoli',
      'brussels sprouts',
      'cabbage',
      'coleslaw',
      'carrots',
      'cauliflower',
      'corn',
      'french fries',
      'green beans',
      'greens',
      'mushrooms',
      'okra',
      'potatoes',
      'sweet potatoes',
      'salad',
      'spinach',
      'squash',
      'tater tots',
      'zucchini',
      'onions',
      'tomatoes',
      'lettuce'
    };

    for (var item in items) {
      final itemName = item.name.toLowerCase().trim();
      String category = 'Other';

      // Check if it's a meat item
      if (meatItems.any((meat) => itemName.contains(meat))) {
        category = 'Meat';
      }
      // Check if it's a vegetable/side item
      else if (vegetableItems.any((veg) => itemName.contains(veg))) {
        category = 'Vegetables';
      }

      // Group identical items and count them
      if (categorizedItems[category]!.containsKey(item.name)) {
        categorizedItems[category]![item.name]!.count++;
        categorizedItems[category]![item.name]!.items.add(item);
      } else {
        categorizedItems[category]![item.name] = ShoppingItemInfo(
          count: 1,
          items: [item],
          isChecked: item.isChecked,
        );
      }
    }

    return categorizedItems;
  }

  Widget _buildShoppingItem(String itemName, ShoppingItemInfo itemInfo) {
    final displayName =
        itemInfo.count > 1 ? '$itemName (${itemInfo.count}x)' : itemName;

    return Container(
      color: itemInfo.isChecked ? Colors.green.shade100 : null,
      child: CheckboxListTile(
        title: Text(
          displayName,
          style: TextStyle(
            color: itemInfo.isChecked ? Colors.green.shade800 : Colors.black,
            fontWeight:
                itemInfo.isChecked ? FontWeight.w500 : FontWeight.normal,
          ),
        ),
        value: itemInfo.isChecked,
        onChanged: (bool? value) {
          // Update all items with this name
          for (var item in itemInfo.items) {
            context.read<ShoppingListProvider>().toggleItemChecked(item.id);
          }
        },
        activeColor: Colors.green,
        checkColor: Colors.white,
      ),
    );
  }
}

class ShoppingItemInfo {
  int count;
  List<dynamic> items;
  bool isChecked;

  ShoppingItemInfo({
    required this.count,
    required this.items,
    required this.isChecked,
  });
}
