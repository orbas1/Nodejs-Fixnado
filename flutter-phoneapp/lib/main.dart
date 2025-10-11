import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'app/bootstrap.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final bootstrap = await Bootstrap.load();

  runApp(
    ProviderScope(
      overrides: bootstrap.overrides,
      observers: bootstrap.observers,
      child: const FixnadoApp(),
    ),
  );
}
