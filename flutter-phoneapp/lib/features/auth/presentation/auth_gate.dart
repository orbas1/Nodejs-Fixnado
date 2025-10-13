import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/app_shell.dart';
import '../application/auth_controller.dart';
import '../domain/auth_models.dart';
import 'registration_screen.dart';
import 'sign_up_screen.dart';

class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(authControllerProvider);

    Widget child;
    switch (state.stage) {
      case AuthStage.signUp:
        child = SignUpScreen(key: const ValueKey('signUp'), initialData: state.signUpData);
        break;
      case AuthStage.registration:
        final signUpData = state.signUpData;
        if (signUpData == null) {
          child = const SignUpScreen(key: ValueKey('signUpFallback'));
        } else {
          child = RegistrationScreen(key: const ValueKey('registration'), signUpData: signUpData);
        }
        break;
      case AuthStage.authenticated:
        child = const AppShell(key: ValueKey('appShell'));
        break;
    }

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 250),
      child: child,
    );
  }
}
