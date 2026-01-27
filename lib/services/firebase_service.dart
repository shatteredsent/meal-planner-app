import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../firebase_options.dart';
import 'web_error_service.dart';

/// Web-optimized service for Firebase initialization.
class FirebaseService {
  static Future<void> initialize() async {
    try {
      if (kIsWeb) {
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.web,
        );

        // Configure Auth Persistence for Web
        // This ensures the user stays logged in across tab reloads/restarts
        await FirebaseAuth.instance.setPersistence(Persistence.LOCAL);
        
        if (kDebugMode) {
          debugPrint('Firebase Web initialized with Local Auth Persistence.');
        }
      }
    } catch (e, stack) {
      WebErrorService.logError(e, stack, reason: 'Firebase Web Initialization Failed');
      rethrow;
    }
  }

  static void logError(dynamic error, StackTrace? stack, {String? reason}) {
    WebErrorService.logError(error, stack, reason: reason);
  }

  static void logMessage(String message) {
    if (kDebugMode) {
      debugPrint('FIREBASE WEB LOG: $message');
    }
  }
}
