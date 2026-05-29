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
    -- Get or insert default company
    INSERT INTO companies (company_name, company_code, domain_name)
    VALUES ('شركة الطاقة الرئيسية B.POWER', 'BPOWER', 'bpower.platform.com')
    ON CONFLICT (company_code) DO UPDATE SET company_name = EXCLUDED.company_name
    RETURNING company_id INTO default_company_id;

    -- Also insert additional companies for the multi-tenant system
    INSERT INTO companies (company_name, company_code, domain_name)
    VALUES 
        ('شركة نور الكهربائية', 'NOOR', 'noor.platform.com'),
        ('شركة أمان للطاقة', 'AMAN', 'aman.platform.com')
    ON CONFLICT (company_code) DO NOTHING;

    -- A. Alter ZONES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zones' AND column_name='company_id') THEN
        ALTER TABLE zones ADD COLUMN company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE;
        UPDATE zones SET company_id = default_company_id WHERE company_id IS NULL;
        ALTER TABLE zones ALTER COLUMN company_id SET NOT NULL;
        CREATE INDEX idx_zones_company ON zones(company_id);
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

END $$;`;
