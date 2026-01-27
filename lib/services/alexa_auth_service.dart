import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:url_launcher/url_launcher.dart';

class AlexaAuthService {
  static const String _clientId = String.fromEnvironment('ALEXA_CLIENT_ID', defaultValue: '');
  
  // Official Amazon LWA redirect URI
  static const String _redirectUri = 'https://pitangui.amazon.com/spa/skill/account-linking-status.html?vendorId=M3LR9C5NBR9T8A';
  
  // Alexa Skill ID
  static const String _skillId = String.fromEnvironment('ALEXA_SKILL_ID', defaultValue: '');
  
  // Basic profile scope to verify connectivity
  static const String _fullScope = 'profile';

  // FIX: WebOptions are required to prevent "Cannot send Null" errors on web platforms
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    webOptions: WebOptions(
      dbName: 'MealPlannerAuth',
      publicKey: 'AlexaAuth',
    ),
  );

  Future<void> login() async {
    final url = Uri.parse(
      'https://www.amazon.com/ap/oa'
      '?client_id=$_clientId'
      '&scope=${Uri.encodeComponent(_fullScope)}'
      '&response_type=token' // Implicit Grant
      '&redirect_uri=${Uri.encodeComponent(_redirectUri)}'
    );

    try {
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.platformDefault);
      } else {
        debugPrint('Gus Error: Could not launch Alexa login URL');
        throw 'Could not launch Alexa login';
      }
    } catch (e) {
      debugPrint('Gus Error during login launch: $e');
      rethrow;
    }
  }

  // Captures the token from the URL fragment (#access_token=...) if applicable
  Future<bool> handleRedirect(Uri uri) async {
    final fragment = uri.fragment;
    if (fragment.isEmpty) return false;

    final params = Uri.splitQueryString(fragment);
    if (params.containsKey('access_token')) {
      final token = params['access_token'];
      if (token != null) {
        await setToken(token);
        return true;
      }
    }
    return false;
  }

  // Manual token entry for cases where automatic capture isn't possible
  Future<void> setToken(String token) async {
    await _storage.write(key: 'alexa_access_token', value: token);
  }

  // FIX: Ensures a String is always returned, preventing null-related crashes
  Future<String> getToken() async {
    try {
      final token = await _storage.read(key: 'alexa_access_token');
      return token ?? ''; 
    } catch (e) {
      debugPrint('Secure Storage Read Error: $e');
      return '';
    }
  }

  Future<void> logout() async {
    try {
      await _storage.delete(key: 'alexa_access_token');
    } catch (e) {
      debugPrint('Secure Storage Delete Error: $e');
    }
  }
}