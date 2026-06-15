class AppStrings {
  // App Title
  static const String appName = 'نظام إدارة الكهرباء الذكي';

  // Login
  static const String loginTitle = 'مرحباً بك مجدداً';
  static const String loginSubtitle = 'سجل الدخول لإدارة استهلاكك أو مهامك اليومية';
  static const String usernameLabel = 'اسم المستخدم';
  static const String passwordLabel = 'كلمة المرور';
  static const String loginButton = 'تسجيل الدخول';
  static const String usernameRequired = 'اسم المستخدم مطلوب';
  static const String passwordRequired = 'كلمة المرور مطلوبة';
  static const String loginFailed = 'فشل تسجيل الدخول. يرجى التحقق من البيانات';

  // Role names in Arabic
  static const String roleTechnician = 'فني ميداني';
  static const String roleCustomer = 'مشترك';
  static const String roleAdmin = 'مدير النظام';

  // Customer Dashboard
  static const String welcomeBack = 'مرحباً بك،';
  static const String activeMeter = 'العداد النشط:';
  static const String currentBalance = 'الرصيد الحالي';
  static const String unpaidBills = 'الفواتير غير المدفوعة';
  static const String riyalSuffix = 'ر.ي';
  static const String kwhSuffix = 'ك.و.س';
  static const String payNow = 'ادفع الآن';
  static const String consumptionTitle = 'تحليلات الاستهلاك الأسبوعي';
  static const String recentBills = 'الفواتير الأخيرة';
  static const String billNumber = 'فاتورة رقم:';
  static const String billDate = 'تاريخ الفاتورة:';
  static const String billAmount = 'المبلغ الكلي:';
  static const String billStatusPaid = 'مدفوعة';
  static const String billStatusUnpaid = 'غير مدفوعة';
  
  // Complaints
  static const String complaintsTitle = 'تقديم بلاغ / شكوى';
  static const String complaintSubject = 'عنوان البلاغ';
  static const String complaintDescription = 'تفاصيل البلاغ أو الشكوى';
  static const String submitComplaint = 'إرسال البلاغ';
  static const String complaintSuccess = 'تم إرسال بلاغك بنجاح وسنقوم بمراجعته قريباً';

  // Technician Dashboard
  static const String assignedMetersTitle = 'المهام المعينة اليوم';
  static const String searchMeters = 'البحث باسم المشترك أو رقم العداد...';
  static const String meterDetails = 'تفاصيل العداد';
  static const String lastReading = 'آخر قراءة مسجلة:';
  static const String enterNewReading = 'إدخال قراءة جديدة';
  static const String locationRequired = 'الرجاء تشغيل الـ GPS لالتقاط موقع العداد';

  // Meter Reading Entry Screen
  static const String submitReadingTitle = 'تسجيل قراءة عداد';
  static const String currentReadingField = 'القراءة الحالية (ك.و.س)';
  static const String captureImage = 'التقاط صورة للعداد';
  static const String imageCaptured = 'تم التقاط الصورة بنجاح';
  static const String gpsCaptured = 'تم تحديد إحداثيات الموقع بنجاح';
  static const String readingSubmitButton = 'حفظ وإرسال القراءة';
  static const String readingSavedOffline = 'تم حفظ القراءة محلياً لعدم توفر شبكة. ستتم المزامنة تلقائياً';
  static const String readingSubmitSuccess = 'تم إرسال القراءة وحساب الفاتورة بنجاح!';
  static const String validationReadingLess = 'عذراً، القراءة الحالية لا يمكن أن تكون أقل من السابقة';

  // Buttons & Status
  static const String logout = 'تسجيل الخروج';
  static const String offlineMode = 'وضع العمل بدون إنترنت نشط';
  static const String onlineMode = 'تمت المزامنة والاتصال بالشبكة';
  static const String noTasks = 'لا توجد مهام معينة لك اليوم';
}
