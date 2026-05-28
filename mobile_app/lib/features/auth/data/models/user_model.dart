class UserModel {
  final String userId;
  final String username;
  final String? email;
  final String? phoneNumber;
  final String role;
  final String? zoneId;
  final String status;

  UserModel({
    required this.userId,
    required this.username,
    this.email,
    this.phoneNumber,
    required this.role,
    this.zoneId,
    required this.status,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userId: json['user_id'] ?? json['userId'] ?? '',
      username: json['username'] ?? '',
      email: json['email'],
      phoneNumber: json['phone_number'] ?? json['phoneNumber'],
      role: json['role'] ?? '',
      zoneId: json['zone_id'] ?? json['zoneId'],
      status: json['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'username': username,
      'email': email,
      'phone_number': phoneNumber,
      'role': role,
      'zone_id': zoneId,
      'status': status,
    };
  }
}
