import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/data_governance_repository.dart';
import '../domain/data_subject_request.dart';
import '../domain/warehouse_export_run.dart';

class DataRequestsState extends Equatable {
  const DataRequestsState({
    required this.requests,
    this.loading = false,
    this.error,
    this.statusFilter,
    required this.warehouseRuns,
    this.warehouseLoading = false,
    this.warehouseError,
    this.warehouseDatasetFilter,
  });

  final List<DataSubjectRequest> requests;
  final bool loading;
  final String? error;
  final String? statusFilter;
  final List<WarehouseExportRun> warehouseRuns;
  final bool warehouseLoading;
  final String? warehouseError;
  final String? warehouseDatasetFilter;

  DataRequestsState copyWith({
    List<DataSubjectRequest>? requests,
    bool? loading,
    String? error,
    String? statusFilter,
    List<WarehouseExportRun>? warehouseRuns,
    bool? warehouseLoading,
    String? warehouseError,
    String? warehouseDatasetFilter,
  }) {
    return DataRequestsState(
      requests: requests ?? this.requests,
      loading: loading ?? this.loading,
      error: error,
      statusFilter: statusFilter ?? this.statusFilter,
      warehouseRuns: warehouseRuns ?? this.warehouseRuns,
      warehouseLoading: warehouseLoading ?? this.warehouseLoading,
      warehouseError: warehouseError,
      warehouseDatasetFilter: warehouseDatasetFilter ?? this.warehouseDatasetFilter,
    );
  }

  @override
  List<Object?> get props => [
        requests,
        loading,
        error,
        statusFilter,
        warehouseRuns,
        warehouseLoading,
        warehouseError,
        warehouseDatasetFilter,
      ];
}

class DataRequestsController extends StateNotifier<DataRequestsState> {
  DataRequestsController(this._repository)
      : super(const DataRequestsState(requests: [], warehouseRuns: []));

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

  Future<void> loadWarehouse({String? dataset}) async {
    state = state.copyWith(
      warehouseLoading: true,
      warehouseError: null,
      warehouseDatasetFilter: dataset,
    );
    try {
      final runs = await _repository.fetchWarehouseExports(dataset: dataset);
      state = state.copyWith(warehouseRuns: runs, warehouseLoading: false);
    } catch (error) {
      state = state.copyWith(warehouseError: error.toString(), warehouseLoading: false);
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

  Future<void> triggerWarehouseExport(String dataset, {String? regionCode}) async {
    try {
      final run = await _repository.triggerWarehouseExport(dataset: dataset, regionCode: regionCode);
      state = state.copyWith(
        warehouseRuns: [run, ...state.warehouseRuns],
        warehouseError: null,
      );
    } catch (error) {
      state = state.copyWith(warehouseError: error.toString());
      rethrow;
    }
  }
}

final dataRequestsControllerProvider =
    StateNotifierProvider<DataRequestsController, DataRequestsState>((ref) {
  final repository = ref.watch(dataGovernanceRepositoryProvider);
  final controller = DataRequestsController(repository);
  controller.load();
  controller.loadWarehouse();
  return controller;
});
