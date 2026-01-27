import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/secrets.dart';

class AlexaAuthService {
  static const String _clientId = AlexaSecrets.clientId;
  static const String _clientSecret = AlexaSecrets.clientSecret;
  
  // Official Amazon LWA redirect URI
  static const String _redirectUri = AlexaSecrets.redirectUri;
  
  // Alexa Skill ID
  static const String _skillId = AlexaSecrets.skillId;
  
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
      '&response_type=code'
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

  // Handle the authorization code received from the redirect
  Future<bool> handleAuthCode(String code) async {
    try {
      final response = await http.post(
        Uri.parse('https://api.amazon.com/auth/o2/token'),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': _redirectUri,
          'client_id': _clientId,
          'client_secret': _clientSecret,
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await _storage.write(key: 'alexa_access_token', value: data['access_token']);
        return true;
      } else {
        debugPrint('Token exchange failed: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('Error exchanging code for token: $e');
      return false;
    }
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