import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Icon(Icons.flash_on, size: 36),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Jordan Miles', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text('Master electrician · San Diego', style: Theme.of(context).textTheme.bodyMedium),
                  ],
                )
              ],
            ),
            const SizedBox(height: 24),
            Text('Services', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                title: const Text('Smart home setup'),
                subtitle: const Text('84 jobs completed'),
                trailing: FilledButton(onPressed: () {}, child: const Text('Book \$120/hr')),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                title: const Text('Electrical diagnostics'),
                subtitle: const Text('156 jobs completed'),
                trailing: FilledButton(onPressed: () {}, child: const Text('Book \$95/hr')),
              ),
            ),
            const SizedBox(height: 24),
            Text('Marketplace shop', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                title: const Text('Service zone coverage'),
                subtitle: const Text('Downtown, La Jolla, Pacific Beach'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
