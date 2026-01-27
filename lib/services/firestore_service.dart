import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'firebase_service.dart';
import 'web_error_service.dart';

/// Web-optimized service for Firestore.
class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  FirestoreService() {
    // No explicit enablePersistence call on web as it can be problematic with multiple tabs
    // Web uses indexedDb for persistence by default if available.
  }

  /// Generic handler with retry logic and web error mapping.
  Future<T?> handleFirestoreOperation<T>(
    Future<T> Function() operation, {
    String? errorMessage,
    int retries = 2,
  }) async {
    int attempts = 0;
    while (attempts <= retries) {
      try {
        return await operation();
      } on FirebaseException catch (e, stack) {
        if (e.code == 'unavailable' && attempts < retries) {
          attempts++;
          await Future.delayed(Duration(seconds: attempts * 2));
          continue;
        }
        _handleWebFirestoreException(e, stack, errorMessage);
        return null;
      } catch (e, stack) {
        FirebaseService.logError(e, stack, reason: errorMessage);
        return null;
      }
    }
    return null;
  }

  void _handleWebFirestoreException(FirebaseException e, StackTrace stack, String? message) {
    String logMsg;
    switch (e.code) {
      case 'permission-denied':
        logMsg = 'Web Firestore: Permission Denied.';
        break;
      case 'unavailable':
        logMsg = 'Web Firestore: Service Unavailable / Offline.';
        break;
      default:
        logMsg = 'Web Firestore Error: ${e.message}';
    }
    FirebaseService.logError(e, stack, reason: '$message: $logMsg');
  }

  // --- CRUD helpers ---
  
  Future<DocumentSnapshot?> getDocument(String collection, String id) {
    return handleFirestoreOperation(() => _firestore.collection(collection).doc(id).get());
  }

  Future<void> setDocument(String collection, String id, Map<String, dynamic> data) {
    return handleFirestoreOperation(() => _firestore.collection(collection).doc(id).set(data));
  }
}
