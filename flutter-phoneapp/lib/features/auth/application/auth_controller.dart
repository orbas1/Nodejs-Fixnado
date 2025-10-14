import 'dart:collection';

import 'auth_token_controller.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/auth_models.dart';
import '../domain/role_scope.dart';
import '../domain/user_role.dart';

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});

final availableRolesProvider = Provider<List<UserRole>>((ref) {
  final state = ref.watch(authControllerProvider);
  if (state.availableRoles.isEmpty) {
    return UserRole.values;
  }
  final roles = state.availableRoles.toList()..sort((a, b) => a.index.compareTo(b.index));
  return roles;
});

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(AuthState.initial());

  final Ref _ref;

  void startSignUp([SignUpData? data]) {
    final roles = data != null ? {data.role} : {UserRole.customer};
    state = state.copyWith(stage: AuthStage.signUp, signUpData: data, availableRoles: roles);
    _ref.read(currentRoleProvider.notifier).state = data?.role ?? UserRole.customer;
  }

  void submitSignUp(SignUpData data) {
    state = state.copyWith(
      stage: AuthStage.registration,
      signUpData: data,
      availableRoles: {data.role},
    );
    _ref.read(currentRoleProvider.notifier).state = data.role;
  }

  void completeRegistration(RegistrationData registration) {
    final signUpData = state.signUpData;
    if (signUpData == null) {
      return;
    }
    final preferredRoles = registration.preferredRoles.isEmpty
        ? {signUpData.role}
        : LinkedHashSet<UserRole>.from(registration.preferredRoles);
    final profile = UserProfile(
      firstName: signUpData.firstName,
      lastName: signUpData.lastName,
      email: signUpData.email,
      primaryRole: preferredRoles.first,
      address: registration.address,
      phoneNumber: registration.phoneNumber,
      primaryZone: registration.primaryZone,
      companyName: registration.companyName?.isEmpty ?? true ? null : registration.companyName,
      bio: registration.bio?.isEmpty ?? true ? null : registration.bio,
    );

    state = state.copyWith(
      stage: AuthStage.authenticated,
      profile: profile,
      availableRoles: preferredRoles,
    );
    _ref.read(currentRoleProvider.notifier).state = profile.primaryRole;
  }

  void setActiveRole(UserRole role) {
    final currentProfile = state.profile;
    if (state.stage != AuthStage.authenticated || currentProfile == null) {
      return;
    }
    if (!state.availableRoles.contains(role)) {
      return;
    }
    final updatedProfile = currentProfile.copyWith(primaryRole: role);
    state = state.copyWith(profile: updatedProfile);
    _ref.read(currentRoleProvider.notifier).state = role;
  }

  void updatePreferredRoles(Set<UserRole> roles) {
    if (state.stage != AuthStage.registration) {
      return;
    }
    state = state.copyWith(
      availableRoles: roles.isEmpty ? state.availableRoles : LinkedHashSet<UserRole>.from(roles),
    );
  }

  void signOut() {
    state = AuthState.initial();
    _ref.read(currentRoleProvider.notifier).state = UserRole.customer;
    // Clear any cached API credentials to mirror server-side session revocation.
    // Intentionally not awaiting to avoid blocking UI transitions.
    // ignore: discarded_futures
    _ref.read(authTokenProvider.notifier).setToken(null);
  }
}
