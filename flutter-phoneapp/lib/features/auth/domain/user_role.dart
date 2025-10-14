enum UserRole {
  customer('Customer'),
  serviceman('Serviceman'),
  provider('Provider'),
  enterprise('Enterprise'),
  support('Support'),
  operations('Operations'),
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
      case UserRole.support:
      case UserRole.operations:
      case UserRole.customer:
      case UserRole.serviceman:
      case UserRole.provider:
      case UserRole.admin:
        return false;
    }
  }
}
