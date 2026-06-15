class CompanyModel {
  final String companyId;
  final String companyName;
  final String companyCode;

  CompanyModel({
    required this.companyId,
    required this.companyName,
    required this.companyCode,
  });

  factory CompanyModel.fromJson(Map<String, dynamic> json) {
    return CompanyModel(
      companyId: json['company_id'] ?? '',
      companyName: json['company_name'] ?? '',
      companyCode: json['company_code'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'company_id': companyId,
      'company_name': companyName,
      'company_code': companyCode,
    };
  }
}
