import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';

class RecipeProvider with ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  List<Recipe> _recipes = [];
  bool _isLoading = false;

  List<Recipe> get recipes => _recipes;
  bool get isLoading => _isLoading;

  Future<void> loadRecipes() async {
    _isLoading = true;
    notifyListeners();

    try {
      final querySnapshot = await _firestore.collection('recipes').get();
      _recipes = querySnapshot.docs
          .map((doc) => Recipe.fromMap(doc.data(), doc.id))
          .toList();
      print('Loaded ${_recipes.length} recipes'); // Debug output
    } catch (e) {
      print('Error loading recipes: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> addRecipe(Recipe recipe) async {
    try {
      final docRef = await _firestore.collection('recipes').add(recipe.toMap());
      final newRecipe = Recipe(
        id: docRef.id,
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        description: recipe.description,
        cookTime: recipe.cookTime,
        prepTime: recipe.prepTime,
        servings: recipe.servings,
        category: recipe.category,
      );
      _recipes.add(newRecipe);
      notifyListeners();
      print('Added recipe: ${recipe.name}'); // Debug output
    } catch (e) {
      print('Error adding recipe: $e');
    }
  }

  Future<void> updateRecipe(Recipe recipe) async {
    try {
      await _firestore
          .collection('recipes')
          .doc(recipe.id)
          .update(recipe.toMap());

      final index = _recipes.indexWhere((r) => r.id == recipe.id);
      if (index != -1) {
        _recipes[index] = recipe;
        notifyListeners();
        print('Updated recipe: ${recipe.name}'); // Debug output
      }
    } catch (e) {
      print('Error updating recipe: $e');
    }
  }

  Future<void> deleteRecipe(String recipeId) async {
    try {
      await _firestore.collection('recipes').doc(recipeId).delete();
      final removedRecipe = _recipes.firstWhere((r) => r.id == recipeId);
      _recipes.removeWhere((r) => r.id == recipeId);
      notifyListeners();
      print('Deleted recipe: ${removedRecipe.name}'); // Debug output
    } catch (e) {
      print('Error deleting recipe: $e');
    }
  }

  Recipe? getRecipeById(String id) {
    try {
      return _recipes.firstWhere((recipe) => recipe.id == id);
    } catch (e) {
      print('Recipe not found: $id');
      return null;
    }
  }

  // Helper methods for filtering
  List<Recipe> getRecipesByCategory(String category) {
    return _recipes.where((recipe) => recipe.category == category).toList();
  }

  List<String> getAllCategories() {
    final categories =
        _recipes.map((recipe) => recipe.category).toSet().toList();
    categories.sort();
    return categories;
  }

  // Search functionality
  List<Recipe> searchRecipes(String query) {
    if (query.isEmpty) return _recipes;

    final lowercaseQuery = query.toLowerCase();
    return _recipes.where((recipe) {
      return recipe.name.toLowerCase().contains(lowercaseQuery) ||
          recipe.description.toLowerCase().contains(lowercaseQuery) ||
          recipe.category.toLowerCase().contains(lowercaseQuery) ||
          recipe.ingredients.any((ingredient) =>
              ingredient.toLowerCase().contains(lowercaseQuery));
    }).toList();
  }
}
