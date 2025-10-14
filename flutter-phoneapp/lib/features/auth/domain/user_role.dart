enum UserRole {
  customer('Customer'),
  serviceman('Serviceman'),
  provider('Provider'),
  enterprise('Enterprise');

  const UserRole(this.displayName);

  final String displayName;
}

extension UserRolePolicies on UserRole {
  bool get canAccessBusinessFronts {
    switch (this) {
      case UserRole.enterprise:
        return true;
      case UserRole.customer:
      case UserRole.serviceman:
      case UserRole.provider:
        return false;
    }
  }
}
