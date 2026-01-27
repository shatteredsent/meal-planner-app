import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'firebase_service.dart';

/// Web-optimized Authentication Service.
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  Future<UserCredential?> signInWithEmailAndPassword(String email, String password) async {
    try {
      // Ensure web persistence is local (survives refreshes)
      await _auth.setPersistence(Persistence.LOCAL);
      return await _auth.signInWithEmailAndPassword(email: email, password: password);
    } on FirebaseAuthException catch (e, stack) {
      FirebaseService.logError(e, stack, reason: 'Web Auth: Sign-in Failed');
      return null;
    } catch (e, stack) {
      FirebaseService.logError(e, stack, reason: 'Unexpected Auth Error');
      return null;
    }
  }

  Future<void> signOut() async {
    try {
      await _auth.signOut();
    } catch (e, stack) {
      FirebaseService.logError(e, stack, reason: 'Web Auth: Sign-out Failed');
    }
  }

  Future<bool> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
      return true;
    } catch (e, stack) {
      FirebaseService.logError(e, stack, reason: 'Web Auth: Reset Email Failed');
      return false;
    }
  }
}
