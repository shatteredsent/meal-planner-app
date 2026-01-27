import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'firebase_service.dart';

/// Service to monitor network connectivity status.
class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  
  // Internal controller for the connectivity stream.
  final StreamController<ConnectivityResult> _connectivityController = 
      StreamController<ConnectivityResult>.broadcast();

  // Public stream for connectivity changes.
  Stream<ConnectivityResult> get connectivityStream => _connectivityController.stream;

  ConnectivityService() {
    _initConnectivity();
  }

  /// Initializes connectivity monitoring.
  Future<void> _initConnectivity() async {
    try {
      // Listen to connectivity changes
      _connectivity.onConnectivityChanged.listen((ConnectivityResult result) {
        _connectivityController.add(result);
        _logConnectivityChange(result);
      });

      // Get initial state
      final initialResult = await _connectivity.checkConnectivity();
      _connectivityController.add(initialResult);
      _logConnectivityChange(initialResult);
    } catch (e, stack) {
      FirebaseService.logError(e, stack, reason: 'Failed to initialize connectivity monitoring');
    }
  }

  /// Checks if there is an active internet connection.
  Future<bool> hasInternetConnection() async {
    try {
      final result = await _connectivity.checkConnectivity();
      return result != ConnectivityResult.none;
    } catch (e, stack) {
      FirebaseService.logError(e, stack, reason: 'Error checking current connectivity');
      return false;
    }
  }

  /// Logs connectivity changes for debugging and Crashlytics context.
  void _logConnectivityChange(ConnectivityResult result) {
    final status = result == ConnectivityResult.none ? 'Offline' : 'Online (${result.name})';
    FirebaseService.logMessage('Connectivity changed: $status');
    
    if (kDebugMode) {
      debugPrint('NETWORK STATUS: $status');
    }
  }

  /// Closes the connectivity controller.
  void dispose() {
    _connectivityController.close();
  }
}
