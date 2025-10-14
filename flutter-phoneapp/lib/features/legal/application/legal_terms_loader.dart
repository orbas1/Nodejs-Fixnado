import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../domain/legal_terms_models.dart';

Future<LegalTermsDocument> loadLegalTermsDocument() async {
  final raw = await rootBundle.loadString('assets/legal/uk_terms.json');
  final decoded = json.decode(raw) as Map<String, dynamic>;
  return LegalTermsDocument.fromJson(decoded);
}
