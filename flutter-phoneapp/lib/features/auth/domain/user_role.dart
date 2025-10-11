enum UserRole {
  customer('Customer'),
  serviceman('Serviceman'),
  provider('Provider'),
  enterprise('Enterprise');

  const UserRole(this.displayName);

  final String displayName;
}
