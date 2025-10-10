import 'package:flutter/material.dart';

class LiveFeedList extends StatelessWidget {
  const LiveFeedList({super.key});

  static final items = [
    {
      'title': 'Emergency plumbing fix required',
      'location': 'San Francisco, CA',
      'budget': '\$180'
    },
    {
      'title': 'Assemble pop-up retail shelves',
      'location': 'New York, NY',
      'budget': '\$420'
    },
    {
      'title': 'QA tester for fintech launch',
      'location': 'Remote',
      'budget': '\$65/hr'
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final item in items)
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: ListTile(
              title: Text(item['title'] as String),
              subtitle: Text(item['location'] as String),
              trailing: Text(item['budget'] as String, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          )
      ],
    );
  }
}
