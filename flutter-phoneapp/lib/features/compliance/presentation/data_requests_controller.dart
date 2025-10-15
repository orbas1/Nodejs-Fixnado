import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/data_governance_repository.dart';
import '../domain/data_subject_request.dart';

class DataRequestsState extends Equatable {
  const DataRequestsState({
    required this.requests,
    this.loading = false,
    this.error,
    this.statusFilter,
  });

  final List<DataSubjectRequest> requests;
  final bool loading;
  final String? error;
  final String? statusFilter;

  DataRequestsState copyWith({
    List<DataSubjectRequest>? requests,
    bool? loading,
    String? error,
    String? statusFilter,
  }) {
    return DataRequestsState(
      requests: requests ?? this.requests,
      loading: loading ?? this.loading,
      error: error,
      statusFilter: statusFilter ?? this.statusFilter,
    );
  }

  @override
  List<Object?> get props => [requests, loading, error, statusFilter];
}

class DataRequestsController extends StateNotifier<DataRequestsState> {
  DataRequestsController(this._repository) : super(const DataRequestsState(requests: []));

  final DataGovernanceRepository _repository;

  Future<void> load({String? status}) async {
    state = state.copyWith(loading: true, error: null, statusFilter: status);
    try {
      final requests = await _repository.fetchRequests(status: status);
      state = state.copyWith(requests: requests, loading: false);
    } catch (error) {
      state = state.copyWith(error: error.toString(), loading: false);
    }
  }

  Future<void> create({
    required String email,
    required String type,
    String? justification,
    String? regionCode,
  }) async {
    try {
      final created = await _repository.createRequest(
        subjectEmail: email,
        requestType: type,
        justification: justification,
        regionCode: regionCode,
      );
      state = state.copyWith(requests: [created, ...state.requests], error: null);
    } catch (error) {
      state = state.copyWith(error: error.toString());
      rethrow;
    }
  }

  Future<void> updateStatus(String requestId, String status) async {
    try {
      final updated = await _repository.updateStatus(requestId, status: status);
      state = state.copyWith(
        requests: state.requests
            .map((request) => request.id == requestId ? updated : request)
            .toList(),
        error: null,
      );
    } catch (error) {
      state = state.copyWith(error: error.toString());
      rethrow;
    }
  }

  Future<void> generateExport(String requestId) async {
    try {
      final updated = await _repository.generateExport(requestId);
      state = state.copyWith(
        requests: state.requests
            .map((request) => request.id == requestId ? updated : request)
            .toList(),
        error: null,
      );
    } catch (error) {
      state = state.copyWith(error: error.toString());
      rethrow;
    }
  }
}

final dataRequestsControllerProvider =
    StateNotifierProvider<DataRequestsController, DataRequestsState>((ref) {
  final repository = ref.watch(dataGovernanceRepositoryProvider);
  final controller = DataRequestsController(repository);
  controller.load();
  return controller;
});
