import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../app.dart';
import '../core/diagnostics/app_diagnostics_reporter.dart';
import 'bootstrap.dart';

class AppFatalError {
  AppFatalError({
    required this.reference,
    required this.error,
    required this.stackTrace,
    required this.context,
    DateTime? occurredAt,
  }) : occurredAt = occurredAt ?? DateTime.now();

  final String reference;
  final Object error;
  final StackTrace stackTrace;
  final String context;
  final DateTime occurredAt;

  Map<String, dynamic> toJson() {
    return {
      'reference': reference,
      'context': context,
      'occurredAt': occurredAt.toUtc().toIso8601String(),
      'error': {
        'type': error.runtimeType.toString(),
        'message': error.toString(),
        'stackTrace': stackTrace.toString(),
      }
    };
  }
}

class AppFailureBoundary extends StatefulWidget {
  const AppFailureBoundary({
    required this.bootstrap,
    required this.fatalErrorNotifier,
    required this.reporter,
    super.key,
  });

  final Bootstrap bootstrap;
  final ValueNotifier<AppFatalError?> fatalErrorNotifier;
  final AppDiagnosticsReporter reporter;

  @override
  State<AppFailureBoundary> createState() => _AppFailureBoundaryState();
}

class _AppFailureBoundaryState extends State<AppFailureBoundary> {
  late Bootstrap _bootstrap = widget.bootstrap;
  bool _restarting = false;

  Future<void> _handleRestart() async {
    if (_restarting) {
      return;
    }

    setState(() => _restarting = true);

    try {
      _bootstrap.dispose();
      final nextBootstrap = await Bootstrap.load();
      widget.reporter.updateConfig(nextBootstrap.config);
      setState(() {
        _bootstrap = nextBootstrap;
        _restarting = false;
      });
      widget.fatalErrorNotifier.value = null;
    } catch (error, stackTrace) {
      await widget.reporter.report(
        reference: 'restart-${DateTime.now().millisecondsSinceEpoch}',
        error: error,
        stackTrace: stackTrace,
        context: 'restart',
      );
      setState(() => _restarting = false);
    }
  }

  @override
  void dispose() {
    widget.reporter.dispose();
    _bootstrap.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<AppFatalError?>(
      valueListenable: widget.fatalErrorNotifier,
      builder: (context, fatalError, child) {
        if (_restarting) {
          return const MaterialApp(
            debugShowCheckedModeBanner: false,
            home: Scaffold(
              body: Center(
                child: CircularProgressIndicator(),
              ),
            ),
          );
        }

        if (fatalError != null) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              colorSchemeSeed: const Color(0xFF0F172A),
              useMaterial3: true,
              textTheme: GoogleFonts.interTextTheme(),
            ),
            home: FatalErrorScreen(
              error: fatalError,
              onRestart: _handleRestart,
            ),
          );
        }

        return ProviderScope(
          overrides: _bootstrap.overrides,
          observers: _bootstrap.observers,
          child: const FixnadoApp(),
        );
      },
    );
  }
}

class FatalErrorScreen extends StatefulWidget {
  const FatalErrorScreen({required this.error, required this.onRestart, super.key});

  final AppFatalError error;
  final Future<void> Function() onRestart;

  @override
  State<FatalErrorScreen> createState() => _FatalErrorScreenState();
}

class _FatalErrorScreenState extends State<FatalErrorScreen> {
  bool _copySuccess = false;
  bool _restartPending = false;

  Future<void> _copySupportEmail(String email) async {
    await Clipboard.setData(ClipboardData(text: email));
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Support email copied to clipboard')),
    );
  }

  Future<void> _copyDiagnostics() async {
    final payload = const JsonEncoder.withIndent('  ').convert(widget.error.toJson());
    await Clipboard.setData(ClipboardData(text: payload));
    if (!mounted) {
      return;
    }
    setState(() => _copySuccess = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Diagnostics copied to clipboard')),
    );
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() => _copySuccess = false);
      }
    });
  }

  Future<void> _restart() async {
    if (_restartPending) {
      return;
    }
    setState(() => _restartPending = true);
    await widget.onRestart();
    if (mounted) {
      setState(() => _restartPending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final diagnostics = widget.error.toJson();
    const supportEmail = 'support@fixnado.com';

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 540),
              child: Card(
                color: Colors.white,
                elevation: 8,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Critical incident',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'We hit a snag while loading Fixnado.',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'We have recorded this crash and notified engineering. Share the reference below with support so we can trace it quickly.',
                        style: theme.textTheme.bodyMedium?.copyWith(color: Colors.blueGrey.shade700, height: 1.5),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Reference ID', style: theme.textTheme.labelLarge?.copyWith(color: Colors.blueGrey.shade700)),
                            const SizedBox(height: 6),
                            SelectableText(
                              widget.error.reference,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontFamily: 'SourceCodePro',
                                letterSpacing: 1.1,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _restartPending ? null : _restart,
                        icon: const Icon(Icons.refresh_rounded),
                        label: Text(_restartPending ? 'Restarting…' : 'Restart Fixnado'),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => _copySupportEmail(supportEmail),
                        icon: const Icon(Icons.email_outlined),
                        label: Text(supportEmail),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextButton.icon(
                        onPressed: _copyDiagnostics,
                        icon: Icon(_copySuccess ? Icons.check_rounded : Icons.copy_all_rounded),
                        label: Text(_copySuccess ? 'Diagnostics copied' : 'Copy diagnostics'),
                      ),
                      const SizedBox(height: 24),
                      ExpansionTile(
                        title: const Text('Technical details'),
                        children: [
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: SelectableText(
                              const JsonEncoder.withIndent('  ').convert(diagnostics),
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontFamily: 'SourceCodePro',
                                color: Colors.blueGrey.shade800,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Need help fast? Email $supportEmail with the reference ID so we can triage immediately.',
                        style: theme.textTheme.bodySmall?.copyWith(color: Colors.blueGrey.shade600),
                      )
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
