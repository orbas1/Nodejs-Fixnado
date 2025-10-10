import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool email2fa = false;
  bool google2fa = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 12),
            TextField(
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              value: email2fa,
              title: const Text('Email 2FA'),
              onChanged: (value) => setState(() => email2fa = value),
            ),
            SwitchListTile(
              value: google2fa,
              title: const Text('Google Authenticator'),
              onChanged: (value) => setState(() => google2fa = value),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () {},
              child: const Text('Login securely'),
            )
          ],
        ),
      ),
    );
  }
}
