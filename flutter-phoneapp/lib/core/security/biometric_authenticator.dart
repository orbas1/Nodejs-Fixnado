import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';

/// Wrapper around [LocalAuthentication] that normalises biometric and passcode
/// unlock checks for session unsealing.
class BiometricAuthenticator {
  BiometricAuthenticator({LocalAuthentication? localAuthentication})
      : _localAuth = localAuthentication ?? LocalAuthentication();

  final LocalAuthentication _localAuth;

  Future<bool> isDeviceSupported() async {
    try {
      return await _localAuth.isDeviceSupported();
    } catch (_) {
      return false;
    }
  }

  Future<bool> canCheckBiometrics() async {
    try {
      return await _localAuth.canCheckBiometrics || await _localAuth.isDeviceSupported();
    } catch (_) {
      return false;
    }
  }

  Future<bool> authenticate({
    String reason = 'Unlock Fixnado session',
    bool stickyAuth = true,
  }) async {
    try {
      final supported = await canCheckBiometrics();
      if (!supported) {
        return false;
      }
      return await _localAuth.authenticate(
        localizedReason: reason,
        options: AuthenticationOptions(
          stickyAuth: stickyAuth,
          biometricOnly: false,
          sensitiveTransaction: true,
        ),
      );
    } on PlatformException {
      return false;
    }
  }

  Future<void> cancel() => _localAuth.stopAuthentication();
}
