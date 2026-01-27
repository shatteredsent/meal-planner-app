import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'providers/profile_provider.dart';
import 'providers/meal_provider.dart';
import 'providers/recipe_provider.dart';
import 'providers/shopping_list_provider.dart';
import 'screens/home_screen.dart';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

void main() async {
  // Fix Flutter Web debug service null pointer issues
  if (kIsWeb) {
    await Future.delayed(const Duration(milliseconds: 100));
  }
  
  WidgetsFlutterBinding.ensureInitialized();
  
  // Add 500ms delay for web platform stability before ANY platform channel calls
  await Future.delayed(const Duration(milliseconds: 500));
  
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    testFirebase();
  } catch (e) {
    print('Firebase initialization failed: $e');
  }
  
  runApp(const MyApp());
}

void testFirebase() async {
  try {
    final app = Firebase.app();
    print('Firebase initialized: ${app.name}');
    final auth = FirebaseAuth.instance;
    print('Auth ready: ${auth.currentUser}');
  } catch (e) {
    print('Firebase test failed: $e');
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ProfileProvider()),
        ChangeNotifierProvider(create: (_) => RecipeProvider()),
        ChangeNotifierProvider(create: (_) => MealProvider()),
        ChangeNotifierProvider(create: (_) => ShoppingListProvider()),
      ],
      child: Consumer<ProfileProvider>(
        builder: (context, profileProvider, child) {
          return MaterialApp(
            title: 'Meal Planner (Web)',
            theme: ThemeData(
              useMaterial3: true,
              brightness: Brightness.light,
              colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
              cardTheme: const CardThemeData(
                elevation: 0.0,
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: Color(0xFFEEEEEE), width: 1.0),
                ),
              ),
            ),
            darkTheme: ThemeData(
              useMaterial3: true,
              brightness: Brightness.dark,
              colorScheme: ColorScheme.fromSeed(seedColor: Colors.green, brightness: Brightness.dark),
              cardTheme: const CardThemeData(
                elevation: 0.0,
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: Color(0xFF333333), width: 1.0),
                ),
              ),
            ),
            themeMode: profileProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
            home: const HomeScreen(),
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }
}
