import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'providers/profile_provider.dart';
import 'providers/meal_provider.dart';
import 'providers/recipe_provider.dart';
import 'providers/shopping_list_provider.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
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
            title: 'Meal Planner',
            theme: ThemeData(
              useMaterial3: true,
              brightness: Brightness.light,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.green,
                primary: Colors.green.shade600,
                secondary: Colors.teal.shade400,
                brightness: Brightness.light,
              ),
              cardTheme: CardThemeData(
                elevation: 0.0,
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: Colors.grey.shade200, width: 1.0),
                  borderRadius: BorderRadius.circular(16),
                ),
                clipBehavior: Clip.antiAlias,
              ),
            ),
            darkTheme: ThemeData(
              useMaterial3: true,
              brightness: Brightness.dark,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.green,
                primary: Colors.green.shade400,
                secondary: Colors.teal.shade200,
                brightness: Brightness.dark,
                surface: const Color(0xFF1E1E1E),
              ),
              cardTheme: CardThemeData(
                elevation: 0.0,
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: Colors.grey.shade800, width: 1.0),
                  borderRadius: BorderRadius.circular(16),
                ),
                clipBehavior: Clip.antiAlias,
              ),
            ),
            themeMode:
                profileProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
            home: const HomeScreen(),
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }
}
