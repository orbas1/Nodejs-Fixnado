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
