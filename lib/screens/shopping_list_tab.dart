import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/shopping_list_provider.dart';
import '../providers/meal_provider.dart';
import '../models/models.dart';

class ShoppingListTab extends StatefulWidget {
  const ShoppingListTab({super.key});

  @override
  State<ShoppingListTab> createState() => _ShoppingListTabState();
}

class _ShoppingListTabState extends State<ShoppingListTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() async {
    await context.read<ShoppingListProvider>().loadShoppingList();
    await context.read<MealProvider>().loadMeals();

    // Sync shopping list with current meals
    final meals = context.read<MealProvider>().meals;
    context.read<ShoppingListProvider>().syncShoppingListFromMeals(meals);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true, 
      appBar: AppBar(
        title: const Text('Shopping List'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
          // ADDED ALEXA BUTTON:
          Consumer<ShoppingListProvider>(
            builder: (context, provider, child) {
              final hasStaples = provider.items.any((item) => 
                item.name.toLowerCase().contains('staples') ||
                item.name.toLowerCase().contains('basic') ||
                provider.items.length > 5 // Auto-trigger for larger lists
              );
              
              if (hasStaples) {
                return Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: ElevatedButton.icon(
                    onPressed: () => _showAlexaSyncDialog(),
                    icon: const Icon(Icons.speaker, size: 18),
                    label: const Text('Sync Alexa'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                      foregroundColor: Theme.of(context).colorScheme.onPrimaryContainer,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
        flexibleSpace: ClipRRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              color: Theme.of(context).colorScheme.surface.withOpacity(0.5),
            ),
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Theme.of(context).colorScheme.onSurface,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Theme.of(context).colorScheme.surface,
              Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
            ],
          ),
        ),
        child: Consumer<ShoppingListProvider>(
          builder: (context, shoppingListProvider, child) {
            if (shoppingListProvider.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (shoppingListProvider.items.isEmpty) {
              return _buildEmptyState();
            }

            // Group items
            final itemsByCategory = <String, List<ShoppingListItem>>{};
            for (var item in shoppingListProvider.items) {
              if (!itemsByCategory.containsKey(item.category)) {
                itemsByCategory[item.category] = [];
              }
              itemsByCategory[item.category]!.add(item);
            }

            final sortedCategories = itemsByCategory.keys.toList()..sort();

            return ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 100, 16, 24),
              itemCount: sortedCategories.length,
              itemBuilder: (context, index) {
                final category = sortedCategories[index];
                final categoryItems = itemsByCategory[category] ?? [];
                categoryItems.sort((a, b) => a.name.compareTo(b.name));

                // Staggered Animation
                return TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.0, end: 1.0),
                  duration: Duration(milliseconds: 400 + (index * 100)),
                  curve: Curves.easeOutQuad,
                  builder: (context, value, child) {
                    return Transform.translate(
                      offset: Offset(0, 20 * (1 - value)),
                      child: Opacity(
                        opacity: value,
                        child: child,
                      ),
                    );
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _GlassCategoryHeader(title: category, count: categoryItems.length),
                      const SizedBox(height: 8),
                      ...categoryItems.map((item) => ShoppingItemCard(item: item)),
                      const SizedBox(height: 16),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  void _showAlexaSyncDialog() async {
    final provider = context.read<ShoppingListProvider>();
    final isAuthenticated = await provider.isAlexaAuthenticated();
    
    if (!isAuthenticated) {
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.speaker, color: Colors.blue),
              SizedBox(width: 8),
              Text('Connect to Alexa'),
            ],
          ),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('To sync with your Alexa device, you need to sign in with your Amazon account.'),
              SizedBox(height: 16),
              Text('This will allow the app to add items to your Alexa shopping list.'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _showManualTokenDialog();
              },
              child: const Text('Manual Entry'),
            ),
            ElevatedButton.icon(
              onPressed: () async {
                Navigator.pop(context);
                await provider.authenticateAlexa();
              },
              icon: const Icon(Icons.login),
              label: const Text('Sign in with Amazon'),
            ),
          ],
        ),
      );
      return;
    }
    
