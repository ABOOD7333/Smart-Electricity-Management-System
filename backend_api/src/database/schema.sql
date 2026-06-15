-- ============================================================
-- Smart Electricity Management System - Database Schema
-- Based on real B.POWER invoice analysis
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ZONES / DISTRICTS TABLE (المناطق)
-- ============================================================
CREATE TABLE zones (
    zone_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name   VARCHAR(100) NOT NULL,
    zone_code   VARCHAR(20) UNIQUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. DYNAMIC RBAC TABLES (أدوار وصلاحيات النظام)
-- ============================================================
CREATE TABLE roles (
    role_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name   VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE permissions (
    permission_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_key  VARCHAR(100) UNIQUE NOT NULL, -- (e.g., 'read:readings', 'write:bills')
    description     TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id         UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- 3. USERS / EMPLOYEES TABLE (المستخدمون - موظفون وإداريون وفنيون)
-- ============================================================
CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(150) NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(150) UNIQUE,
    phone_number    VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    role_id         UUID REFERENCES roles(role_id) ON DELETE SET NULL,
    zone_id         UUID REFERENCES zones(zone_id),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. CUSTOMERS TABLE (المشتركون)
-- Based on: رقم المشترك، اسم المشترك، رقم الهاتف
-- ============================================================
CREATE TYPE customer_status AS ENUM ('active', 'disconnected', 'suspended', 'pending');
CREATE TYPE customer_type AS ENUM ('residential', 'commercial', 'industrial', 'government');

CREATE TABLE customers (
    customer_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_number INTEGER UNIQUE NOT NULL,  -- رقم المشترك (مثال: 385)
    full_name       VARCHAR(150) NOT NULL,     -- اسم المشترك
    phone_number    VARCHAR(20),               -- رقم الهاتف
    alternate_phone VARCHAR(20),
    national_id     VARCHAR(30),
    address         TEXT,
    zone_id         UUID REFERENCES zones(zone_id),
    customer_type   customer_type DEFAULT 'commercial',
    status          customer_status DEFAULT 'active',
    registered_by   UUID REFERENCES users(user_id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. METERS TABLE (العدادات)
-- Based on: رقم العداد، الكابينة
-- ============================================================
CREATE TYPE meter_status AS ENUM ('active', 'faulty', 'replaced', 'removed');

CREATE TABLE meters (
    meter_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_number        VARCHAR(30) UNIQUE NOT NULL,  -- رقم العداد (مثال: 1200138221)
    customer_id         UUID NOT NULL REFERENCES customers(customer_id),
    cabinet_name        VARCHAR(100),                  -- الكابينة (مثال: النوم)
    zone_id             UUID REFERENCES zones(zone_id),
    meter_brand         VARCHAR(100),
    meter_type          VARCHAR(50),                   -- (أحادي / ثلاثي)
    installation_date   DATE,
    last_replacement    DATE,
    status              meter_status DEFAULT 'active',
    gps_latitude        DECIMAL(10, 8),
    gps_longitude       DECIMAL(11, 8),
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. METER READINGS TABLE (قراءات العدادات)
-- Based on: القراءة السابقة، القراءة الحالية، الاستهلاك
-- ============================================================
CREATE TYPE reading_status AS ENUM ('pending', 'approved', 'rejected', 'estimated');

CREATE TABLE meter_readings (
    reading_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id            UUID NOT NULL REFERENCES meters(meter_id),
    technician_id       UUID NOT NULL REFERENCES users(user_id),
    approved_by         UUID REFERENCES users(user_id),

    -- القراءات (من الفاتورة: 1326 سابقة, 1350 حالية, 24 استهلاك)
    previous_reading    DECIMAL(12, 2) NOT NULL,
    current_reading     DECIMAL(12, 2) NOT NULL,
    consumption         DECIMAL(12, 2) GENERATED ALWAYS AS (current_reading - previous_reading) STORED,

    -- التوثيق
    reading_date        TIMESTAMP NOT NULL DEFAULT NOW(),
    reading_image_url   TEXT,                    -- رابط صورة العداد
    gps_latitude        DECIMAL(10, 8),          -- موقع الفني للحماية من التلاعب
    gps_longitude       DECIMAL(11, 8),
    status              reading_status DEFAULT 'pending',

    -- البيانات الدورية (من الفاتورة: الدورة 14)
    billing_cycle       INTEGER,
    period_from         DATE,
    period_to           DATE,

    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. TARIFF RATES TABLE (التعريفات والأسعار)
-- لحساب قيمة الاستهلاك تلقائياً
-- ============================================================
CREATE TABLE tariff_rates (
    tariff_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_type       customer_type NOT NULL,
    min_kwh             DECIMAL(10, 2) DEFAULT 0,
    max_kwh             DECIMAL(10, 2),          -- NULL = unlimited
    rate_per_kwh        DECIMAL(10, 4) NOT NULL,  -- السعر لكل كيلوواط
    effective_from      DATE NOT NULL,
    effective_to        DATE,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 7. BILLS TABLE (الفواتير) - الجدول الأهم
-- Based on الفاتورة: رقم 11584, دورة 14, قيمة استهلاك 6360, متأخرات 866, إجمالي 7226
-- ============================================================
CREATE TYPE bill_status AS ENUM ('unpaid', 'paid', 'partially_paid', 'cancelled', 'disputed');

CREATE TABLE bills (
    bill_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number      BIGINT UNIQUE NOT NULL,   -- رقم الفاتورة (مثال: 11584)
    customer_id         UUID NOT NULL REFERENCES customers(customer_id),
    meter_id            UUID NOT NULL REFERENCES meters(meter_id),
    reading_id          UUID REFERENCES meter_readings(reading_id),
    generated_by        UUID REFERENCES users(user_id),

    -- بيانات الفترة (من الفاتورة)
    billing_cycle       INTEGER NOT NULL,          -- الدورة (مثال: 14)
    period_from         DATE NOT NULL,             -- للفترة من (مثال: 2026/05/11)
    period_to           DATE NOT NULL,             -- للفترة إلى (مثال: 2026/05/20)

    -- القراءات في الفاتورة
    previous_reading    DECIMAL(12, 2),
    current_reading     DECIMAL(12, 2),
    consumption_kwh     DECIMAL(12, 2),            -- الاستهلاك بالكيلوواط

    -- المبالغ المالية (من الفاتورة)
    consumption_value   DECIMAL(14, 2) DEFAULT 0,  -- قيمة الاستهلاك (6,360)
    services_fees       DECIMAL(14, 2) DEFAULT 0,  -- خدمات أخرى
    arrears             DECIMAL(14, 2) DEFAULT 0,  -- المتأخرات (866)
    discount            DECIMAL(14, 2) DEFAULT 0,  -- الخصومات
    total_amount        DECIMAL(14, 2) NOT NULL,   -- المبلغ المستحق (7,226)
    amount_paid         DECIMAL(14, 2) DEFAULT 0,  -- المبلغ المدفوع فعلاً
    balance_due         DECIMAL(14, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,

    -- النص الكتابي
    amount_in_words     TEXT,                      -- المبلغ كتابة

    -- التواريخ
    issue_date          DATE DEFAULT CURRENT_DATE,
    due_date            DATE,                      -- آخر موعد للسداد

    status              bill_status DEFAULT 'unpaid',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. PAYMENTS TABLE (المدفوعات)
-- Based on: بنك الكريمي كجهة دفع مذكورة في الفاتورة
-- ============================================================
CREATE TYPE payment_method AS ENUM ('cash', 'kuraimi_bank', 'electronic_wallet', 'bank_transfer', 'online');
CREATE TYPE payment_status AS ENUM ('confirmed', 'pending', 'failed', 'refunded');

CREATE TABLE payments (
    payment_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id             UUID NOT NULL REFERENCES bills(bill_id),
    customer_id         UUID NOT NULL REFERENCES customers(customer_id),
    received_by         UUID REFERENCES users(user_id),   -- الكاشير المستلم

    amount_paid         DECIMAL(14, 2) NOT NULL,          -- المبلغ المدفوع
    payment_method      payment_method DEFAULT 'cash',
    reference_number    VARCHAR(100),                      -- رقم سند القبض / رقم الحوالة
    transaction_id      VARCHAR(200),                      -- معرف المعاملة البنكية

    payment_date        TIMESTAMP DEFAULT NOW(),
    status              payment_status DEFAULT 'confirmed',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 9. DISCONNECTIONS TABLE (الفصل والوصل)
-- ============================================================
CREATE TYPE disconnection_reason AS ENUM ('non_payment', 'request', 'maintenance', 'fraud', 'other');

CREATE TABLE disconnections (
    disconnection_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id            UUID NOT NULL REFERENCES meters(meter_id),
    customer_id         UUID NOT NULL REFERENCES customers(customer_id),
    technician_id       UUID REFERENCES users(user_id),
    bill_id             UUID REFERENCES bills(bill_id),   -- الفاتورة سبب الفصل

    reason              disconnection_reason DEFAULT 'non_payment',
    disconnected_at     TIMESTAMP,
    reconnected_at      TIMESTAMP,
    reconnection_fee    DECIMAL(10, 2) DEFAULT 0,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 10. NOTIFICATIONS TABLE (الإشعارات)
-- ============================================================
CREATE TYPE notification_type AS ENUM ('bill_due', 'payment_received', 'disconnection_warning', 'reading_required', 'system');

CREATE TABLE notifications (
    notification_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id         UUID REFERENCES customers(customer_id),
    user_id             UUID REFERENCES users(user_id),
    type                notification_type NOT NULL,
    title               VARCHAR(200) NOT NULL,
    message             TEXT NOT NULL,
    is_read             BOOLEAN DEFAULT FALSE,
    sent_via_sms        BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 11. CONSUMPTION LOGS TABLE (سجلات الاستهلاك التفصيلية)
-- ============================================================
CREATE TABLE consumption_logs (
    log_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id          UUID NOT NULL REFERENCES meters(meter_id) ON DELETE CASCADE,
    customer_id       UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    consumption_kwh   DECIMAL(12, 2) NOT NULL,
    logged_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    billing_cycle     INTEGER,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 12. COMPLAINTS TABLE (الشكاوى والاعتراضات)
-- ============================================================
CREATE TYPE complaint_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE complaint_category AS ENUM ('billing', 'meter', 'power_cut', 'leakage', 'service', 'other');

CREATE TABLE complaints (
    complaint_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id       UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    category          complaint_category DEFAULT 'other',
    subject           VARCHAR(200) NOT NULL,
    description       TEXT NOT NULL,
    status            complaint_status DEFAULT 'open',
    assigned_to       UUID REFERENCES users(user_id) ON DELETE SET NULL,
    resolution_notes  TEXT,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 13. AI REPORTS TABLE (تقارير الذكاء الاصطناعي والتحليلات)
-- ============================================================
CREATE TYPE anomaly_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE ai_reports (
    report_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id          UUID REFERENCES meters(meter_id) ON DELETE CASCADE,
    customer_id       UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    analysis_type     VARCHAR(100) NOT NULL, -- (e.g., 'fraud_detection', 'load_forecasting')
    anomaly_score     DECIMAL(5, 2) NOT NULL,  -- Anomaly score (0 to 100)
    severity          anomaly_severity DEFAULT 'low',
    findings          TEXT NOT NULL,
    recommended_action TEXT,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 14. AUDIT LOGS TABLE (سجل الرقابة والعمليات)
-- ============================================================
CREATE TABLE audit_logs (
    audit_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action            VARCHAR(100) NOT NULL, -- (e.g., 'CREATE_CUSTOMER', 'PAY_BILL')
    table_name        VARCHAR(100) NOT NULL,
    record_id         UUID,
    old_values        JSONB,
    new_values        JSONB,
    ip_address        VARCHAR(45),
    user_agent        TEXT,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES - للأداء السريع
-- ============================================================
CREATE INDEX idx_customers_number ON customers(customer_number);
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_meters_number ON meters(meter_number);
CREATE INDEX idx_meters_customer ON meters(customer_id);
CREATE INDEX idx_readings_meter ON meter_readings(meter_id);
CREATE INDEX idx_readings_date ON meter_readings(reading_date);
CREATE INDEX idx_bills_customer ON bills(customer_id);
CREATE INDEX idx_bills_invoice ON bills(invoice_number);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_consumption_meter ON consumption_logs(meter_id);
CREATE INDEX idx_consumption_date ON consumption_logs(logged_date);
CREATE INDEX idx_complaints_customer ON complaints(customer_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_ai_reports_meter ON ai_reports(meter_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ============================================================
-- TRIGGERS - تحديث updated_at تلقائياً
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meters_updated_at BEFORE UPDATE ON meters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA - بيانات أولية للنظام
-- ============================================================

-- مناطق افتراضية
INSERT INTO zones (zone_name, zone_code) VALUES
    ('المنطقة الرئيسية', 'MAIN'),
    ('منطقة الشمال', 'NORTH'),
    ('منطقة الجنوب', 'SOUTH'),
    ('منطقة الشرق', 'EAST');

-- تعريفات الأسعار (مثال)
INSERT INTO tariff_rates (customer_type, min_kwh, max_kwh, rate_per_kwh, effective_from) VALUES
    ('residential', 0, 200, 30, '2025-01-01'),
    ('residential', 201, NULL, 50, '2025-01-01'),
    ('commercial', 0, NULL, 265, '2025-01-01'),
    ('industrial', 0, NULL, 200, '2025-01-01');

-- أدوار النظام الافتراضية
INSERT INTO roles (role_name, description) VALUES
    ('admin', 'مدير النظام بكامل الصلاحيات'),
    ('supervisor', 'مشرف مالي وإداري للمناطق'),
    ('technician', 'فني ميداني لأخذ القراءات وتصوير العدادات'),
    ('cashier', 'أمين صندوق لاستلام الفواتير والمدفوعات');

-- الصلاحيات الأساسية
INSERT INTO permissions (permission_key, description) VALUES
    ('read:users', 'عرض المستخدمين والموظفين'),
    ('write:users', 'إضافة وتعديل المستخدمين'),
    ('read:customers', 'عرض المشتركين'),
    ('write:customers', 'إضافة وتعديل المشتركين'),
    ('read:meters', 'عرض العدادات'),
    ('write:meters', 'إضافة وتعديل العدادات'),
    ('read:readings', 'عرض قراءات العدادات'),
    ('write:readings', 'تسجيل قراءات العدادات'),
    ('approve:readings', 'اعتماد أو رفض قراءات العدادات'),
    ('read:bills', 'عرض الفواتير'),
    ('write:bills', 'إصدار وتعديل الفواتير'),
    ('read:payments', 'عرض المقبوضات والمدفوعات'),
    ('write:payments', 'تسجيل عمليات الدفع والمقبوضات'),
    ('read:complaints', 'عرض شكاوى المشتركين'),
    ('resolve:complaints', 'معالجة وحل شكاوى المشتركين'),
    ('read:ai_reports', 'عرض تحليلات الذكاء الاصطناعي وتوقعات الاستهلاك'),
    ('read:audit_logs', 'عرض سجل العمليات والرقابة');

-- ربط الصلاحيات بالأدوار (ربط كامل للمدير، وجزئي للبقية)
-- المدير: له كل الصلاحيات
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p WHERE r.role_name = 'admin';

-- الفني: له صلاحية القراءة والتسجيل فقط للعدادات والقراءات
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p 
WHERE r.role_name = 'technician' AND p.permission_key IN ('read:customers', 'read:meters', 'read:readings', 'write:readings', 'read:complaints');

-- الكاشير: له صلاحية القراءة وتسجيل المدفوعات والفواتير
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p 
WHERE r.role_name = 'cashier' AND p.permission_key IN ('read:customers', 'read:bills', 'read:payments', 'write:payments');

-- المشرف: له أغلب الصلاحيات التشغيلية دون تعديل الموظفين
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p 
WHERE r.role_name = 'supervisor' AND p.permission_key IN (
    'read:users', 'read:customers', 'write:customers', 'read:meters', 'write:meters',
    'read:readings', 'write:readings', 'approve:readings', 'read:bills', 'write:bills',
    'read:payments', 'read:complaints', 'resolve:complaints', 'read:ai_reports'
);

-- مستخدم مدير افتراضي (password: Admin@123456)
INSERT INTO users (full_name, username, email, password_hash, role_id) VALUES
    ('مدير النظام', 'admin', 'admin@sems.local', '$2b$12$R.S6w8Gk9cQZ1d6kK/W7fO8wXW301h9H3p9.r0Z5E9dKx5v7yv5mO', (SELECT role_id FROM roles WHERE role_name = 'admin'));

-- ============================================================
-- END OF SCHEMA
-- ============================================================

