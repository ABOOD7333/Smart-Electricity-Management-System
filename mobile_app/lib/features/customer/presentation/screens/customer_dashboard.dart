import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart' as intl;
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../controllers/customer_controller.dart';

class CustomerDashboard extends ConsumerStatefulWidget {
  const CustomerDashboard({super.key});

  @override
  ConsumerState<CustomerDashboard> createState() => _CustomerDashboardState();
}

class _CustomerDashboardState extends ConsumerState<CustomerDashboard> {
  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final customerState = ref.watch(customerProvider);

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
            onPressed: () => context.go('/customer/profile'),
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
          onRefresh: () => ref.read(customerProvider.notifier).loadDashboard(),
          color: AppTheme.primaryColor,
          backgroundColor: AppTheme.darkCardBg,
          child: customerState.isLoading
              ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
              : SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Welcome Banner
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                AppStrings.welcomeBack,
                                style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 13, fontFamily: 'Cairo'),
                              ),
                              Text(
                                authState.user?.username ?? 'المشترك',
                                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              AppStrings.roleCustomer,
                              style: TextStyle(color: AppTheme.primaryColor, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                            ),
                          ),
                        ],
                      ).animate().fade(duration: 400.ms),

                      const SizedBox(height: 20),

                      // Premium Visa-like Customer Card
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF005C97), Color(0xFF363795)], // Premium deep blue gradient
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF363795).withValues(alpha: 0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            )
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'SEMS - بطاقة المشترك',
                                  style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600, fontFamily: 'Cairo'),
                                ),
                                const Icon(Icons.bolt, color: AppTheme.accentColor, size: 28),
                              ],
                            ),
                            const SizedBox(height: 28),
                            const Text(
                              AppStrings.currentBalance,
                              style: TextStyle(color: Colors.white70, fontSize: 12, fontFamily: 'Cairo'),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${customerState.currentBalance.toStringAsFixed(2)} ${AppStrings.riyalSuffix}',
                              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                            ),
                            const SizedBox(height: 28),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'رقم العداد',
                                      style: TextStyle(color: Colors.white70, fontSize: 10, fontFamily: 'Cairo'),
                                    ),
                                    Text(
                                      customerState.meterNumber,
                                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    '${customerState.unpaidBillsCount} فواتير معلقة',
                                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600, fontFamily: 'Cairo'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ).animate().fade(duration: 500.ms).scale(delay: 100.ms),

                      const SizedBox(height: 24),

                      // Quick Action Buttons
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => context.go('/customer/complaints'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.darkCardBg,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  side: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
                                ),
                              ),
                              icon: const Icon(Icons.campaign_rounded, color: AppTheme.accentColor, size: 20),
                              label: const Text(
                                'البلاغات والشكاوى',
                                style: TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () {
                                context.go('/customer/payment', extra: {
                                  'amount': customerState.currentBalance,
                                });
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                elevation: 4,
                                shadowColor: AppTheme.primaryColor.withValues(alpha: 0.3),
                              ),
                              icon: const Icon(Icons.payment_rounded, size: 20),
                              label: const Text(
                                AppStrings.payNow,
                                style: TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ],
                      ).animate().fade(delay: 200.ms).slideY(begin: 0.1),

                      const SizedBox(height: 28),

                      // Weekly Consumption Chart
                      Text(
                        AppStrings.consumptionTitle,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        height: 180,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.darkCardBg,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                        ),
                        child: LineChart(
                          LineChartData(
                            gridData: const FlGridData(show: false),
                            titlesData: FlTitlesData(
                              leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) {
                                    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                                    if (value.toInt() >= 0 && value.toInt() < days.length) {
                                      return Padding(
                                        padding: const EdgeInsets.only(top: 6.0),
                                        child: Text(
                                          days[value.toInt()],
                                          style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 9, fontFamily: 'Cairo'),
                                        ),
                                      );
                                    }
                                    return const SizedBox.shrink();
                                  },
                                ),
                              ),
                            ),
                            borderData: FlBorderData(show: false),
                            lineBarsData: [
                              LineChartBarData(
                                spots: customerState.weeklyConsumption.asMap().entries.map((entry) {
                                  return FlSpot(entry.key.toDouble(), entry.value);
                                }).toList(),
                                isCurved: true,
                                color: AppTheme.primaryColor,
                                barWidth: 3.5,
                                isStrokeCapRound: true,
                                dotData: const FlDotData(show: false),
                                belowBarData: BarAreaData(
                                  show: true,
                                  color: AppTheme.primaryColor.withValues(alpha: 0.15),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ).animate().fade(delay: 300.ms),

                      const SizedBox(height: 28),

                      // Recent Bills List Header
                      Text(
                        AppStrings.recentBills,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 12),

                      // Recent Bills List
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: customerState.recentBills.length,
                        itemBuilder: (context, index) {
                          final bill = customerState.recentBills[index];
                          final isPaid = bill['status'] == 'paid';
                          final dateStr = bill['created_at'] != null
                              ? intl.DateFormat('yyyy/MM/dd').format(DateTime.parse(bill['created_at']))
                              : 'غير محدد';

                          return InkWell(
                            onTap: () => context.go('/customer/bill/${bill['bill_id']}'),
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppTheme.darkCardBg,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${AppStrings.billNumber} ${bill['bill_number']}',
                                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${AppStrings.billDate} $dateStr',
                                        style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11, fontFamily: 'Cairo'),
                                      ),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '${bill['total_amount']} ${AppStrings.riyalSuffix}',
                                        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                                      ),
                                      const SizedBox(height: 4),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: isPaid ? AppTheme.successColor.withValues(alpha: 0.1) : AppTheme.dangerColor.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          isPaid ? AppStrings.billStatusPaid : AppStrings.billStatusUnpaid,
                                          style: TextStyle(
                                            color: isPaid ? AppTheme.successColor : AppTheme.dangerColor,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            fontFamily: 'Cairo',
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ).animate(delay: (index * 50).ms).fade(duration: 300.ms).slideY(begin: 0.05);
                        },
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}
