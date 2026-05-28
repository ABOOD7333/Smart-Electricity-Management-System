import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';

// Placeholder screen imports (will create these screen classes soon)
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/customer/presentation/screens/customer_dashboard.dart';
import '../../features/technician/presentation/screens/technician_dashboard.dart';
import '../../features/technician/presentation/screens/meter_reading_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const AuthSplashGate(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/customer',
        builder: (context, state) => const CustomerDashboard(),
      ),
      GoRoute(
        path: '/technician',
        builder: (context, state) => const TechnicianDashboard(),
      ),
      GoRoute(
        path: '/technician/reading/:meterId/:customerName',
        builder: (context, state) {
          final meterId = state.pathParameters['meterId']!;
          final customerName = Uri.decodeComponent(state.pathParameters['customerName']!);
          return MeterReadingScreen(
            meterId: meterId,
            customerName: customerName,
          );
        },
      ),
    ],
  );
});

// A splash gate to check user auth token and role and route accordingly
class AuthSplashGate extends ConsumerWidget {
  const AuthSplashGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // We will check auth state here. For now, let's delay and check the secure storage token.
    Future.microtask(() async {
      // Check auth logic
      final storage = ref.read(secureStorageProvider);
      final token = await storage.read(key: 'jwt_token');
      final role = await storage.read(key: 'user_role'); // customer or employee/technician

      if (token == null) {
        if (context.mounted) context.go('/login');
      } else {
        if (context.mounted) {
          if (role == 'customer') {
            context.go('/customer');
          } else {
            // Treat admin/technician/employee as technician workspace
            context.go('/technician');
          }
        }
      }
    });

    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
