import 'package:equatable/equatable.dart';

class LegalTermsDocument extends Equatable {
  const LegalTermsDocument({
    required this.title,
    required this.owner,
    required this.version,
    required this.effectiveDate,
    required this.lastUpdated,
    required this.jurisdiction,
    required this.contact,
    required this.sections,
    required this.acceptance,
  });

  factory LegalTermsDocument.fromJson(Map<String, dynamic> json) {
    return LegalTermsDocument(
      title: json['documentTitle']?.toString() ?? 'Fixnado Terms and Conditions',
      owner: json['owner']?.toString() ?? 'Blackwellen Ltd',
      version: json['version']?.toString() ?? '1.0.0',
      effectiveDate: json['effectiveDate']?.toString() ?? '2024-01-01',
      lastUpdated: json['lastUpdated']?.toString() ?? json['effectiveDate']?.toString() ?? '2024-01-01',
      jurisdiction: json['jurisdiction']?.toString() ?? 'England and Wales',
      contact: LegalTermsContact.fromJson(Map<String, dynamic>.from(json['contact'] as Map? ?? const {})),
      sections: (json['sections'] as List? ?? const [])
          .map((entry) => LegalTermsSection.fromJson(Map<String, dynamic>.from(entry as Map)))
          .toList(),
      acceptance: LegalTermsAcceptance.fromJson(Map<String, dynamic>.from(json['acceptance'] as Map? ?? const {})),
    );
  }

  final String title;
  final String owner;
  final String version;
  final String effectiveDate;
  final String lastUpdated;
  final String jurisdiction;
  final LegalTermsContact contact;
  final List<LegalTermsSection> sections;
  final LegalTermsAcceptance acceptance;

  @override
  List<Object?> get props => [
        title,
        owner,
        version,
        effectiveDate,
        lastUpdated,
        jurisdiction,
        contact,
        sections,
        acceptance,
      ];
}

class LegalTermsContact extends Equatable {
  const LegalTermsContact({
    required this.email,
    required this.telephone,
    required this.postal,
  });

  factory LegalTermsContact.fromJson(Map<String, dynamic> json) {
    return LegalTermsContact(
      email: json['email']?.toString() ?? 'legal@fixnado.co.uk',
      telephone: json['telephone']?.toString() ?? '+44 (0)20 7846 0170',
      postal: json['postal']?.toString() ?? 'Legal Department, Blackwellen Ltd, London, United Kingdom',
    );
  }

  final String email;
  final String telephone;
  final String postal;

  @override
  List<Object?> get props => [email, telephone, postal];
}

class LegalTermsSection extends Equatable {
  const LegalTermsSection({
    required this.id,
    required this.title,
    required this.summary,
    required this.clauses,
  });

  factory LegalTermsSection.fromJson(Map<String, dynamic> json) {
    return LegalTermsSection(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      summary: json['summary']?.toString() ?? '',
      clauses: (json['clauses'] as List? ?? const [])
          .map((entry) => LegalTermsClause.fromJson(Map<String, dynamic>.from(entry as Map)))
          .toList(),
    );
  }

  final String id;
  final String title;
  final String summary;
  final List<LegalTermsClause> clauses;

  @override
  List<Object?> get props => [id, title, summary, clauses];
}

class LegalTermsClause extends Equatable {
  const LegalTermsClause({
    required this.heading,
    required this.content,
    this.bullets,
  });

  factory LegalTermsClause.fromJson(Map<String, dynamic> json) {
    return LegalTermsClause(
      heading: json['heading']?.toString() ?? '',
      content: (json['content'] as List? ?? const []).map((entry) => entry.toString()).toList(),
      bullets: json['bullets'] == null
          ? null
          : LegalTermsClauseBullets.fromJson(Map<String, dynamic>.from(json['bullets'] as Map)),
    );
  }

  final String heading;
  final List<String> content;
  final LegalTermsClauseBullets? bullets;

  @override
  List<Object?> get props => [heading, content, bullets];
}

class LegalTermsClauseBullets extends Equatable {
  const LegalTermsClauseBullets({
    required this.style,
    required this.items,
  });

  factory LegalTermsClauseBullets.fromJson(Map<String, dynamic> json) {
    return LegalTermsClauseBullets(
      style: json['style']?.toString() ?? 'disc',
      items: (json['items'] as List? ?? const []).map((entry) => entry.toString()).toList(),
    );
  }

  final String style;
  final List<String> items;

  bool get isOrdered => style.toLowerCase() == 'decimal' || style.toLowerCase() == 'ordered';

  @override
  List<Object?> get props => [style, items];
}

class LegalTermsAcceptance extends Equatable {
  const LegalTermsAcceptance({
    required this.statement,
    required this.requiredActions,
  });

  factory LegalTermsAcceptance.fromJson(Map<String, dynamic> json) {
    return LegalTermsAcceptance(
      statement: json['statement']?.toString() ?? '',
      requiredActions: (json['requiredActions'] as List? ?? const []).map((entry) => entry.toString()).toList(),
    );
  }

  final String statement;
  final List<String> requiredActions;

  @override
  List<Object?> get props => [statement, requiredActions];
}
