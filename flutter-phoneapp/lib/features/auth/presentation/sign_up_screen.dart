import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../application/auth_controller.dart';
import '../domain/auth_models.dart';
import '../domain/user_role.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key, this.initialData});

  final SignUpData? initialData;

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstNameController;
  late final TextEditingController _lastNameController;
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  late UserRole _selectedRole;

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController();
    _lastNameController = TextEditingController();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _selectedRole = UserRole.customer;
    _syncFromInitial();
  }

  @override
  void didUpdateWidget(covariant SignUpScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialData != widget.initialData) {
      _syncFromInitial();
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _syncFromInitial() {
    final data = widget.initialData;
    if (data == null) {
      return;
    }
    _firstNameController.text = data.firstName;
    _lastNameController.text = data.lastName;
    _emailController.text = data.email;
    _passwordController.text = data.password;
    _selectedRole = data.role;
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final data = SignUpData(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text.trim(),
      role: _selectedRole,
    );
    ref.read(authControllerProvider.notifier).submitSignUp(data);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Create your Fixnado account', style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text(
                    'Work smarter across home, business, and field teams. Choose the persona that matches how you will use Fixnado today—you can unlock more later.',
                    style: GoogleFonts.inter(fontSize: 14, height: 1.5, color: Colors.blueGrey.shade600),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      color: Colors.white,
                      border: Border.all(color: Colors.blueGrey.shade50),
                    ),
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(child: _buildTextField(_firstNameController, 'First name')),
                              const SizedBox(width: 16),
                              Expanded(child: _buildTextField(_lastNameController, 'Last name')),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _buildTextField(_emailController, 'Email', keyboardType: TextInputType.emailAddress),
                          const SizedBox(height: 16),
                          _buildTextField(
                            _passwordController,
                            'Password',
                            obscureText: true,
                            helperText: 'Use at least 8 characters with a mix of letters and numbers.',
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<UserRole>(
                            value: _selectedRole,
                            decoration: const InputDecoration(labelText: 'Joining as'),
                            items: UserRole.values
                                .map(
                                  (role) => DropdownMenuItem(
                                    value: role,
                                    child: Text(role.displayName),
                                  ),
                                )
                                .toList(),
                            onChanged: (role) {
                              if (role != null) {
                                setState(() => _selectedRole = role);
                              }
                            },
                          ),
                          const SizedBox(height: 24),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _submit,
                              child: const Text('Continue to registration'),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'By continuing, you agree to Fixnado’s terms of service and privacy policy.',
                            style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey.shade500),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Sign-in for existing accounts is coming soon.')),
                      );
                    },
                    icon: const Icon(Icons.login),
                    label: const Text('Already have an account? Sign in'),
                    style: TextButton.styleFrom(foregroundColor: theme.colorScheme.primary),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Need to onboard a company or enterprise account? Complete registration on web to connect procurement and finance workflows.',
                    style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey.shade500),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label, {
    TextInputType? keyboardType,
    bool obscureText = false,
    String? helperText,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(labelText: label, helperText: helperText),
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          final lower = label.toLowerCase();
          return 'Enter your $lower';
        }
        if (label == 'Email' && !_isValidEmail(value.trim())) {
          return 'Enter a valid email address';
        }
        if (label == 'Password' && value.trim().length < 8) {
          return 'Password must be at least 8 characters';
        }
        return null;
      },
    );
  }

  bool _isValidEmail(String value) {
    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    return emailRegex.hasMatch(value);
  }
}