    // Show sync dialog for authenticated users
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.speaker, color: Colors.blue),
            SizedBox(width: 8),
            Text('Sync with Alexa'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Sync ${provider.items.length} items to your Alexa shopping list?'),
            const SizedBox(height: 16),
            const Text('After syncing, try saying:', 
                 style: TextStyle(fontWeight: FontWeight.bold)),
            const Text('"Alexa, what\'s on my shopping list?"', 
                 style: TextStyle(fontStyle: FontStyle.italic, color: Colors.blue)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.pop(context);
              
              // Show loading
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Row(
                    children: [
                      SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      ),
                      SizedBox(width: 16),
                      Text('Syncing to Alexa...'),
                    ],
                  ),
                  duration: Duration(seconds: 10),
                ),
              );
              
              final success = await provider.syncToAlexa();
              
              // Clear loading snackbar
              ScaffoldMessenger.of(context).clearSnackBars();
              
              // Show result
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Row(
                    children: [
                      Icon(
                        success ? Icons.check_circle : Icons.error,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 8),
                      Text(success 
                        ? '✅ Successfully synced ${provider.items.length} items to Alexa!' 
                        : '❌ Failed to sync to Alexa. Please try again.'),
                    ],
                  ),
                  backgroundColor: success ? Colors.green : Colors.red,
                  duration: const Duration(seconds: 4),
                ),
              );
            },
            icon: const Icon(Icons.sync),
            label: const Text('Sync Now'),
          ),
        ],
      ),
    );
  }

  void _showManualTokenDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Manual Alexa Connection'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Paste the authorization code from the Amazon account linking page:'),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Authorization Code',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                final success = await context.read<ShoppingListProvider>().setAlexaAuthCode(controller.text);
                if (mounted) {
                  if (success) {
                    Navigator.pop(context);
                    _showAlexaSyncDialog(); 
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('❌ Invalid code. Please try again.'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              }
            },
            child: const Text('Connect'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_cart_outlined, 
               size: 80, 
               color: Theme.of(context).colorScheme.primary.withOpacity(0.5)),
          const SizedBox(height: 24),
          Text(
            'Your List is Empty',
            style: TextStyle(
              fontSize: 24, 
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add meals to your plan to get started.',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}

class _GlassCategoryHeader extends StatelessWidget {
  final String title;
  final int count;

  const _GlassCategoryHeader({required this.title, required this.count});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.7),
            border: Border.all(
              color: Colors.white.withOpacity(0.2),
              width: 1,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.onPrimaryContainer.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  count.toString(),
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ShoppingItemCard extends StatefulWidget {
  final ShoppingListItem item;

  const ShoppingItemCard({super.key, required this.item});

  @override
  State<ShoppingItemCard> createState() => _ShoppingItemCardState();
}

class _ShoppingItemCardState extends State<ShoppingItemCard> {
  bool _isHovering = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovering = true),
      onExit: (_) => setState(() => _isHovering = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: theme.cardTheme.color ?? theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _isHovering 
                ? theme.colorScheme.primary.withOpacity(0.5) 
                : theme.colorScheme.outlineVariant.withOpacity(0.5),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: theme.shadowColor.withOpacity(_isHovering ? 0.15 : 0.05),
              blurRadius: _isHovering ? 12 : 4,
              offset: Offset(0, _isHovering ? 4 : 2),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              context.read<ShoppingListProvider>().toggleItemChecked(widget.item.id);
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  // Animated Checkbox
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutBack,
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: widget.item.isChecked ? theme.colorScheme.primary : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: widget.item.isChecked ? theme.colorScheme.primary : theme.colorScheme.outline,
                        width: 2,
                      ),
                    ),
                    child: widget.item.isChecked
                        ? Icon(Icons.check, size: 16, color: theme.colorScheme.onPrimary)
                        : null,
                  ),
                  const SizedBox(width: 16),
                  if (widget.item.name.toLowerCase().contains('staples') ||
                      widget.item.category == 'Essentials')
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Icon(
                        Icons.speaker_outlined,
                        size: 16,
                        color: theme.colorScheme.primary.withOpacity(0.7),
                      ),
                    ),
                  
                  // Text Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AnimatedDefaultTextStyle(
                          duration: const Duration(milliseconds: 300),
                          style: TextStyle(
                            fontSize: 16,
                            color: widget.item.isChecked 
                                ? theme.colorScheme.onSurface.withOpacity(0.5) 
                                : theme.colorScheme.onSurface,
                            decoration: widget.item.isChecked 
                                ? TextDecoration.lineThrough 
                                : TextDecoration.none,
                            decorationColor: theme.colorScheme.primary,
                            decorationThickness: 2,
                          ),
                          child: Text(widget.item.name),
                        ),
                        if (widget.item.quantity > 1) 
                          Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              'Qty: ${widget.item.quantity}',
                              style: TextStyle(
                                fontSize: 12,
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

