import 'package:flutter/foundation.dart';
import 'dart:html' as html;

/// Service to handle web-specific error reporting and logging.
class WebErrorService {
  /// Logs an error specifically for the web environment.
  static void logError(dynamic error, StackTrace? stack, {String? reason}) {
    final timestamp = DateTime.now().toIso8601String();
    final logEntry = '[$timestamp] ERROR: $error\nReason: $reason\nStack: $stack';
    
    // 1. Console logging
    debugPrint(logEntry);
    
    // 2. Local Storage logging for persistence if needed
    try {
      final logs = html.window.localStorage['app_error_logs'] ?? '';
      html.window.localStorage['app_error_logs'] = logs + '\n' + logEntry;
    } catch (e) {
      // Ignore local storage errors
    }
    
    // 3. Browser-specific error reporting could be added here
  }

  /// Provides user-friendly error messages for common web issues.
  static String getFriendlyMessage(dynamic error) {
    final errorMessage = error.toString().toLowerCase();
    
    if (errorMessage.contains('network') || errorMessage.contains('failed to fetch')) {
      return 'Network connection issue. Please check your internet and try again.';
    } else if (errorMessage.contains('permission-denied')) {
      return 'You do not have permission to perform this action.';
    } else if (errorMessage.contains('not-found')) {
      return 'The requested resource was not found.';
    }
    
    return 'An unexpected error occurred. We have logged this for review.';
  }

  /// Specifically handles connectivity issues in the browser.
  static bool checkBrowserOnline() {
    return html.window.navigator.onLine ?? true;
  }
}
