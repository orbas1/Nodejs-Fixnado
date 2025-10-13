import 'user_role.dart';

enum AuthStage { signUp, registration, authenticated }

class SignUpData {
  const SignUpData({
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.password,
    required this.role,
  });

  final String firstName;
  final String lastName;
  final String email;
  final String password;
  final UserRole role;

  SignUpData copyWith({
    String? firstName,
    String? lastName,
    String? email,
    String? password,
    UserRole? role,
  }) {
    return SignUpData(
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      password: password ?? this.password,
      role: role ?? this.role,
    );
  }
}

class RegistrationData {
  const RegistrationData({
    required this.address,
    required this.phoneNumber,
    required this.primaryZone,
    required this.preferredRoles,
    this.companyName,
    this.bio,
  });

  final String address;
  final String phoneNumber;
  final String primaryZone;
  final Set<UserRole> preferredRoles;
  final String? companyName;
  final String? bio;
}

class UserProfile {
  const UserProfile({
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.primaryRole,
    required this.address,
    required this.phoneNumber,
    required this.primaryZone,
    this.companyName,
    this.bio,
  });

  final String firstName;
  final String lastName;
  final String email;
  final UserRole primaryRole;
  final String address;
  final String phoneNumber;
  final String primaryZone;
  final String? companyName;
  final String? bio;

  String get displayName => '$firstName $lastName'.trim();

  UserProfile copyWith({
    String? firstName,
    String? lastName,
    String? email,
    UserRole? primaryRole,
    String? address,
    String? phoneNumber,
    String? primaryZone,
    String? companyName,
    String? bio,
  }) {
    return UserProfile(
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      primaryRole: primaryRole ?? this.primaryRole,
      address: address ?? this.address,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      primaryZone: primaryZone ?? this.primaryZone,
      companyName: companyName ?? this.companyName,
      bio: bio ?? this.bio,
    );
  }
}

class AuthState {
  const AuthState({
    required this.stage,
    this.signUpData,
    this.profile,
    this.availableRoles = const {UserRole.customer},
  });

  factory AuthState.initial() => const AuthState(stage: AuthStage.signUp);

  final AuthStage stage;
  final SignUpData? signUpData;
  final UserProfile? profile;
  final Set<UserRole> availableRoles;

  AuthState copyWith({
    AuthStage? stage,
    SignUpData? signUpData,
    UserProfile? profile,
    Set<UserRole>? availableRoles,
  }) {
    return AuthState(
      stage: stage ?? this.stage,
      signUpData: signUpData ?? this.signUpData,
      profile: profile ?? this.profile,
      availableRoles: availableRoles ?? this.availableRoles,
    );
  }
}
