import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/technician_repository.dart';
import '../../data/models/meter_task.dart';
import '../../data/models/offline_reading.dart';

final assignedTasksProvider = StateNotifierProvider<AssignedTasksNotifier, AsyncValue<List<MeterTask>>>((ref) {
  final repo = ref.watch(technicianRepositoryProvider);
  return AssignedTasksNotifier(repo);
});

class AssignedTasksNotifier extends StateNotifier<AsyncValue<List<MeterTask>>> {
  final TechnicianRepository _repo;

  AssignedTasksNotifier(this._repo) : super(const AsyncValue.loading()) {
    loadTasks();
  }

  Future<void> loadTasks() async {
    state = const AsyncValue.loading();
    try {
      final tasks = await _repo.getAssignedTasks();
      state = AsyncValue.data(tasks);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }
}

// Controller for syncing offline queue
class SyncState {
  final bool isSyncing;
  final String? message;
  final int syncedCount;
  final int failedCount;

  SyncState({
    this.isSyncing = false,
    this.message,
    this.syncedCount = 0,
    this.failedCount = 0,
  });
}

class SyncNotifier extends StateNotifier<SyncState> {
  final TechnicianRepository _repo;
  final Ref _ref;

  SyncNotifier(this._repo, this._ref) : super(SyncState());

  Future<void> sync() async {
    state = SyncState(isSyncing: true);
    final result = await _repo.syncOfflineReadings();
    
    // Reload tasks to get updated previous readings regardless
    _ref.read(assignedTasksProvider.notifier).loadTasks();

    if (result['success'] == true) {
      state = SyncState(
        isSyncing: false,
        message: 'تمت مزامنة ${result['syncedCount']} قراءات بنجاح!',
        syncedCount: result['syncedCount'] ?? 0,
      );
    } else {
      state = SyncState(
        isSyncing: false,
        message: result['error'] ?? 'حدث خطأ أثناء المزامنة: فشل إرسال بعض القراءات',
        syncedCount: result['syncedCount'] ?? 0,
        failedCount: result['failedCount'] ?? 0,
      );
    }
  }
}

final syncProvider = StateNotifierProvider<SyncNotifier, SyncState>((ref) {
  final repo = ref.watch(technicianRepositoryProvider);
  return SyncNotifier(repo, ref);
});

// Loading state for submitting a single reading
final readingSubmissionProvider = StateProvider<bool>((ref) => false);

// Provider for technician reading history
final readingsHistoryProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(technicianRepositoryProvider);
  return repo.getReadingsHistory();
});

// Provider for offline readings queue
final offlineReadingsProvider = FutureProvider.autoDispose<List<OfflineReading>>((ref) async {
  final repo = ref.watch(technicianRepositoryProvider);
  return repo.getPendingReadings();
});
