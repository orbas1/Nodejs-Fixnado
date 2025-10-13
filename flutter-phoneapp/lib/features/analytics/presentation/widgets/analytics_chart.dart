import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../domain/analytics_models.dart';

class AnalyticsChartCard extends StatelessWidget {
  const AnalyticsChartCard({super.key, required this.chart});

  final AnalyticsChart chart;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: theme.colorScheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(chart.title, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              chart.description,
              style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            SizedBox(height: 180, child: _ChartCanvas(chart: chart)),
          ],
        ),
      ),
    );
  }
}

class _ChartCanvas extends StatelessWidget {
  const _ChartCanvas({required this.chart});

  final AnalyticsChart chart;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _AnalyticsChartPainter(chart, Theme.of(context)),
      child: const SizedBox.expand(),
    );
  }
}

class _AnalyticsChartPainter extends CustomPainter {
  _AnalyticsChartPainter(this.chart, this.theme);

  final AnalyticsChart chart;
  final ThemeData theme;

  static const _seriesPalette = [
    Color(0xFF1445E0),
    Color(0xFF0EA5E9),
    Color(0xFF1BBF92),
    Color(0xFFF97316),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final series = chart.series.toList();
    if (series.isEmpty || series.first.points.isEmpty) {
      _paintEmptyState(canvas, size);
      return;
    }

    switch (chart.type) {
      case 'line':
        _paintLine(canvas, size, series.first);
        break;
      default:
        _paintBars(canvas, size, series);
        break;
    }
  }

  void _paintEmptyState(Canvas canvas, Size size) {
    final painter = TextPainter(
      text: TextSpan(
        text: 'No data available',
        style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant.withOpacity(0.7)),
      ),
      textDirection: TextDirection.ltr,
    )
      ..layout(maxWidth: size.width);
    painter.paint(canvas, Offset((size.width - painter.width) / 2, (size.height - painter.height) / 2));
  }

  void _paintBars(Canvas canvas, Size size, List<AnalyticsChartSeries> series) {
    final maxPoints = series.map((s) => s.points.length).reduce((a, b) => a > b ? a : b);
    final maxValue = series.map((s) => s.maxValue).reduce((a, b) => a > b ? a : b);
    if (maxPoints == 0 || maxValue <= 0) {
      _paintEmptyState(canvas, size);
      return;
    }

    final chartHeight = size.height - 32;
    final chartWidth = size.width - 32;
    final origin = Offset(16, size.height - 16);
    final seriesCount = series.length;
    final barGroupWidth = chartWidth / maxPoints;
    final barWidth = barGroupWidth / (seriesCount + 0.5);

    for (var seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
      final paint = Paint()
        ..color = _seriesPalette[seriesIndex % _seriesPalette.length]
        ..style = PaintingStyle.fill;

      for (var pointIndex = 0; pointIndex < series[seriesIndex].points.length; pointIndex++) {
        final point = series[seriesIndex].points[pointIndex];
        final ratio = point.value / maxValue;
        final height = ratio.isFinite ? ratio * chartHeight : 0;
        final left = origin.dx + pointIndex * barGroupWidth + seriesIndex * barWidth;
        final rect = Rect.fromLTWH(left, origin.dy - height, barWidth - 6, height);
        canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(6)), paint);
      }
    }

    _paintAxis(canvas, size, series.first.points.map((point) => point.label).toList());
  }

  void _paintLine(Canvas canvas, Size size, AnalyticsChartSeries series) {
    final maxValue = series.maxValue;
    if (maxValue <= 0 || series.points.isEmpty) {
      _paintEmptyState(canvas, size);
      return;
    }

    final chartHeight = size.height - 36;
    final chartWidth = size.width - 32;
    final origin = Offset(16, size.height - 20);
    final stepX = chartWidth / (series.points.length - 1).clamp(1, double.infinity);

    final path = Path();
    for (var index = 0; index < series.points.length; index++) {
      final point = series.points[index];
      final ratio = point.value / maxValue;
      final y = origin.dy - (ratio.isFinite ? ratio * chartHeight : 0);
      final x = origin.dx + stepX * index;
      if (index == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    final paint = Paint()
      ..color = _seriesPalette.first
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(path, paint);
    _paintAxis(canvas, size, series.points.map((point) => point.label).toList());
  }

  void _paintAxis(Canvas canvas, Size size, List<String> labels) {
    if (labels.isEmpty) {
      return;
    }
    final labelPainter = TextPainter(textDirection: TextDirection.ltr);
    final availableWidth = size.width - 32;
    final step = labels.length == 1 ? 0 : availableWidth / (labels.length - 1);

    for (var index = 0; index < labels.length; index++) {
      final label = labels[index];
      labelPainter.text = TextSpan(
        text: label,
        style: GoogleFonts.inter(fontSize: 10, color: theme.colorScheme.onSurfaceVariant.withOpacity(0.7)),
      );
      labelPainter.layout();
      final x = 16 + step * index - labelPainter.width / 2;
      final y = size.height - 14;
      labelPainter.paint(canvas, Offset(x.clamp(0, size.width - labelPainter.width), y));
    }

    final axisPaint = Paint()
      ..color = theme.colorScheme.outlineVariant
      ..strokeWidth = 1;
    canvas.drawLine(Offset(16, size.height - 18), Offset(size.width - 16, size.height - 18), axisPaint);
  }

  @override
  bool shouldRepaint(covariant _AnalyticsChartPainter oldDelegate) {
    return oldDelegate.chart != chart || oldDelegate.theme != theme;
  }
}
