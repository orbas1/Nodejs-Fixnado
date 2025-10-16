import 'dart:async';
import 'dart:math';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'app/app_failure_boundary.dart';
import 'app/bootstrap.dart';
import 'core/diagnostics/app_diagnostics_reporter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final bootstrap = await Bootstrap.load();
  final telemetryClient = http.Client();
  final reporter = AppDiagnosticsReporter(telemetryClient, bootstrap.config);
  final fatalErrorNotifier = ValueNotifier<AppFatalError?>(null);
  final random = Random();

  String generateReference() {
    final millis = DateTime.now().millisecondsSinceEpoch.toRadixString(36);
    final entropy = random.nextInt(1 << 32).toRadixString(36);
    return 'mob-$millis-$entropy';
  }

  void recordFatal(Object error, StackTrace stackTrace, String context) {
    final reference = generateReference();
    fatalErrorNotifier.value = AppFatalError(
      reference: reference,
      error: error,
      stackTrace: stackTrace,
      context: context,
    );
    unawaited(
      reporter.report(
        reference: reference,
        error: error,
        stackTrace: stackTrace,
        context: context,
      ),
    );
  }

  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    recordFatal(details.exception, details.stack ?? StackTrace.empty, 'flutter');
  };

  PlatformDispatcher.instance.onError = (error, stackTrace) {
    recordFatal(error, stackTrace, 'platform');
    return true;
  };

  runZonedGuarded(
    () {
      runApp(
        AppFailureBoundary(
          bootstrap: bootstrap,
          fatalErrorNotifier: fatalErrorNotifier,
          reporter: reporter,
        ),
      );
    },
    (error, stackTrace) => recordFatal(error, stackTrace, 'zone'),
  );
}
