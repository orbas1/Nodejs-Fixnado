enum UserRole {
  customer('Customer'),
  serviceman('Serviceman'),
  provider('Provider'),
  enterprise('Enterprise'),
  admin('Administrator', internal: true);

  const UserRole(this.displayName, {this.internal = false});

  final String displayName;
  final bool internal;

  bool get isInternal => internal;
}

extension UserRolePolicies on UserRole {
  bool get canAccessBusinessFronts {
    switch (this) {
      case UserRole.enterprise:
      case UserRole.admin:
        return true;
      case UserRole.customer:
      case UserRole.serviceman:
      case UserRole.provider:
        return false;
    }
  }
}
