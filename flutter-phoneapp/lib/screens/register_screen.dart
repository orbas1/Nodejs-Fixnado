import 'package:flutter/material.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  String userType = 'user';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(decoration: const InputDecoration(labelText: 'First name')),
            const SizedBox(height: 12),
            TextField(decoration: const InputDecoration(labelText: 'Last name')),
            const SizedBox(height: 12),
            TextField(decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 12),
            TextField(obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
            const SizedBox(height: 12),
            TextField(decoration: const InputDecoration(labelText: 'Address')),
            const SizedBox(height: 12),
            TextField(decoration: const InputDecoration(labelText: 'Age'), keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: userType,
              decoration: const InputDecoration(labelText: 'User type'),
              items: const [
                DropdownMenuItem(value: 'user', child: Text('User')),
                DropdownMenuItem(value: 'servicemen', child: Text('Service professional')),
                DropdownMenuItem(value: 'company', child: Text('Company')),
              ],
              onChanged: (value) => setState(() => userType = value ?? 'user'),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () {},
              child: const Text('Create account'),
            )
          ],
        ),
      ),
    );
  }
}
