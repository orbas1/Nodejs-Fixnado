import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../calendar/application/calendar_controller.dart';
import '../../profile/presentation/profile_controller.dart';
import 'auth_gate.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  double _progress = 0;
  String _status = 'Preparing mobile cockpit';
  bool _hasError = false;
  Object? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    setState(() {
      _progress = 0.15;
      _status = 'Authenticating tenant session';
      _hasError = false;
      _error = null;
    });

    try {
      final profileController = ref.read(profileControllerProvider.notifier);
      final calendarController = ref.read(calendarControllerProvider.notifier);

      await Future.wait([
        profileController.refresh(),
        calendarController.loadEvents(),
      ]);

      if (!mounted) return;
      setState(() {
        _progress = 0.9;
        _status = 'Syncing compliance dashboards';
      });

      await Future.delayed(const Duration(milliseconds: 400));

      if (!mounted) return;
      setState(() {
        _progress = 1.0;
        _status = 'Launching command centre';
      });

      await Future.delayed(const Duration(milliseconds: 250));

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 600),
          pageBuilder: (context, animation, secondaryAnimation) => FadeTransition(
            opacity: animation,
            child: const AuthGate(),
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _error = error;
        _status = 'We hit turbulence starting Fixnado';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(Icons.bolt, color: theme.colorScheme.onPrimary, size: 32),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Fixnado Mobile',
                          style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700)),
                      Text('Enterprise field command centre',
                          style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                ],
              ),
              const Spacer(),
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(32),
                  gradient: LinearGradient(
                    colors: [theme.colorScheme.primary.withOpacity(0.08), theme.colorScheme.secondary.withOpacity(0.08)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_status, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 16),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: LinearProgressIndicator(
                        value: _hasError ? null : _progress,
                        minHeight: 12,
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (_hasError)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Diagnostics: ${_error ?? 'unknown error'}',
                            style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.error),
                          ),
                          const SizedBox(height: 12),
                          FilledButton.icon(
                            onPressed: _bootstrap,
                            icon: const Icon(Icons.refresh_outlined),
                            label: const Text('Retry launch'),
                          ),
                        ],
                      )
                    else
                      Row(
                        children: [
                          const Icon(Icons.verified, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Hardening biometrics, offline cache, and compliance telemetry before handing control to you.',
                              style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  TextButton.icon(
                    onPressed: () => showModalBottomSheet<void>(
                      context: context,
                      showDragHandle: true,
                      builder: (context) => const _ReleaseNotesSheet(),
                    ),
                    icon: const Icon(Icons.article_outlined),
                    label: const Text('What’s new'),
                  ),
                  const Spacer(),
                  Text('v0.1.0 • secure tenant', style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.outline)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReleaseNotesSheet extends StatelessWidget {
  const _ReleaseNotesSheet();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Release highlights', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          _Bullet(text: 'Calendar hub with offline support and mobilisation analytics.'),
          _Bullet(text: 'Profile experience preview with instant calendar actions.'),
          _Bullet(text: 'Biometric hardening and diagnostics telemetry improvements.'),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bullet extends StatelessWidget {
  const _Bullet({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.check_circle_outline, color: theme.colorScheme.primary, size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text, style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
          ),
        ],
      ),
    );
  }
}
