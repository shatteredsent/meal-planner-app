import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'alexa_auth_service.dart';

class AlexaApiService {
  static const String _baseUrl = 'https://api.amazonalexa.com/v2/householdlists';
  final AlexaAuthService _authService = AlexaAuthService();

  Future<bool> syncShoppingList(List<String> items) async {
    try {
      final token = await _authService.getToken();
      if (token == null || token.isEmpty) {
        debugPrint('No Alexa token available');
        return false;
      }

      // Get all household lists
      final listsResponse = await http.get(
        Uri.parse(_baseUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (listsResponse.statusCode != 200) {
        debugPrint('Failed to get lists: ${listsResponse.statusCode}');
        return false;
      }

      final listsData = json.decode(listsResponse.body);
      final lists = listsData['lists'] as List;
      
      // Find the shopping list (Alexa default shopping list)
      final shoppingList = lists.firstWhere(
        (list) => list['name'] == 'Alexa shopping list',
        orElse: () => lists.isNotEmpty ? lists.first : null,
      );

      if (shoppingList == null) {
        debugPrint('No shopping list found');
        return false;
      }

      final listId = shoppingList['listId'];

      // Clear existing items first (optional - remove if you want to append)
      await _clearExistingItems(listId, token);

      // Add new items
      int successCount = 0;
      for (var itemName in items) {
        final success = await _addItemToList(listId, itemName, token);
        if (success) successCount++;
      }

      debugPrint('Synced $successCount/${items.length} items to Alexa');
      return successCount > 0;

    } catch (e) {
      debugPrint('Error syncing to Alexa: $e');
      return false;
    }
  }

  Future<void> _clearExistingItems(String listId, String token) async {
    try {
      final itemsResponse = await http.get(
        Uri.parse('$_baseUrl/$listId/items'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (itemsResponse.statusCode == 200) {
        final itemsData = json.decode(itemsResponse.body);
        final items = itemsData['items'] as List;

        for (var item in items) {
          await http.delete(
            Uri.parse('$_baseUrl/$listId/items/${item['id']}'),
            headers: {'Authorization': 'Bearer $token'},
          );
        }
      }
    } catch (e) {
      debugPrint('Error clearing existing items: $e');
    }
  }

  Future<bool> _addItemToList(String listId, String itemName, String token) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/$listId/items'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'value': itemName,
          'status': 'active',
        }),
      );

      return response.statusCode == 201;
    } catch (e) {
      debugPrint('Error adding item "$itemName": $e');
      return false;
    }
  }

  Future<bool> isAuthenticated() async {
    final token = await _authService.getToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> authenticate() async {
    await _authService.login();
  }
}
