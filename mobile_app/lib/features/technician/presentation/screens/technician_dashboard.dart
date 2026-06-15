import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../controllers/technician_controller.dart';
import '../../data/models/meter_task.dart';

class TechnicianDashboard extends ConsumerStatefulWidget {
  const TechnicianDashboard({super.key});

  @override
  ConsumerState<TechnicianDashboard> createState() => _TechnicianDashboardState();
}

class _TechnicianDashboardState extends ConsumerState<TechnicianDashboard> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final tasksAsync = ref.watch(assignedTasksProvider);
    final syncState = ref.watch(syncProvider);
    final offlineAsync = ref.watch(offlineReadingsProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(
          AppStrings.appName,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline_rounded, color: Colors.white),
            onPressed: () => context.push('/technician/profile'),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppTheme.dangerColor),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.read(assignedTasksProvider.notifier).loadTasks();
            ref.read(syncProvider.notifier).sync();
            ref.invalidate(offlineReadingsProvider);
          },
          color: AppTheme.primaryColor,
          backgroundColor: AppTheme.darkCardBg,
          child: CustomScrollView(
            slivers: [
              // Welcome Banner (Banking Premium Aesthetic Card)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F3A57), Color(0xFF082032)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.2)),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withValues(alpha: 0.05),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        )
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              AppStrings.welcomeBack,
                              style: const TextStyle(
                                color: AppTheme.darkTextSecondary,
                                fontSize: 14,
                                fontFamily: 'Cairo',
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              authState.user?.username ?? 'فني الميدان',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Cairo',
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text(
                                AppStrings.roleTechnician,
                                style: TextStyle(
                                  color: AppTheme.primaryColor,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'Cairo',
                                ),
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.engineering_rounded,
                            color: AppTheme.primaryColor,
                            size: 40,
                          ),
                        ),
                      ],
                    ),
                  ),
                ).animate().fade(duration: 500.ms).slideY(begin: 0.1),
              ),

              // Quick Actions Row
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Row(
                    children: [
                      // History Card
                      Expanded(
                        child: GestureDetector(
                          onTap: () => context.push('/technician/history'),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.darkCardBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                            ),
                            child: const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.history_rounded, color: AppTheme.primaryColor, size: 28),
                                SizedBox(height: 12),
                                Text(
                                  'أرشيف القراءات',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'عرض سجل القراءات المرفوعة',
                                  style: TextStyle(
                                    color: AppTheme.darkTextSecondary,
                                    fontSize: 10,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Offline Queue Card
                      Expanded(
                        child: GestureDetector(
                          onTap: () => context.push('/technician/offline'),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.darkCardBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Icon(Icons.cloud_off_rounded, color: AppTheme.warningColor, size: 28),
                                    offlineAsync.when(
                                      data: (readings) => readings.isNotEmpty
                                          ? Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: AppTheme.warningColor.withValues(alpha: 0.2),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Text(
                                                '${readings.length}',
                                                style: const TextStyle(
                                                  color: AppTheme.warningColor,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            )
                                          : const SizedBox.shrink(),
                                      error: (_, __) => const SizedBox.shrink(),
                                      loading: () => const SizedBox.shrink(),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'قائمة الانتظار',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'قراءات معلقة محلياً',
                                  style: TextStyle(
                                    color: AppTheme.darkTextSecondary,
                                    fontSize: 10,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Sync Queue Banner (If applicable)
              SliverToBoxAdapter(
                child: Consumer(
                  builder: (context, ref, child) {
                    // Check if there's any sync feedback message
                    if (syncState.message != null) {
                      Future.microtask(() {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(syncState.message!, style: const TextStyle(fontFamily: 'Cairo'), textAlign: TextAlign.center),
                            backgroundColor: syncState.failedCount > 0 ? AppTheme.warningColor : AppTheme.successColor,
                          ),
                        );
                        // Reset sync message to avoid duplicate toast
                        syncState.message == null;
                      });
                    }

                    return const SizedBox.shrink();
                  },
                ),
              ),

              // Search Bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val.trim();
                      });
                    },
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: AppStrings.searchMeters,
                      hintStyle: const TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
                      prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.primaryColor),
                      filled: true,
                      fillColor: AppTheme.darkCardBg,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ),

              // List Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppStrings.assignedMetersTitle,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      TextButton.icon(
                        icon: syncState.isSyncing
                            ? const SizedBox(
                                height: 12,
                                width: 12,
                                child: CircularProgressIndicator(color: AppTheme.primaryColor, strokeWidth: 1.5),
                              )
                            : const Icon(Icons.sync_rounded, size: 16, color: AppTheme.primaryColor),
                        label: Text(
                          syncState.isSyncing ? 'جاري المزامنة...' : 'مزامنة القراءات المعلقة',
                          style: const TextStyle(fontFamily: 'Cairo', color: AppTheme.primaryColor),
                        ),
                        onPressed: syncState.isSyncing
                            ? null
                            : () => ref.read(syncProvider.notifier).sync(),
                      ),
                    ],
                  ),
                ),
              ),

              // Meter Tasks List
              tasksAsync.when(
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
                ),
                error: (err, stack) => SliverFillRemaining(
                  child: Center(
                    child: Text(
                      'خطأ أثناء تحميل البيانات: $err',
                      style: const TextStyle(color: AppTheme.dangerColor, fontFamily: 'Cairo'),
                    ),
                  ),
                ),
                data: (tasks) {
                  final filteredTasks = tasks.where((task) {
                    return task.customerName.contains(_searchQuery) ||
                        task.meterNumber.contains(_searchQuery);
                  }).toList();

                  if (filteredTasks.isEmpty) {
                    return const SliverFillRemaining(
                      child: Center(
                        child: Text(
                          AppStrings.noTasks,
                          style: TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
                        ),
                      ),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final task = filteredTasks[index];
                          return _buildTaskCard(context, task, index);
                        },
                        childCount: filteredTasks.length,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTaskCard(BuildContext context, MeterTask task, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkCardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  task.customerName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  task.zoneName,
                  style: const TextStyle(
                    color: AppTheme.primaryColor,
                    fontSize: 11,
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.bolt, size: 14, color: AppTheme.accentColor),
              const SizedBox(width: 4),
              Text(
                '${AppStrings.activeMeter} ${task.meterNumber}',
                style: const TextStyle(
                  color: AppTheme.darkTextSecondary,
                  fontSize: 12,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.darkTextSecondary),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  task.address,
                  style: const TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 12,
                    fontFamily: 'Cairo',
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const Divider(color: Colors.white10, height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    AppStrings.lastReading,
                    style: TextStyle(
                      color: AppTheme.darkTextSecondary,
                      fontSize: 11,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  Text(
                    '${task.lastReadingValue} ${AppStrings.kwhSuffix}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: () {
                  final encodedName = Uri.encodeComponent(task.customerName);
                  context.push('/technician/reading/${task.meterId}/$encodedName');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.add_a_photo_rounded, size: 16),
                label: const Text(
                  AppStrings.enterNewReading,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          )
        ],
      ),
    ).animate(delay: (index * 50).ms).fade(duration: 300.ms).slideY(begin: 0.05);
  }
}
