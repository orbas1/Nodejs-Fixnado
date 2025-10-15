# Android Updates – User App

- Leveraged `flutter_secure_storage` encrypted shared preferences with `resetOnError` enabled; ensure keystore hardware-backed storage is available and fallback behaviours are documented for devices without biometrics.
- `local_auth` integration requires the AndroidX Biometric library; manifest entries already permit face/fingerprint auth but QA must validate prompt copy once UI surfaces the unlock screen.
- Consent overlay relies on a translucent `Activity` theme to render above system bars; verify OEM-specific gesture navigation does not occlude the accept/decline buttons and adjust safe-area padding if necessary.
