import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';
import '../utils/grocery_categorizer.dart';

class ShoppingListProvider with ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  List<ShoppingListItem> _items = [];
  bool _isLoading = false;

  List<ShoppingListItem> get items => _items;
  bool get isLoading => _isLoading;

  Future<void> loadShoppingList() async {
    _isLoading = true;
    notifyListeners();

    try {
      final querySnapshot = await _firestore.collection('shopping_list').get();
      _items = querySnapshot.docs
          .map((doc) => ShoppingListItem.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error loading shopping list: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> syncShoppingListFromMeals(List<Meal> meals) async {
    try {
      // 1. Clear existing shopping list
      // In a more robust app, we might want to preserve checked status or custom items,
      // but for this sync logic, we wipe and rebuild based on the plan.
      final batchDelete = _firestore.batch();
      final existingDocs = await _firestore.collection('shopping_list').get();
      for (var doc in existingDocs.docs) {
        batchDelete.delete(doc.reference);
      }
      await batchDelete.commit();

      // 2. Aggregate items from meals
      final Map<String, ShoppingListItem> aggregatedItems = {};

      void addItem(String name) {
        final cleanName = name.trim();
        final key = cleanName.toLowerCase();

        if (aggregatedItems.containsKey(key)) {
          final existing = aggregatedItems[key]!;
          aggregatedItems[key] = ShoppingListItem(
            id: '', // Will be assigned by Firestore
            name: existing.name, // Keep original casing
            isChecked: false,
            category: existing.category,
            quantity: existing.quantity + 1,
          );
        } else {
          aggregatedItems[key] = ShoppingListItem(
            id: '',
            name: cleanName,
            isChecked: false,
            category: GroceryCategorizer.categorize(cleanName),
            quantity: 1,
          );
        }
      }

      for (var meal in meals) {
        for (var ingredient in meal.ingredients) {
          addItem(ingredient);
        }
        for (var side in meal.sides) {
          addItem(side);
        }
      }

      // 3. Write new items to Firestore
      // Firestore batches are limited to 500 ops. If list is huge, this might need chunking.
      final batchWrite = _firestore.batch();
      final List<ShoppingListItem> newItems = [];

      for (var item in aggregatedItems.values) {
        final docRef = _firestore.collection('shopping_list').doc();
        batchWrite.set(docRef, item.toMap());
        
        newItems.add(ShoppingListItem(
          id: docRef.id,
          name: item.name,
          isChecked: item.isChecked,
          category: item.category,
          quantity: item.quantity,
        ));
      }

      await batchWrite.commit();

      _items = newItems;
      notifyListeners();
    } catch (e) {
      print('Error syncing shopping list: $e');
    }
  }

  Future<void> toggleItemChecked(String itemId) async {
    try {
      final index = _items.indexWhere((item) => item.id == itemId);
      if (index == -1) return;

      final item = _items[index];
      final updatedItem = ShoppingListItem(
        id: item.id,
        name: item.name,
        isChecked: !item.isChecked,
        category: item.category,
        quantity: item.quantity,
      );

      // Optimistic update
      _items[index] = updatedItem;
      notifyListeners();

      await _firestore
          .collection('shopping_list')
          .doc(itemId)
          .update({'isChecked': updatedItem.isChecked});
    } catch (e) {
      print('Error toggling item: $e');
      // Revert if failed (optional, but good practice)
      await loadShoppingList(); 
    }
  }
}
