import 'package:intl/intl.dart';

class CurrencyFormatter {
  static String format(dynamic amount, {String currency = 'USD'}) {
    final value = _toDouble(amount);
    final formatter = NumberFormat.simpleCurrency(name: currency);
    return formatter.format(value);
  }

  static double _toDouble(dynamic amount) {
    if (amount == null) {
      return 0;
    }
    if (amount is num) {
      return amount.toDouble();
    }
    if (amount is String) {
      return double.tryParse(amount) ?? 0;
    }
    return 0;
  }
}
