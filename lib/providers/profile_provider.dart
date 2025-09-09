import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProfileProvider with ChangeNotifier {
  String _userName = 'Guest User';
  String _userEmail = '';
  String _defaultMealType = 'dinner';
  int _defaultServings = 4;
  bool _isDarkMode = false;
  bool _isLoading = false;

  // Getters
  String get userName => _userName;
  String get userEmail => _userEmail;
  String get defaultMealType => _defaultMealType;
  int get defaultServings => _defaultServings;
  bool get isDarkMode => _isDarkMode;
  bool get isLoading => _isLoading;
  bool get isGuest => _userEmail.isEmpty;

  ProfileProvider() {
    _loadSettings();
  }

  // Load settings from SharedPreferences
  Future<void> _loadSettings() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      _userName = prefs.getString('userName') ?? 'Guest User';
      _userEmail = prefs.getString('userEmail') ?? '';
      _defaultMealType = prefs.getString('defaultMealType') ?? 'dinner';
      _defaultServings = prefs.getInt('defaultServings') ?? 4;
      _isDarkMode = prefs.getBool('isDarkMode') ?? false;
    } catch (e) {
      print('Error loading settings: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  // Save settings to SharedPreferences
  Future<void> _saveSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userName', _userName);
      await prefs.setString('userEmail', _userEmail);
      await prefs.setString('defaultMealType', _defaultMealType);
      await prefs.setInt('defaultServings', _defaultServings);
      await prefs.setBool('isDarkMode', _isDarkMode);
    } catch (e) {
      print('Error saving settings: $e');
    }
  }

  // Update user profile
  Future<void> updateProfile({
    String? userName,
    String? userEmail,
  }) async {
    _isLoading = true;
    notifyListeners();

    if (userName != null) _userName = userName;
    if (userEmail != null) _userEmail = userEmail;

    await _saveSettings();

    _isLoading = false;
    notifyListeners();
  }

  // Update meal preferences
  Future<void> updateMealPreferences({
    String? defaultMealType,
    int? defaultServings,
  }) async {
    if (defaultMealType != null) _defaultMealType = defaultMealType;
    if (defaultServings != null) _defaultServings = defaultServings;

    await _saveSettings();
    notifyListeners();
  }

  // Toggle dark mode
  Future<void> toggleDarkMode() async {
    _isDarkMode = !_isDarkMode;
    await _saveSettings();
    notifyListeners();
  }

  // Clear all settings (logout equivalent)
  Future<void> clearSettings() async {
    _userName = 'Guest User';
    _userEmail = '';
    _defaultMealType = 'dinner';
    _defaultServings = 4;
    _isDarkMode = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    notifyListeners();
  }

  // Create a "profile" (simulate account creation)
  Future<bool> createProfile(String name, String email) async {
    _isLoading = true;
    notifyListeners();

    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));

    _userName = name;
    _userEmail = email;

    await _saveSettings();

    _isLoading = false;
    notifyListeners();

    return true; // Success
  }

  // Get user initials for avatar
  String getUserInitials() {
    if (_userName.isEmpty) return 'GU';
    final names = _userName.split(' ');
    if (names.length >= 2) {
      return '${names[0][0]}${names[1][0]}'.toUpperCase();
    }
    return _userName[0].toUpperCase();
  }
}
