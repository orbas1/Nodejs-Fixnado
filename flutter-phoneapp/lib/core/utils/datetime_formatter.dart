import 'package:intl/intl.dart';

class DateTimeFormatter {
  static String relative(DateTime value, {DateTime? now}) {
    final reference = now ?? DateTime.now();
    final difference = value.difference(reference);

    if (difference.inMinutes.abs() < 1) {
      return 'just now';
    }
    if (difference.isNegative) {
      final minutes = difference.inMinutes.abs();
      if (minutes < 60) {
        return '$minutes min ago';
      }
      final hours = difference.inHours.abs();
      if (hours < 24) {
        return '$hours h ago';
      }
      final days = difference.inDays.abs();
      return '$days d ago';
    } else {
      final minutes = difference.inMinutes;
      if (minutes < 60) {
        return 'in $minutes min';
      }
      final hours = difference.inHours;
      if (hours < 24) {
        return 'in $hours h';
      }
      final days = difference.inDays;
      return 'in $days d';
    }
  }

  static String full(DateTime value) {
    final formatter = DateFormat.yMMMd().add_Hm();
    return formatter.format(value.toLocal());
  }
}
