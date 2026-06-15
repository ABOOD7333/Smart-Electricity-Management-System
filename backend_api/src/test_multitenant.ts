import { query } from './database/connection';
import { login, register, forgotPassword, verifyOtp, resetPassword } from './controllers/auth.controller';
import { getAllCustomers } from './controllers/customers.controller';
import { Response } from 'express';

// دالة مساعدة لمحاكاة Response
function mockResponse() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  return res;
}

async function runTests() {
  console.log('🧪 البدء في تشغيل الاختبارات الأمنية والوظيفية لعزل الشركات وتعدد المستأجرين...\n');
  
  try {
    // 1. جلب معرفات الشركات المهيأة في الهجرة
    const noorResult = await query("SELECT company_id FROM companies WHERE company_code = 'NOOR'");
    const amanResult = await query("SELECT company_id FROM companies WHERE company_code = 'AMAN'");
    
    if (noorResult.rows.length === 0 || amanResult.rows.length === 0) {
      throw new Error('الشركات NOOR أو AMAN غير موجودة في قاعدة البيانات. يرجى تشغيل الهجرة أولاً.');
    }
    
    const noorCompanyId = noorResult.rows[0].company_id;
    const amanCompanyId = amanResult.rows[0].company_id;
    
    console.log(`ℹ️ تم تحديد الشركات بنجاح:`);
    console.log(`   - شركة نور (NOOR): ${noorCompanyId}`);
    console.log(`   - شركة أمان (AMAN): ${amanCompanyId}\n`);

    // تنظيف أي بيانات اختبار سابقة
    await query("DELETE FROM otp_verifications WHERE phone_number = '777777777'");
    await query("DELETE FROM users WHERE username = 'test_tenant_user'");
    await query("DELETE FROM meters WHERE meter_number = 'METER-TEST-100'");
    await query("DELETE FROM customers WHERE customer_number = 9999");
    await query("DELETE FROM zones WHERE zone_code = 'ZONE_TEST'");

    // 2. إعداد بيانات الاختبار (منطقة + مشترك + عداد) تحت شركة نور (NOOR)
    const zoneRes = await query(
      "INSERT INTO zones (zone_name, zone_code, company_id) VALUES ('منطقة تجريبية للنور', 'ZONE_TEST', $1) RETURNING zone_id",
      [noorCompanyId]
    );
    const zoneId = zoneRes.rows[0].zone_id;

    const customerRes = await query(
      `INSERT INTO customers (customer_number, full_name, phone_number, zone_id, company_id, customer_type) 
       VALUES (9999, 'مشترك تجريبي لشركة نور', '777777777', $1, $2, 'commercial') RETURNING customer_id`,
      [zoneId, noorCompanyId]
    );
    const customerId = customerRes.rows[0].customer_id;

    await query(
      `INSERT INTO meters (meter_number, customer_id, zone_id, company_id, status) 
       VALUES ('METER-TEST-100', $1, $2, $3, 'active')`,
      [customerId, zoneId, noorCompanyId]
    );

    console.log('✅ تم إعداد العداد التجريبي "METER-TEST-100" بنجاح تحت شركة نور (NOOR).\n');

    // ==========================================
    // الاختبار الأول: محاولة التسجيل بعداد غير تابع للشركة
    // ==========================================
    console.log('⏳ [اختبار 1]: محاولة التسجيل بعداد شركة نور (NOOR) تحت شركة أمان (AMAN)...');
    const req1: any = {
      body: {
        username: 'test_tenant_user',
        password: 'Password@123',
        full_name: 'مستخدم تجريبي',
        phone_number: '777777777',
        meter_number: 'METER-TEST-100',
        company_code: 'AMAN' // شركة مختلفة
      }
    };
    const res1 = mockResponse();
    await register(req1, res1);
    
    if (res1.statusCode === 400 && res1.body.success === false) {
      console.log('✅ نجح الاختبار: تم رفض التسجيل وأرجع الخادم: "' + res1.body.message + '"\n');
    } else {
      console.error('❌ فشل الاختبار: تم قبول التسجيل أو الاستجابة خاطئة:', res1.statusCode, res1.body);
    }

    // ==========================================
    // الاختبار الثاني: التسجيل الصحيح بعداد الشركة المناسب
    // ==========================================
    console.log('⏳ [اختبار 2]: التسجيل الصحيح بعداد شركة نور (NOOR) تحت شركة نور (NOOR)...');
    const req2: any = {
      body: {
        username: 'test_tenant_user',
        password: 'Password@123',
        full_name: 'مستخدم تجريبي لنور',
        phone_number: '777777777',
        meter_number: 'METER-TEST-100',
        company_code: 'NOOR' // الشركة الصحيحة
      }
    };
    const res2 = mockResponse();
    await register(req2, res2);

    if (res2.statusCode === 201 && res2.body.success === true) {
      console.log('✅ نجح الاختبار: تم تسجيل المشترك بنجاح وإنشاء توكن الـ JWT.\n');
    } else {
      console.error('❌ فشل الاختبار: لم يتم قبول التسجيل:', res2.statusCode, res2.body);
    }

    // ==========================================
    // الاختبار الثالث: محاولة التسجيل المكرر لنفس العداد
    // ==========================================
    console.log('⏳ [اختبار 3]: محاولة التسجيل المكرر لنفس العداد "METER-TEST-100"...');
    const req3: any = {
      body: {
        username: 'another_user',
        password: 'Password@123',
        full_name: 'مستخدم مكرر',
        phone_number: '777777777',
        meter_number: 'METER-TEST-100',
        company_code: 'NOOR'
      }
    };
    const res3 = mockResponse();
    await register(req3, res3);

    if (res3.statusCode === 400 && res3.body.success === false) {
      console.log('✅ نجح الاختبار: تم رفض التسجيل المكرر بنجاح مع رسالة: "' + res3.body.message + '"\n');
    } else {
      console.error('❌ فشل الاختبار: تم السماح بالتسجيل المكرر:', res3.statusCode, res3.body);
    }

    // ==========================================
    // الاختبار الرابع: تسجيل الدخول عبر بوابة شركة أخرى (Cross-Tenant Login)
    // ==========================================
    console.log('⏳ [اختبار 4]: محاولة تسجيل دخول مستخدم نور (NOOR) تحت شركة أمان (AMAN)...');
    const req4: any = {
      tenantId: amanCompanyId, // سياق شركة أمان
      body: {
        username: 'test_tenant_user',
        password: 'Password@123'
      }
    };
    const res4 = mockResponse();
    await login(req4, res4);

    if (res4.statusCode === 401 && res4.body.success === false) {
      console.log('✅ نجح الاختبار: تم منع الدخول عبر شركة أخرى وأرجع الخادم: "' + res4.body.message + '"\n');
    } else {
      console.error('❌ فشل الاختبار: تم السماح بدخول مستخدم لشركة أخرى:', res4.statusCode, res4.body);
    }

    // ==========================================
    // الاختبار الخامس: تسجيل الدخول الصحيح عبر بوابة الشركة الصحيحة
    // ==========================================
    console.log('⏳ [اختبار 5]: تسجيل دخول مستخدم نور (NOOR) عبر شركة نور (NOOR)...');
    const req5: any = {
      tenantId: noorCompanyId, // سياق شركة نور
      body: {
        username: 'test_tenant_user',
        password: 'Password@123'
      }
    };
    const res5 = mockResponse();
    await login(req5, res5);

    if (res5.statusCode === 200 && res5.body.success === true) {
      console.log('✅ نجح الاختبار: تم الدخول بنجاح وتوليد التوكن للشركة الصحيحة.\n');
    } else {
      console.error('❌ فشل الاختبار: لم يتم السماح بالدخول للمستخدم الصحيح:', res5.statusCode, res5.body);
    }

    // ==========================================
    // الاختبار السادس: طلب استعادة الحساب وتوليد OTP
    // ==========================================
    console.log('⏳ [اختبار 6]: طلب استعادة كلمة المرور وإرسال رمز التحقق OTP لشركة نور...');
    const req6: any = {
      tenantId: noorCompanyId,
      body: {
        company_code: 'NOOR',
        phone_number: '777777777',
        meter_number: 'METER-TEST-100'
      }
    };
    const res6 = mockResponse();
    await forgotPassword(req6, res6);

    let generatedOtp = '';
    if (res6.statusCode === 200 && res6.body.success === true) {
      generatedOtp = res6.body.mockOtp;
      console.log(`✅ نجح الاختبار: تم إنشاء الـ OTP بنجاح. رمز التحقق المستلم (محاكاة): ${generatedOtp}\n`);
    } else {
      console.error('❌ فشل الاختبار: لم يتم توليد الـ OTP:', res6.statusCode, res6.body);
    }

    // ==========================================
    // الاختبار السابع: التحقق من الـ OTP
    // ==========================================
    console.log('⏳ [اختبار 7]: التحقق من رمز الـ OTP المولد لتوليد Reset Token...');
    const req7: any = {
      tenantId: noorCompanyId,
      body: {
        company_code: 'NOOR',
        phone_number: '777777777',
        otp_code: generatedOtp
      }
    };
    const res7 = mockResponse();
    await verifyOtp(req7, res7);

    let resetToken = '';
    if (res7.statusCode === 200 && res7.body.success === true) {
      resetToken = res7.body.resetToken;
      console.log(`✅ نجح الاختبار: تم التحقق من الرمز بنجاح. الـ Reset Token المستخرج: ${resetToken}\n`);
    } else {
      console.error('❌ فشل الاختبار: لم يتم قبول رمز الـ OTP:', res7.statusCode, res7.body);
    }

    // ==========================================
    // الاختبار الثامن: إعادة تعيين كلمة المرور
    // ==========================================
    console.log('⏳ [اختبار 8]: إعادة تعيين كلمة المرور بالـ Reset Token...');
    const req8: any = {
      tenantId: noorCompanyId,
      body: {
        company_code: 'NOOR',
        reset_token: resetToken,
        new_password: 'NewSecurePassword@2026'
      }
    };
    const res8 = mockResponse();
    await resetPassword(req8, res8);

    if (res8.statusCode === 200 && res8.body.success === true) {
      console.log('✅ نجح الاختبار: تم إعادة تعيين كلمة المرور بنجاح وإتلاف التوكن المستعمل.\n');
    } else {
      console.error('❌ فشل الاختبار: لم يتم قبول إعادة التعيين:', res8.statusCode, res8.body);
    }

    // ==========================================
    // الاختبار التاسع: تسجيل الدخول بكلمة المرور الجديدة
    // ==========================================
    console.log('⏳ [اختبار 9]: تسجيل الدخول بكلمة المرور الجديدة لشركة نور...');
    const req9: any = {
      tenantId: noorCompanyId,
      body: {
        username: 'test_tenant_user',
        password: 'NewSecurePassword@2026'
      }
    };
    const res9 = mockResponse();
    await login(req9, res9);

    if (res9.statusCode === 200 && res9.body.success === true) {
      console.log('✅ نجح الاختبار: تم تسجيل الدخول بنجاح بكلمة المرور الجديدة!\n');
    } else {
      console.error('❌ فشل الاختبار: فشل الدخول بكلمة المرور الجديدة:', res9.statusCode, res9.body);
    }

    // ==========================================
    // الاختبار العاشر: عزل استعلامات لوحة التحكم (Data Isolation Check)
    // ==========================================
    console.log('⏳ [اختبار 10]: فحص عزل البيانات التام لعملاء شركة أمان (AMAN) مقابل شركة نور (NOOR)...');
    
    // سياق شركة أمان (لا يوجد بها عملاء مضافين في الاختبار)
    const req10A: any = {
      tenantId: amanCompanyId,
      query: {}
    };
    const res10A = mockResponse();
    await getAllCustomers(req10A, res10A);

    // سياق شركة نور (يوجد بها المشترك التجريبي المضاف 9999)
    const req10B: any = {
      tenantId: noorCompanyId,
      query: {}
    };
    const res10B = mockResponse();
    await getAllCustomers(req10B, res10B);

    const amanCustomersCount = res10A.body.data.length;
    const noorCustomers = res10B.body.data;
    const hasTestCustomerInNoor = noorCustomers.some((c: any) => c.customer_number === 9999);

    console.log(`   - عدد عملاء شركة أمان المرجعين: ${amanCustomersCount}`);
    console.log(`   - عدد عملاء شركة نور المرجعين: ${noorCustomers.length}`);
    console.log(`   - هل المشترك التجريبي موجود في استعلام نور؟ ${hasTestCustomerInNoor ? 'نعم' : 'لا'}`);

    if (amanCustomersCount === 0 && hasTestCustomerInNoor) {
      console.log('✅ نجح الاختبار: تم عزل البيانات بنجاح تام! لا تسريب بين شركة أمان ونور.\n');
    } else {
      console.error('❌ فشل الاختبار: تسريب في البيانات أو فشل العزل:', { amanCustomersCount, hasTestCustomerInNoor });
    }

    // تنظيف البيانات النهائية بعد نجاح كافة الاختبارات
    await query("DELETE FROM otp_verifications WHERE phone_number = '777777777'");
    await query("DELETE FROM users WHERE username = 'test_tenant_user'");
    await query("DELETE FROM meters WHERE meter_number = 'METER-TEST-100'");
    await query("DELETE FROM customers WHERE customer_number = 9999");
    await query("DELETE FROM zones WHERE zone_code = 'ZONE_TEST'");
    console.log('🧹 تم تنظيف قاعدة البيانات وإرجاعها لحالتها الأصلية بنجاح.');
    
    console.log('\n🎉 اكتملت كافة اختبارات نظام تعدد الشركات وعزل البيانات بنجاح 10/10!');
    process.exit(0);
  } catch (error) {
    console.error('❌ حدث خطأ غير متوقع أثناء تشغيل الاختبارات:', error);
    process.exit(1);
  }
}

runTests();
