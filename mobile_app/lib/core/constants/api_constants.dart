class ApiConstants {
  // Base URL (Uses 10.0.2.2 for Android Emulator to access localhost of host machine)
  // For web or physical device testing, update this to your local IP or backend URL
  static const String baseUrl = 'https://smart-electricity-management-system-production.up.railway.app/api';

  // Auth Endpoints
  static const String login = '/auth/login';
  static const String registerCustomer = '/auth/register-customer';
  static const String companies = '/auth/companies';

  // Customer Endpoints
  static const String customerDashboard = '/customers/dashboard';
  static const String customerBills = '/bills';
  static const String makePayment = '/payments';
  static const String customerComplaints = '/complaints';

  // Technician Endpoints
  static const String assignedMeters = '/meters/assigned';
  static const String submitReading = '/readings';

  // Sync Endpoints
  static const String offlineSync = '/sync';
}
