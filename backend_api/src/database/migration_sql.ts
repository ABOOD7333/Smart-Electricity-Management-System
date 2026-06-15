export const migrationSql = `-- ============================================================
-- Migration Script for Phase 8: Multi-Tenant & Company Isolation
-- ============================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create companies table
CREATE TABLE IF NOT EXISTS companies (
    company_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name    VARCHAR(150) NOT NULL,
    company_code    VARCHAR(50) UNIQUE NOT NULL, -- (e.g., 'BPOWER', 'NOOR', 'AMAN')
    domain_name     VARCHAR(255) UNIQUE,         -- (e.g., 'bpower.platform.com')
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- 2. Create otp_verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
    verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    phone_number    VARCHAR(20) NOT NULL,
    otp_code        VARCHAR(6) NOT NULL,
    reset_token     VARCHAR(255) UNIQUE,
    is_verified     BOOLEAN DEFAULT FALSE,
    attempts        INTEGER DEFAULT 0,
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 3. Execute safe PL/pgSQL block to update all existing tables and inject company relations
DO $$
DECLARE
    default_company_id UUID;
BEGIN
    -- Get or insert default company if none exists, to satisfy schema migration requirements
    IF NOT EXISTS (SELECT 1 FROM companies) THEN
        INSERT INTO companies (company_name, company_code, domain_name)
        VALUES ('شركة الطاقة الرئيسية B.POWER', 'BPOWER', 'bpower.platform.com')
        RETURNING company_id INTO default_company_id;
    ELSE
        SELECT company_id INTO default_company_id FROM companies LIMIT 1;
    END IF;

    -- A. Alter ZONES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zones' AND column_name='company_id') THEN
        ALTER TABLE zones ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        UPDATE zones SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE zones ALTER COLUMN company_id SET NOT NULL;
        CREATE INDEX idx_zones_company ON zones(company_id);
    END IF;
    -- Remove the unique constraint on zone_code and make it unique PER COMPANY instead!
    ALTER TABLE zones DROP CONSTRAINT IF EXISTS zones_zone_code_key;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zones_zone_code_company_key') THEN
        ALTER TABLE zones ADD CONSTRAINT zones_zone_code_company_key UNIQUE (zone_code, company_id);
    END IF;

    -- B. Alter ROLES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='company_id') THEN
        ALTER TABLE roles ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        -- Remove the unique constraint on role_name and make it unique PER COMPANY instead!
        ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_role_name_key;
        UPDATE roles SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE roles ALTER COLUMN company_id SET NOT NULL;
        ALTER TABLE roles ADD CONSTRAINT roles_role_name_company_key UNIQUE (role_name, company_id);
        CREATE INDEX idx_roles_company ON roles(company_id);
    END IF;

    -- C. Alter USERS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='company_id') THEN
        ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        UPDATE users SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
        CREATE INDEX idx_users_company ON users(company_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='customer_id') THEN
        ALTER TABLE users ADD COLUMN customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL;
        CREATE INDEX idx_users_customer ON users(customer_id);
    END IF;

    -- Remove the unique constraint on username and email and make them unique PER COMPANY instead!
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_username_company_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_username_company_key UNIQUE (username, company_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_email_company_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_company_key UNIQUE (email, company_id);
    END IF;

    -- Ensure 'customer' role exists for each company
    INSERT INTO roles (role_name, description, company_id)
    SELECT 'customer', 'مشترك لعرض الفواتير والقراءات وتقديم الشكاوى', company_id
    FROM companies
    ON CONFLICT (role_name, company_id) DO NOTHING;

    -- D. Alter CUSTOMERS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='company_id') THEN
        ALTER TABLE customers ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        -- Drop customer_number unique constraint and make it unique PER COMPANY!
        ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_number_key;
        UPDATE customers SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE customers ALTER COLUMN company_id SET NOT NULL;
        ALTER TABLE customers ADD CONSTRAINT customers_number_company_key UNIQUE (customer_number, company_id);
        CREATE INDEX idx_customers_company ON customers(company_id);
    END IF;

    -- E. Alter METERS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meters' AND column_name='company_id') THEN
        ALTER TABLE meters ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        -- Drop meter_number unique constraint and make it unique PER COMPANY!
        ALTER TABLE meters DROP CONSTRAINT IF EXISTS meters_meter_number_key;
        UPDATE meters SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE meters ALTER COLUMN company_id SET NOT NULL;
        ALTER TABLE meters ADD CONSTRAINT meters_number_company_key UNIQUE (meter_number, company_id);
        CREATE INDEX idx_meters_company ON meters(company_id);
    END IF;

    -- F. Alter TARIFF_RATES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tariff_rates' AND column_name='company_id') THEN
        ALTER TABLE tariff_rates ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        UPDATE tariff_rates SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE tariff_rates ALTER COLUMN company_id SET NOT NULL;
        CREATE INDEX idx_tariffs_company ON tariff_rates(company_id);
    END IF;

    -- G. Alter BILLS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills' AND column_name='company_id') THEN
        ALTER TABLE bills ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        -- Drop invoice_number unique constraint and make it unique PER COMPANY!
        ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_invoice_number_key;
        UPDATE bills SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE bills ALTER COLUMN company_id SET NOT NULL;
        ALTER TABLE bills ADD CONSTRAINT bills_invoice_company_key UNIQUE (invoice_number, company_id);
        CREATE INDEX idx_bills_company ON bills(company_id);
    END IF;

    -- H. Alter PAYMENTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='company_id') THEN
        ALTER TABLE payments ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        UPDATE payments SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE payments ALTER COLUMN company_id SET NOT NULL;
        CREATE INDEX idx_payments_company ON payments(company_id);
    END IF;

    -- I. Alter COMPLAINTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='company_id') THEN
        ALTER TABLE complaints ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        UPDATE complaints SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE complaints ALTER COLUMN company_id SET NOT NULL;
        CREATE INDEX idx_complaints_company ON complaints(company_id);
    END IF;

    -- J. Alter AI_REPORTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_reports' AND column_name='company_id') THEN
        ALTER TABLE ai_reports ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        UPDATE ai_reports SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE ai_reports ALTER COLUMN company_id SET NOT NULL;
        CREATE INDEX idx_ai_reports_company ON ai_reports(company_id);
    END IF;

    -- K. Alter NOTIFICATIONS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='company_id') THEN
        ALTER TABLE notifications ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        UPDATE notifications SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE notifications ALTER COLUMN company_id SET NOT NULL;
        CREATE INDEX idx_notifications_company ON notifications(company_id);
    END IF;

    -- ============================================================
    -- SEEDING DATA FOR MULTI-TENANCY
    -- ============================================================

    -- 1. Ensure all standard permissions exist
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
        ('read:audit_logs', 'عرض سجل العمليات والرقابة')
    ON CONFLICT (permission_key) DO NOTHING;

    -- 2. Ensure standard roles exist for each company
    INSERT INTO roles (role_name, description, company_id)
    SELECT r_name, r_desc, c.company_id
    FROM companies c
    CROSS JOIN (VALUES 
        ('admin', 'مدير النظام بكامل الصلاحيات'),
        ('supervisor', 'مشرف مالي وإداري للمناطق'),
        ('technician', 'فني ميداني لأخذ القراءات وتصوير العدادات'),
        ('cashier', 'أمين صندوق لاستلام الفواتير والمدفوعات'),
        ('customer', 'مشترك لعرض الفواتير والقراءات وتقديم الشكاوى')
    ) AS r(r_name, r_desc)
    ON CONFLICT (role_name, company_id) DO NOTHING;

    -- 3. Ensure role_permissions mappings are created for each company
    -- Admin role: full permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.role_name = 'admin'
    ON CONFLICT DO NOTHING;

    -- Technician role: partial permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.role_name = 'technician' AND p.permission_key IN ('read:customers', 'read:meters', 'read:readings', 'write:readings', 'read:complaints')
    ON CONFLICT DO NOTHING;

    -- Cashier role: partial permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.role_name = 'cashier' AND p.permission_key IN ('read:customers', 'read:bills', 'read:payments', 'write:payments')
    ON CONFLICT DO NOTHING;

    -- Supervisor role: partial permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.role_name = 'supervisor' AND p.permission_key IN (
        'read:users', 'read:customers', 'write:customers', 'read:meters', 'write:meters',
        'read:readings', 'write:readings', 'approve:readings', 'read:bills', 'write:bills',
        'read:payments', 'read:complaints', 'resolve:complaints', 'read:ai_reports'
    )
    ON CONFLICT DO NOTHING;

    -- 4. Ensure admin user exists for each company
    INSERT INTO users (full_name, username, email, password_hash, role_id, company_id)
    SELECT 
        'مدير النظام (' || c.company_code || ')',
        'admin',
        'admin@' || lower(c.company_code) || '.sems.local',
        '$2b$12$R.S6w8Gk9cQZ1d6kK/W7fO8wXW301h9H3p9.r0Z5E9dKx5v7yv5mO', -- Admin@123456
        r.role_id,
        c.company_id
    FROM companies c
    JOIN roles r ON r.company_id = c.company_id AND r.role_name = 'admin'
    ON CONFLICT DO NOTHING;

    -- 5. Ensure default zones exist for each company
    INSERT INTO zones (zone_name, zone_code, company_id)
    SELECT z_name, z_code, c.company_id
    FROM companies c
    CROSS JOIN (VALUES
        ('المنطقة الرئيسية', 'MAIN'),
        ('منطقة الشمال', 'NORTH'),
        ('منطقة الجنوب', 'SOUTH'),
        ('منطقة الشرق', 'EAST')
    ) AS z(z_name, z_code)
    ON CONFLICT (zone_code, company_id) DO NOTHING;

    -- 6. Ensure tariff rates exist for each company
    INSERT INTO tariff_rates (customer_type, min_kwh, max_kwh, rate_per_kwh, effective_from, company_id)
    SELECT t.customer_type, t.min_kwh, t.max_kwh, t.rate_per_kwh, t.effective_from, c.company_id
    FROM companies c
    CROSS JOIN (VALUES
        ('residential'::customer_type, 0::numeric, 200::numeric, 30::numeric, '2025-01-01'::date),
        ('residential'::customer_type, 201::numeric, NULL::numeric, 50::numeric, '2025-01-01'::date),
        ('commercial'::customer_type, 0::numeric, NULL::numeric, 265::numeric, '2025-01-01'::date),
        ('industrial'::customer_type, 0::numeric, NULL::numeric, 200::numeric, '2025-01-01'::date)
    ) AS t(customer_type, min_kwh, max_kwh, rate_per_kwh, effective_from)
    WHERE NOT EXISTS (SELECT 1 FROM tariff_rates tr WHERE tr.company_id = c.company_id);

END $$;`;
