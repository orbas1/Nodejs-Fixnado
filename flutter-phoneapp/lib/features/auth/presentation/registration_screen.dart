import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../application/auth_controller.dart';
import '../domain/auth_models.dart';
import '../domain/user_role.dart';

class RegistrationScreen extends ConsumerStatefulWidget {
  const RegistrationScreen({super.key, required this.signUpData});

  final SignUpData signUpData;

  @override
  ConsumerState<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends ConsumerState<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _addressController;
  late final TextEditingController _phoneController;
  late final TextEditingController _zoneController;
  late final TextEditingController _companyController;
  late final TextEditingController _bioController;
  late LinkedHashSet<UserRole> _selectedRoles;

  @override
  void initState() {
    super.initState();
    _addressController = TextEditingController();
    _phoneController = TextEditingController();
    _zoneController = TextEditingController(text: 'London Metro');
    _companyController = TextEditingController();
    _bioController = TextEditingController();
    _selectedRoles = LinkedHashSet.of({widget.signUpData.role});
  }

  @override
  void dispose() {
    _addressController.dispose();
    _phoneController.dispose();
    _zoneController.dispose();
    _companyController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  void _toggleRole(UserRole role) {
    setState(() {
      if (_selectedRoles.contains(role)) {
        if (_selectedRoles.length == 1) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Select at least one role.')),
          );
          return;
        }
        _selectedRoles.remove(role);
      } else {
        _selectedRoles.add(role);
      }
      ref.read(authControllerProvider.notifier).updatePreferredRoles(_selectedRoles);
    });
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    if (_selectedRoles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Choose at least one role to continue.')),
      );
      return;
    }
    final registration = RegistrationData(
      address: _addressController.text.trim(),
      phoneNumber: _phoneController.text.trim(),
      primaryZone: _zoneController.text.trim(),
      preferredRoles: _selectedRoles,
      companyName: _companyController.text.trim().isEmpty ? null : _companyController.text.trim(),
      bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
    );
    ref.read(authControllerProvider.notifier).completeRegistration(registration);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final headline = GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w700);
    final summaryStyle = GoogleFonts.inter(fontSize: 13, color: Colors.blueGrey.shade600, height: 1.5);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Complete your registration'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => ref.read(authControllerProvider.notifier).startSignUp(widget.signUpData),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Match Fixnado to your workflow', style: headline),
              const SizedBox(height: 8),
              Text(
                'Tell us where you operate and which experiences you need on mobile. We’ll tailor dashboards, alerts, and home screens to suit every persona you unlock.',
                style: summaryStyle,
              ),
              const SizedBox(height: 24),
              _buildSignUpSummary(theme),
              const SizedBox(height: 24),
              Form(
                key: _formKey,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.blueGrey.shade50),
                  ),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildTextField(_addressController, 'Primary address'),
                      const SizedBox(height: 16),
                      _buildTextField(
                        _phoneController,
                        'Contact number',
                        keyboardType: TextInputType.phone,
                        helperText: 'Used for urgent dispatches and concierge support.',
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        _zoneController,
                        'Operating zone',
                        helperText: 'We use this to pre-fill marketplace and logistics options.',
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        _companyController,
                        'Company name (optional)',
                        helperText: 'Link a provider, marketplace, or enterprise entity to this account.',
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _bioController,
                        decoration: const InputDecoration(
                          labelText: 'Tell us about your service focus (optional)',
                          hintText: 'e.g. Critical facility maintenance, experiential events, emergency response',
                        ),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 24),
                      Text('Preview personas on mobile', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: UserRole.values
                            .map(
                              (role) => FilterChip(
                                label: Text(role.displayName),
                                selected: _selectedRoles.contains(role),
                                onSelected: (_) => _toggleRole(role),
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Switch between roles to explore tailored dashboards, bookings, rentals, and analytics just like on web.',
                        style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey.shade500),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _submit,
                          icon: const Icon(Icons.check_circle_outline),
                          label: const Text('Finish registration'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSignUpSummary(ThemeData theme) {
    final profile = widget.signUpData;
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Account owner', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: theme.colorScheme.primary.withOpacity(0.08),
                  foregroundColor: theme.colorScheme.primary,
                  child: Text(
                    profile.firstName.isNotEmpty ? profile.firstName[0].toUpperCase() : '?',
                    style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${profile.firstName} ${profile.lastName}', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Text(profile.email, style: GoogleFonts.ibmPlexMono(fontSize: 12, color: Colors.blueGrey.shade600)),
                      const SizedBox(height: 4),
                      Chip(
                        label: Text(
                          'Primary role: ${profile.role.displayName}',
                          style: GoogleFonts.inter(
                            color: theme.colorScheme.onSecondaryContainer,
                            fontSize: 12,
                          ),
                        ),
                        backgroundColor: theme.colorScheme.secondaryContainer,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label, {
    TextInputType? keyboardType,
    String? helperText,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(labelText: label, helperText: helperText),
      validator: (value) {
        if (label.contains('(optional)')) {
          return null;
        }
        if (value == null || value.trim().isEmpty) {
          final lower = label.toLowerCase();
          return 'Enter your $lower';
        }
        return null;
      },
    );
  }
}
