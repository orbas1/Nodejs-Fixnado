import 'package:flutter/material.dart';

class SearchScreen extends StatelessWidget {
  const SearchScreen({super.key});

  static final results = [
    {
      'type': 'Service professional',
      'title': 'Emergency HVAC Technician',
      'location': 'Chicago, IL'
    },
    {
      'type': 'Marketplace item',
      'title': 'Commercial-grade dehumidifier',
      'location': 'Miami, FL'
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Explorer search')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TextField(
              decoration: const InputDecoration(
                labelText: 'Search keywords',
                prefixIcon: Icon(Icons.search),
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                itemCount: results.length,
                itemBuilder: (context, index) {
                  final item = results[index];
                  return Card(
                    child: ListTile(
                      leading: const Icon(Icons.explore),
                      title: Text(item['title']!),
                      subtitle: Text('${item['type']} • ${item['location']}'),
                    ),
                  );
                },
              ),
            )
          ],
        ),
      ),
    );
  }
}
