export const schemaSql = `-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ZONES / DISTRICTS TABLE (المناطق)
-- ============================================================
CREATE TABLE IF NOT EXISTS zones (
    zone_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name   VARCHAR(100) NOT NULL,
    zone_code   VARCHAR(20) UNIQUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. DYNAMIC RBAC TABLES (أدوار وصلاحيات النظام)
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    role_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name   VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    permission_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_key  VARCHAR(100) UNIQUE NOT NULL, -- (e.g., 'read:readings', 'write:bills')
    description     TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id         UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- 3. USERS / EMPLOYEES TABLE (المستخدمون - موظفون وإداريون وفنيون)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
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
-- ============================================================
CREATE TYPE customer_status AS ENUM ('active', 'disconnected', 'suspended', 'pending');
CREATE TYPE customer_type AS ENUM ('residential', 'commercial', 'industrial', 'government');

CREATE TABLE IF NOT EXISTS customers (
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
-- ============================================================
CREATE TYPE meter_status AS ENUM ('active', 'faulty', 'replaced', 'removed');

CREATE TABLE IF NOT EXISTS meters (
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
-- ============================================================
CREATE TYPE reading_status AS ENUM ('pending', 'approved', 'rejected', 'estimated');

CREATE TABLE IF NOT EXISTS meter_readings (
    reading_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id            UUID NOT NULL REFERENCES meters(meter_id),
    technician_id       UUID NOT NULL REFERENCES users(user_id),
    approved_by         UUID REFERENCES users(user_id),
    previous_reading    DECIMAL(12, 2) NOT NULL,
    current_reading     DECIMAL(12, 2) NOT NULL,
    consumption         DECIMAL(12, 2) GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
    reading_date        TIMESTAMP NOT NULL DEFAULT NOW(),
    reading_image_url   TEXT,                    -- رابط صورة العداد
    gps_latitude        DECIMAL(10, 8),          -- موقع الفني للحماية من التلاعب
    gps_longitude       DECIMAL(11, 8),
    status              reading_status DEFAULT 'pending',
    billing_cycle       INTEGER,
    period_from         DATE,
    period_to           DATE,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. TARIFF RATES TABLE (التعريفات والأسعار)
-- ============================================================
CREATE TABLE IF NOT EXISTS tariff_rates (
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
-- 7. BILLS TABLE (الفواتير)
-- ============================================================
CREATE TYPE bill_status AS ENUM ('unpaid', 'paid', 'partially_paid', 'cancelled', 'disputed');

CREATE TABLE IF NOT EXISTS bills (
    bill_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number      BIGINT UNIQUE NOT NULL,   -- رقم الفاتورة (مثال: 11584)
    customer_id         UUID NOT NULL REFERENCES customers(customer_id),
    meter_id            UUID NOT NULL REFERENCES meters(meter_id),
    reading_id          UUID REFERENCES meter_readings(reading_id),
    generated_by        UUID REFERENCES users(user_id),
    billing_cycle       INTEGER NOT NULL,          -- الدورة (مثال: 14)
    period_from         DATE NOT NULL,             -- للفترة من (مثال: 2026/05/11)
    period_to           DATE NOT NULL,             -- للفترة إلى (مثال: 2026/05/20)
    previous_reading    DECIMAL(12, 2),
    current_reading     DECIMAL(12, 2),
    consumption_kwh     DECIMAL(12, 2),            -- الاستهلاك بالكيلوواط
    consumption_value   DECIMAL(14, 2) DEFAULT 0,  -- قيمة الاستهلاك (6,360)
    services_fees       DECIMAL(14, 2) DEFAULT 0,  -- خدمات أخرى
    arrears             DECIMAL(14, 2) DEFAULT 0,  -- المتأخرات (866)
    discount            DECIMAL(14, 2) DEFAULT 0,  -- الخصومات
    total_amount        DECIMAL(14, 2) NOT NULL,   -- المبلغ المستحق (7,226)
    amount_paid         DECIMAL(14, 2) DEFAULT 0,  -- المبلغ المدفوع فعلاً
    balance_due         DECIMAL(14, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    amount_in_words     TEXT,                      -- المبلغ كتابة
    issue_date          DATE DEFAULT CURRENT_DATE,
    due_date            DATE,                      -- آخر موعد للسداد
    status              bill_status DEFAULT 'unpaid',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. PAYMENTS TABLE (المدفوعات)
-- ============================================================
CREATE TYPE payment_method AS ENUM ('cash', 'kuraimi_bank', 'electronic_wallet', 'bank_transfer', 'online');
CREATE TYPE payment_status AS ENUM ('confirmed', 'pending', 'failed', 'refunded');

CREATE TABLE IF NOT EXISTS payments (
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

CREATE TABLE IF NOT EXISTS disconnections (
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

CREATE TABLE IF NOT EXISTS notifications (
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
CREATE TABLE IF NOT EXISTS consumption_logs (
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

CREATE TABLE IF NOT EXISTS complaints (
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

CREATE TABLE IF NOT EXISTS ai_reports (
    report_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id          UUID REFERENCES meters(meter_id) ON DELETE CASCADE,
    customer_id       UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    analysis_type     VARCHAR(100) NOT NULL,
    anomaly_score     DECIMAL(5, 2) NOT NULL,
    severity          anomaly_severity DEFAULT 'low',
    findings          TEXT NOT NULL,
    recommended_action TEXT,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 14. AUDIT LOGS TABLE (سجل الرقابة والعمليات)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action            VARCHAR(100) NOT NULL,
    table_name        VARCHAR(100) NOT NULL,
    record_id         UUID,
    old_values        JSONB,
    new_values        JSONB,
    ip_address        VARCHAR(45),
    user_agent        TEXT,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_customers_number ON customers(customer_number);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_meters_number ON meters(meter_number);
CREATE INDEX IF NOT EXISTS idx_meters_customer ON meters(customer_id);
CREATE INDEX IF NOT EXISTS idx_readings_meter ON meter_readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_readings_date ON meter_readings(reading_date);
CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_invoice ON bills(invoice_number);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_consumption_meter ON consumption_logs(meter_id);
CREATE INDEX IF NOT EXISTS idx_consumption_date ON consumption_logs(logged_date);
CREATE INDEX IF NOT EXISTS idx_complaints_customer ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_ai_reports_meter ON ai_reports(meter_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
`;
