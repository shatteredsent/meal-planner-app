import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/profile_provider.dart';
import '../widgets/edit_profile_dialog.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
      ),
      body: Consumer<ProfileProvider>(
        builder: (context, profileProvider, child) {
          if (profileProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                // Profile Header
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      children: [
                        // Profile Picture
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.green.shade100,
                          child: Text(
                            profileProvider.getUserInitials(),
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Display Name
                        Text(
                          profileProvider.userName,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),

                        // Email or Guest Status
                        Text(
                          profileProvider.isGuest
                              ? 'Guest Mode'
                              : profileProvider.userEmail,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Action Buttons
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            OutlinedButton.icon(
                              onPressed: () => _showEditProfileDialog(context),
                              icon: const Icon(Icons.edit),
                              label: Text(profileProvider.isGuest
                                  ? 'Create Profile'
                                  : 'Edit Profile'),
                            ),
                            if (!profileProvider.isGuest)
                              OutlinedButton.icon(
                                onPressed: () =>
                                    _showLogoutDialog(context, profileProvider),
                                icon: const Icon(Icons.logout),
                                label: const Text('Logout'),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Preferences
                Card(
                  child: Column(
                    children: [
                      const ListTile(
                        title: Text(
                          'Meal Preferences',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const Divider(),
                      ListTile(
                        leading: const Icon(Icons.restaurant),
                        title: const Text('Default Meal Type'),
                        subtitle:
                            Text(profileProvider.defaultMealType.toUpperCase()),
                        trailing: const Icon(Icons.arrow_forward_ios),
                        onTap: () =>
                            _showMealTypeDialog(context, profileProvider),
                      ),
                      ListTile(
                        leading: const Icon(Icons.people),
                        title: const Text('Default Servings'),
                        subtitle:
                            Text('${profileProvider.defaultServings} people'),
                        trailing: const Icon(Icons.arrow_forward_ios),
                        onTap: () =>
                            _showServingsDialog(context, profileProvider),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // App Settings
                Card(
                  child: Column(
                    children: [
                      const ListTile(
                        title: Text(
                          'App Settings',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const Divider(),
                      SwitchListTile(
                        secondary: const Icon(Icons.dark_mode),
                        title: const Text('Dark Mode'),
                        subtitle: const Text('Switch app theme'),
                        value: profileProvider.isDarkMode,
                        onChanged: (value) => profileProvider.toggleDarkMode(),
                        activeColor: Colors.green,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // App Info
                Card(
                  child: Column(
                    children: [
                      const ListTile(
                        title: Text(
                          'About',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const Divider(),
                      const ListTile(
                        leading: Icon(Icons.info),
                        title: Text('Version'),
                        subtitle: Text('1.0.0'),
                      ),
                      ListTile(
                        leading: const Icon(Icons.description),
                        title: const Text('About Meal Planner'),
                        subtitle: const Text(
                            'Plan meals, create recipes, organize shopping'),
                        onTap: () => _showAboutDialog(context),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showEditProfileDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const EditProfileDialog(),
    );
  }

  void _showMealTypeDialog(
      BuildContext context, ProfileProvider profileProvider) {
    final mealTypes = ['breakfast', 'lunch', 'dinner'];

    showDialog(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('Default Meal Type'),
        children: mealTypes.map((type) {
          return SimpleDialogOption(
            onPressed: () {
              profileProvider.updateMealPreferences(defaultMealType: type);
              Navigator.of(context).pop();
            },
            child: Row(
              children: [
                Radio<String>(
                  value: type,
                  groupValue: profileProvider.defaultMealType,
                  onChanged: (_) {},
                ),
                Text(type.toUpperCase()),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  void _showServingsDialog(
      BuildContext context, ProfileProvider profileProvider) {
    final TextEditingController controller = TextEditingController(
      text: profileProvider.defaultServings.toString(),
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Default Servings'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Number of servings',
            hintText: '4',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final servings = int.tryParse(controller.text) ?? 4;
              if (servings > 0 && servings <= 20) {
                profileProvider.updateMealPreferences(
                    defaultServings: servings);
                Navigator.of(context).pop();
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(
      BuildContext context, ProfileProvider profileProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text(
            'Are you sure you want to logout? This will clear your profile and return to guest mode.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              profileProvider.clearSettings();
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Logged out successfully'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About Meal Planner'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Meal Planner helps you organize your weekly meals, discover new recipes, and streamline your grocery shopping.',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 16),
            Text(
              'Features:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            Text('• Plan weekly meals'),
            Text('• Create and share recipes'),
            Text('• Auto-generate shopping lists'),
            Text('• Track meal preferences'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
