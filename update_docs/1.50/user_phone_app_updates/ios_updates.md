# iOS Updates – User App

- Configured secure storage to use the data-protection keychain with `KeychainAccessibility.unlocked_this_device`, aligning with the backend requirement for biometric or passcode unlock prior to exposing tokens.
- Biometric unlock leverages `local_auth`; ensure entitlement provisioning profiles include Face ID/Touch ID usage descriptions before the security modal is wired up in UI.
- Consent overlay applies `SafeArea` padding and Cupertino typography so policy cards remain legible under dynamic type; validate VoiceOver reads ledger timestamps, version badges, and accept/decline actions sequentially.
