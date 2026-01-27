import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../models/models.dart';
import '../utils/grocery_categorizer.dart';
import '../services/alexa_auth_service.dart';
import '../services/alexa_api_service.dart';

class ShoppingListProvider with ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  final AlexaAuthService _alexaAuth = AlexaAuthService();
  final AlexaApiService _alexaService = AlexaApiService();
  
  List<ShoppingListItem> _items = [];
  bool _isLoading = false;

  ShoppingListProvider();

  List<ShoppingListItem> get items => _items;
  bool get isLoading => _isLoading;

  Future<bool> syncToAlexa() async {
    try {
      final itemNames = _items.map((item) => 
        item.quantity > 1 ? '${item.name} (${item.quantity})' : item.name
      ).toList();
      
      return await _alexaService.syncShoppingList(itemNames);
    } catch (e) {
      print('Error syncing to Alexa: $e');
      return false;
    }
  }

  Future<bool> isAlexaAuthenticated() async {
    return await _alexaService.isAuthenticated();
  }

  Future<void> authenticateAlexa() async {
    await _alexaService.authenticate();
  }

  Future<void> setAlexaToken(String token) async {
    await _alexaAuth.setToken(token);
    notifyListeners();
  }

  Future<void> loadShoppingList() async {
    _isLoading = true;
    notifyListeners();

    int retries = 3;
    while (retries > 0) {
      try {
        final querySnapshot = await _firestore.collection('shopping_list').get();
        _items = querySnapshot.docs
            .map((doc) => ShoppingListItem.fromMap(doc.data(), doc.id))
            .toList();
        break; // Success
      } catch (e) {
        retries--;
        if (retries == 0) {
          print('Firestore error after retries: $e');
          _items = [];
        } else {
          print('Firestore load failed, retrying ($retries left)...');
          await Future.delayed(const Duration(seconds: 1));
        }
      }
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> syncShoppingListFromMeals(List<Meal> meals) async {
    try {
      // 1. Clear existing shopping list
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
            id: '', 
            name: existing.name, 
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

      // Gus Integration: Auto-sync if 'Staples' is present
      if (newItems.any((item) => item.name.toLowerCase().contains('staples'))) {
        print('Gus detected Staples! Syncing to Alexa...');
        await syncToAlexa();
      }
    } catch (e) {
      print('Firestore error syncing shopping list: $e');
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

      _items[index] = updatedItem;
      notifyListeners();

      await _firestore
          .collection('shopping_list')
          .doc(itemId)
          .update({'isChecked': updatedItem.isChecked});
    } catch (e) {
      print('Firestore error toggling item: $e');
      await loadShoppingList(); 
    }
  }
}
