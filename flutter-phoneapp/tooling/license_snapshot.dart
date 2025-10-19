import 'dart:convert';
import 'dart:io';

import 'package:dart_pubspec_licenses/dart_pubspec_licenses.dart' as oss;
import 'package:path/path.dart' as p;

String _canonicalise(String value) {
  final cleaned = value
      .trim()
      .replaceAll(RegExp(r'license', caseSensitive: false), '')
      .replaceAll(RegExp(r'[^A-Za-z0-9\.\-\+]'), '-')
      .replaceAll(RegExp('-+'), '-')
      .toUpperCase();
  const aliases = {
    'APACHE-2-0': 'Apache-2.0',
    'APACHE-2.0': 'Apache-2.0',
    'BSD-2-CLAUSE': 'BSD-2-Clause',
    'BSD-3-CLAUSE': 'BSD-3-Clause',
    'BSD-3-CLAUSE-NEW': 'BSD-3-Clause',
    'BSD-3-CLAUSE-"NEW"': 'BSD-3-Clause',
    'GPL-2-0': 'GPL-2.0',
    'GPL-3-0': 'GPL-3.0',
    'LGPL-2-1': 'LGPL-2.1',
    'LGPL-3-0': 'LGPL-3.0',
    'MPL-2-0': 'MPL-2.0',
    'MPL-2-0-OR-LATER': 'MPL-2.0',
    'UNLICENSE': 'Unlicense',
    'CC0-1-0': 'CC0-1.0',
    'ZLIB': 'Zlib',
    'MIT': 'MIT',
    'ISC': 'ISC',
    'UNKNOWN': 'UNKNOWN',
  };
  return aliases[cleaned] ?? cleaned;
}

String? _detectLicense(oss.Package pkg) {
  final yaml = pkg.packageYaml;
  if (yaml is Map && yaml['license'] is String && (yaml['license'] as String).trim().isNotEmpty) {
    return _canonicalise((yaml['license'] as String).trim());
  }

  final text = pkg.license?.toLowerCase() ?? '';
  if (text.contains('mit license')) {
    return 'MIT';
  }
  if (text.contains('apache license') && text.contains('version 2.0')) {
    return 'Apache-2.0';
  }
  if (text.contains('bsd license') && text.contains('3-clause')) {
    return 'BSD-3-Clause';
  }
  if (text.contains('bsd license') && text.contains('2-clause')) {
    return 'BSD-2-Clause';
  }
  if (text.contains('mozilla public license') && text.contains('2.0')) {
    return 'MPL-2.0';
  }
  if (text.contains('gnu lesser general public license') && text.contains('version 2.1')) {
    return 'LGPL-2.1';
  }
  if (text.contains('gnu lesser general public license') && text.contains('version 3')) {
    return 'LGPL-3.0';
  }
  if (text.contains('affero general public license')) {
    return 'AGPL-3.0';
  }
  if (text.contains('gnu general public license') && text.contains('version 3')) {
    return 'GPL-3.0';
  }
  if (text.contains('gnu general public license') && text.contains('version 2')) {
    return 'GPL-2.0';
  }
  if (text.contains('the unlicense')) {
    return 'Unlicense';
  }
  if (text.contains('creative commons zero') || text.contains('cc0')) {
    return 'CC0-1.0';
  }
  if (text.contains('zlib license')) {
    return 'Zlib';
  }
  if (text.contains('isc license')) {
    return 'ISC';
  }
  return null;
}

Future<void> main(List<String> args) async {
  final root = Directory.current.path;
  final outputPath = args.isNotEmpty ? args.first : p.join(root, 'build', 'license_audit.json');
  final lockPath = p.join(root, 'pubspec.lock');
  final dependencies = await oss.listDependencies(pubspecLockPath: lockPath);

  final direct = dependencies.dependencies.map((pkg) => pkg.name).toSet();
  final dev = dependencies.devDependencies.map((pkg) => pkg.name).toSet();

  final packages = <Map<String, dynamic>>[];
  for (final pkg in dependencies.allDependencies) {
    if (pkg.isSdk) {
      continue;
    }
    final detected = _detectLicense(pkg) ?? 'UNKNOWN';
    final info = {
      'name': pkg.name,
      'version': pkg.version,
      'license': detected,
      'declared': pkg.packageYaml is Map ? (pkg.packageYaml as Map)['license'] : null,
      'source': pkg.repository ?? pkg.homepage,
      'type': direct.contains(pkg.name)
          ? 'direct'
          : (dev.contains(pkg.name) ? 'dev' : 'transitive'),
    };
    packages.add(info);
  }

  final payload = {
    'generatedAt': DateTime.now().toUtc().toIso8601String(),
    'packages': packages,
  };

  final file = File(outputPath);
  file.createSync(recursive: true);
  file.writeAsStringSync(const JsonEncoder.withIndent('  ').convert(payload));
  stdout.writeln('Generated Flutter license snapshot with ${packages.length} packages at $outputPath');
}
