import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';

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
      // Clear existing shopping list
      final batch = _firestore.batch();
      for (var item in _items) {
        batch.delete(_firestore.collection('shopping_list').doc(item.id));
      }
      await batch.commit();

      // Add items from all meals
      final List<ShoppingListItem> newItems = [];

      for (var meal in meals) {
        for (var ingredient in meal.ingredients) {
          final item = ShoppingListItem(
            id: '',
            name: ingredient,
            isChecked: false,
            mealId: meal.id,
            dayOfWeek: meal.dayOfWeek,
          );

          final docRef =
              await _firestore.collection('shopping_list').add(item.toMap());
          newItems.add(ShoppingListItem(
            id: docRef.id,
            name: ingredient,
            isChecked: false,
            mealId: meal.id,
            dayOfWeek: meal.dayOfWeek,
          ));
        }

        // Add sides as ingredients
        for (var side in meal.sides) {
          final item = ShoppingListItem(
            id: '',
            name: side,
            isChecked: false,
            mealId: meal.id,
            dayOfWeek: meal.dayOfWeek,
          );

          final docRef =
              await _firestore.collection('shopping_list').add(item.toMap());
          newItems.add(ShoppingListItem(
            id: docRef.id,
            name: side,
            isChecked: false,
            mealId: meal.id,
            dayOfWeek: meal.dayOfWeek,
          ));
        }
      }

      _items = newItems;
      notifyListeners();
    } catch (e) {
      print('Error syncing shopping list: $e');
    }
  }

  Future<void> toggleItemChecked(String itemId) async {
    try {
      final item = _items.firstWhere((item) => item.id == itemId);
      final updatedItem = ShoppingListItem(
        id: item.id,
        name: item.name,
        isChecked: !item.isChecked,
        mealId: item.mealId,
        dayOfWeek: item.dayOfWeek,
      );

      await _firestore
          .collection('shopping_list')
          .doc(itemId)
          .update({'isChecked': updatedItem.isChecked});

      final index = _items.indexWhere((item) => item.id == itemId);
      if (index != -1) {
        _items[index] = updatedItem;
        notifyListeners();
      }
    } catch (e) {
      print('Error toggling item: $e');
    }
  }

  Future<void> removeItemsForMeal(String mealId) async {
    try {
      final itemsToRemove =
          _items.where((item) => item.mealId == mealId).toList();

      for (var item in itemsToRemove) {
        await _firestore.collection('shopping_list').doc(item.id).delete();
      }

      _items.removeWhere((item) => item.mealId == mealId);
      notifyListeners();
    } catch (e) {
      print('Error removing items for meal: $e');
    }
  }

  Map<String, List<ShoppingListItem>> getItemsByDay() {
    Map<String, List<ShoppingListItem>> itemsByDay = {};

    for (var item in _items) {
      if (!itemsByDay.containsKey(item.dayOfWeek)) {
        itemsByDay[item.dayOfWeek] = [];
      }
      itemsByDay[item.dayOfWeek]!.add(item);
    }

    return itemsByDay;
  }
}
