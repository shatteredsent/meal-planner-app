import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';

class MealProvider with ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  List<Meal> _meals = [];
  bool _isLoading = false;

  List<Meal> get meals => _meals;
  bool get isLoading => _isLoading;

  final List<String> daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  List<Meal> getMealsForDay(String day) {
    return _meals.where((meal) => meal.dayOfWeek == day).toList();
  }

  Future<void> loadMeals() async {
    _isLoading = true;
    notifyListeners();

    try {
      final querySnapshot = await _firestore.collection('meals').get();
      _meals = querySnapshot.docs
          .map((doc) => Meal.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error loading meals: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> addMeal(Meal meal) async {
    try {
      final docRef = await _firestore.collection('meals').add(meal.toMap());
      final newMeal = Meal(
        id: docRef.id,
        recipeId: meal.recipeId,
        recipeName: meal.recipeName,
        dayOfWeek: meal.dayOfWeek,
        mealType: meal.mealType,
        sides: meal.sides,
        ingredients: meal.ingredients,
        isMeatAndTwoVeggies: meal.isMeatAndTwoVeggies,
      );
      _meals.add(newMeal);
      notifyListeners();
    } catch (e) {
      print('Error adding meal: $e');
    }
  }

  Future<void> updateMeal(Meal meal) async {
    try {
      await _firestore.collection('meals').doc(meal.id).update(meal.toMap());

      final index = _meals.indexWhere((m) => m.id == meal.id);
      if (index != -1) {
        _meals[index] = meal;
        notifyListeners();
      }
    } catch (e) {
      print('Error updating meal: $e');
    }
  }

  Future<void> deleteMeal(String mealId) async {
    try {
      await _firestore.collection('meals').doc(mealId).delete();
      _meals.removeWhere((m) => m.id == mealId);
      notifyListeners();
    } catch (e) {
      print('Error deleting meal: $e');
    }
  }

  Future<void> addSideToMeal(String mealId, String side) async {
    final meal = _meals.firstWhere((m) => m.id == mealId);
    final updatedMeal = Meal(
      id: meal.id,
      recipeId: meal.recipeId,
      recipeName: meal.recipeName,
      dayOfWeek: meal.dayOfWeek,
      mealType: meal.mealType,
      sides: [...meal.sides, side],
      ingredients: meal.ingredients,
      isMeatAndTwoVeggies: meal.isMeatAndTwoVeggies,
    );
    await updateMeal(updatedMeal);
  }

  List<Meal> getAllMealsForWeek() {
    List<Meal> weekMeals = [];
    for (String day in daysOfWeek) {
      weekMeals.addAll(getMealsForDay(day));
    }
    return weekMeals;
  }
}
