import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/exceptions/api_exception.dart';
import '../data/geo_matching_repository.dart';
import '../domain/models.dart';

class GeoMatchingState {
  GeoMatchingState({
    this.latitude = '51.509',
    this.longitude = '-0.118',
    this.radiusKm = '18',
    this.limit = '12',
    this.categories = '',
    Set<String>? demandLevels,
    this.isLoading = false,
    this.errorMessage,
    this.result,
    this.coverage,
  }) : demandLevels = demandLevels ?? {'high', 'medium', 'low'};

  final String latitude;
  final String longitude;
  final String radiusKm;
  final String limit;
  final String categories;
  final Set<String> demandLevels;
  final bool isLoading;
  final String? errorMessage;
  final GeoMatchResult? result;
  final Map<String, dynamic>? coverage;

  GeoMatchingState copyWith({
    String? latitude,
    String? longitude,
    String? radiusKm,
    String? limit,
    String? categories,
    Set<String>? demandLevels,
    bool? isLoading,
    String? errorMessage,
    GeoMatchResult? result,
    Map<String, dynamic>? coverage,
  }) {
    return GeoMatchingState(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      radiusKm: radiusKm ?? this.radiusKm,
      limit: limit ?? this.limit,
      categories: categories ?? this.categories,
      demandLevels: demandLevels ?? this.demandLevels,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      result: result,
      coverage: coverage,
    );
  }
}

class GeoMatchingController extends StateNotifier<GeoMatchingState> {
  GeoMatchingController(this._repository) : super(GeoMatchingState());

  final GeoMatchingRepository _repository;

  void updateLatitude(String value) {
    state = state.copyWith(latitude: value);
  }

  void updateLongitude(String value) {
    state = state.copyWith(longitude: value);
  }

  void updateRadius(String value) {
    state = state.copyWith(radiusKm: value);
  }

  void updateLimit(String value) {
    state = state.copyWith(limit: value);
  }

  void updateCategories(String value) {
    state = state.copyWith(categories: value);
  }

  void toggleDemand(String id) {
    final next = Set<String>.from(state.demandLevels);
    if (next.contains(id)) {
      next.remove(id);
    } else {
      next.add(id);
    }
    if (next.isEmpty) {
      next.add(id);
    }
    state = state.copyWith(demandLevels: next);
  }

  double? _toDouble(String value) {
    final parsed = double.tryParse(value);
    return parsed;
  }

  List<String> _parseCategories(String input) {
    if (input.trim().isEmpty) {
      return const [];
    }
    return input
        .split(',')
        .map((entry) => entry.trim())
        .where((entry) => entry.isNotEmpty)
        .toList();
  }

  Future<void> runMatch() async {
    final latitude = _toDouble(state.latitude);
    final longitude = _toDouble(state.longitude);
    if (latitude == null || longitude == null) {
      state = state.copyWith(errorMessage: 'Enter valid coordinates to run a match.');
      return;
    }

    final radius = _toDouble(state.radiusKm);
    final limit = int.tryParse(state.limit);

    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final request = GeoMatchRequest(
        latitude: latitude,
        longitude: longitude,
        radiusKm: radius,
        limit: limit,
        demandLevels: state.demandLevels.toList(),
        categories: _parseCategories(state.categories),
      );
      final result = await _repository.match(request);
      Map<String, dynamic>? coverage;
      try {
        coverage = await _repository.previewCoverage(request);
      } catch (_) {
        coverage = null;
      }
      state = state.copyWith(result: result, coverage: coverage, isLoading: false);
    } on ApiException catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: error.message ?? 'Unable to match services right now.',
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Unable to match services right now.',
      );
    }
  }
}

final geoMatchingControllerProvider =
    StateNotifierProvider<GeoMatchingController, GeoMatchingState>((ref) {
  final repository = ref.watch(geoMatchingRepositoryProvider);
  return GeoMatchingController(repository);
});
