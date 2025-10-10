import 'package:flutter/material.dart';
import '../widgets/live_feed_list.dart';

class FeedScreen extends StatelessWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Live feed')),
      body: const Padding(
        padding: EdgeInsets.all(24),
        child: LiveFeedList(),
      ),
    );
  }
}
