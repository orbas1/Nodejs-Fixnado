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
    this.requestTypeFilter,
    this.regionFilter,
    this.subjectQuery,
    this.submittedAfter,
    this.submittedBefore,
    this.metrics,
    this.metricsLoading = false,
    this.metricsError,
  });

  final List<DataSubjectRequest> requests;
  final bool loading;
  final String? error;
  final String? statusFilter;
  final List<WarehouseExportRun> warehouseRuns;
  final bool warehouseLoading;
  final String? warehouseError;
  final String? warehouseDatasetFilter;
  final String? requestTypeFilter;
  final String? regionFilter;
  final String? subjectQuery;
  final String? submittedAfter;
  final String? submittedBefore;
  final Map<String, dynamic>? metrics;
  final bool metricsLoading;
  final String? metricsError;

  DataRequestsState copyWith({
    List<DataSubjectRequest>? requests,
    bool? loading,
    String? error,
    String? statusFilter,
    List<WarehouseExportRun>? warehouseRuns,
    bool? warehouseLoading,
    String? warehouseError,
    String? warehouseDatasetFilter,
    String? requestTypeFilter,
    String? regionFilter,
    String? subjectQuery,
    String? submittedAfter,
    String? submittedBefore,
    Map<String, dynamic>? metrics,
    bool? metricsLoading,
    String? metricsError,
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
      requestTypeFilter: requestTypeFilter ?? this.requestTypeFilter,
      regionFilter: regionFilter ?? this.regionFilter,
      subjectQuery: subjectQuery ?? this.subjectQuery,
      submittedAfter: submittedAfter ?? this.submittedAfter,
      submittedBefore: submittedBefore ?? this.submittedBefore,
      metrics: metrics ?? this.metrics,
      metricsLoading: metricsLoading ?? this.metricsLoading,
      metricsError: metricsError ?? this.metricsError,
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
        requestTypeFilter,
        regionFilter,
        subjectQuery,
        submittedAfter,
        submittedBefore,
        metrics,
        metricsLoading,
        metricsError,
      ];
}

class DataRequestsController extends StateNotifier<DataRequestsState> {
  DataRequestsController(this._repository)
      : super(const DataRequestsState(requests: [], warehouseRuns: []));

  final DataGovernanceRepository _repository;

  Future<void> load({
    String? status,
    String? requestType,
    String? regionCode,
    String? subjectEmail,
    String? submittedAfter,
    String? submittedBefore,
  }) async {
    final effectiveStatus = status ?? state.statusFilter;
    final effectiveType = requestType ?? state.requestTypeFilter;
    final effectiveRegion = regionCode ?? state.regionFilter;
    final effectiveSubject = subjectEmail ?? state.subjectQuery;
    final effectiveSubmittedAfter = submittedAfter ?? state.submittedAfter;
    final effectiveSubmittedBefore = submittedBefore ?? state.submittedBefore;

    state = state.copyWith(
      loading: true,
      error: null,
      statusFilter: effectiveStatus,
      requestTypeFilter: effectiveType,
      regionFilter: effectiveRegion,
      subjectQuery: effectiveSubject,
      submittedAfter: effectiveSubmittedAfter,
      submittedBefore: effectiveSubmittedBefore,
      metricsLoading: true,
      metricsError: null,
    );

    try {
      final requests = await _repository.fetchRequests(
        status: effectiveStatus,
        requestType: effectiveType,
        regionCode: effectiveRegion,
        subjectEmail: effectiveSubject,
        submittedAfter: effectiveSubmittedAfter,
        submittedBefore: effectiveSubmittedBefore,
      );
      state = state.copyWith(requests: requests, loading: false);
    } catch (error) {
      state = state.copyWith(error: error.toString(), loading: false);
    }

    try {
      final metrics = await _repository.fetchMetrics(
        status: effectiveStatus,
        requestType: effectiveType,
        regionCode: effectiveRegion,
        subjectEmail: effectiveSubject,
        submittedAfter: effectiveSubmittedAfter,
        submittedBefore: effectiveSubmittedBefore,
      );
      state = state.copyWith(metrics: metrics, metricsLoading: false);
    } catch (error) {
      state = state.copyWith(metricsLoading: false, metricsError: error.toString());
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
      await _repository.createRequest(
        subjectEmail: email,
        requestType: type,
        justification: justification,
        regionCode: regionCode,
      );
      await load();
    } catch (error) {
      state = state.copyWith(error: error.toString());
      rethrow;
    }
  }

  Future<void> updateStatus(String requestId, {required String status, String? note}) async {
    try {
      await _repository.updateStatus(requestId, status: status, note: note);
      await load();
    } catch (error) {
      state = state.copyWith(error: error.toString());
      rethrow;
    }
  }

  Future<void> generateExport(String requestId) async {
    try {
      await _repository.generateExport(requestId);
      await load();
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
