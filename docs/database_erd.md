# مخطط علاقات قاعدة البيانات (Entity Relationship Diagram - ERD)

هذا المستند يحتوي على مخطط العلاقات (ERD) لقاعدة البيانات الخاصة بنظام إدارة الكهرباء الذكي (SEMS)، متضمناً جدول الشركات وإجراءات تعدد الشركات (Multi-Tenancy) التي تمت إضافتها مؤخراً في المرحلة الثامنة.

## 1. مخطط Mermaid البصري (Visual ERD)

```mermaid
erDiagram
    COMPANIES {
        uuid company_id PK
        string company_name
        string company_code UK
        string domain_name UK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    OTP_VERIFICATIONS {
        uuid verification_id PK
        uuid company_id FK
        string phone_number
        string otp_code
        string reset_token UK
        boolean is_verified
        integer attempts
        timestamp expires_at
        timestamp created_at
    }

    ZONES {
        uuid zone_id PK
        string zone_name
        string zone_code UK
        uuid company_id FK
        timestamp created_at
    }

    ROLES {
        uuid role_id PK
        string role_name
        string description
        uuid company_id FK
        timestamp created_at
    }

    PERMISSIONS {
        uuid permission_id PK
        string permission_key UK
        string description
        timestamp created_at
    }

    ROLE_PERMISSIONS {
        uuid role_id PK, FK
        uuid permission_id PK, FK
    }

    USERS {
        uuid user_id PK
        string full_name
        string username UK
        string email UK
        string phone_number
        string password_hash
        uuid role_id FK
        uuid zone_id FK
        uuid company_id FK
        uuid customer_id FK
        boolean is_active
        timestamp last_login
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMERS {
        uuid customer_id PK
        integer customer_number
        string full_name
        string phone_number
        string alternate_phone
        string national_id
        text address
        uuid zone_id FK
        enum customer_type
        enum status
        uuid registered_by FK
        uuid company_id FK
        timestamp created_at
        timestamp updated_at
    }

    METERS {
        uuid meter_id PK
        string meter_number
        uuid customer_id FK
        string cabinet_name
        uuid zone_id FK
        string meter_brand
        string meter_type
        date installation_date
        date last_replacement
        enum status
        decimal gps_latitude
        decimal gps_longitude
        text notes
        uuid company_id FK
        timestamp created_at
        timestamp updated_at
    }

    METER_READINGS {
        uuid reading_id PK
        uuid meter_id FK
        uuid technician_id FK
        uuid approved_by FK
        decimal previous_reading
        decimal current_reading
        decimal consumption
        timestamp reading_date
        string reading_image_url
        decimal gps_latitude
        decimal gps_longitude
        enum status
        integer billing_cycle
        date period_from
        date period_to
        text notes
        timestamp created_at
    }

    TARIFF_RATES {
        uuid tariff_id PK
        enum customer_type
        decimal min_kwh
        decimal max_kwh
        decimal rate_per_kwh
        date effective_from
        date effective_to
        boolean is_active
        uuid company_id FK
        timestamp created_at
    }

    BILLS {
        uuid bill_id PK
        bigint invoice_number
        uuid customer_id FK
        uuid meter_id FK
        uuid reading_id FK
        uuid generated_by FK
        integer billing_cycle
        date period_from
        date period_to
        decimal previous_reading
        decimal current_reading
        decimal consumption_kwh
        decimal consumption_value
        decimal services_fees
        decimal arrears
        decimal discount
        decimal total_amount
        decimal amount_paid
        decimal balance_due
        text amount_in_words
        date issue_date
        date due_date
        enum status
        text notes
        uuid company_id FK
        timestamp created_at
        timestamp updated_at
    }

    PAYMENTS {
        uuid payment_id PK
        uuid bill_id FK
        uuid customer_id FK
        uuid received_by FK
        decimal amount_paid
        enum payment_method
        string reference_number
        string transaction_id
        timestamp payment_date
        enum status
        text notes
        uuid company_id FK
        timestamp created_at
    }

    DISCONNECTIONS {
        uuid disconnection_id PK
        uuid meter_id FK
        uuid customer_id FK
        uuid technician_id FK
        uuid bill_id FK
        enum reason
        timestamp disconnected_at
        timestamp reconnected_at
        decimal reconnection_fee
        text notes
        timestamp created_at
    }

    NOTIFICATIONS {
        uuid notification_id PK
        uuid customer_id FK
        uuid user_id FK
        enum type
        string title
        text message
        boolean is_read
        boolean sent_via_sms
        uuid company_id FK
        timestamp created_at
    }

    CONSUMPTION_LOGS {
        uuid log_id PK
        uuid meter_id FK
        uuid customer_id FK
        decimal consumption_kwh
        date logged_date
        integer billing_cycle
        timestamp created_at
    }

    COMPLAINTS {
        uuid complaint_id PK
        uuid customer_id FK
        enum category
        string subject
        text description
        enum status
        uuid assigned_to FK
        text resolution_notes
        uuid company_id FK
        timestamp created_at
        timestamp updated_at
    }

    AI_REPORTS {
        uuid report_id PK
        uuid meter_id FK
        uuid customer_id FK
        string analysis_type
        decimal anomaly_score
        enum severity
        text findings
        text recommended_action
        uuid company_id FK
        timestamp created_at
    }

    AUDIT_LOGS {
        uuid audit_id PK
        uuid user_id FK
        string action
        string table_name
        uuid record_id
        jsonb old_values
        jsonb new_values
        string ip_address
        text user_agent
        timestamp created_at
    }

    %% العلاقات الأساسية بين الكيانات
    COMPANIES ||--o{ OTP_VERIFICATIONS : "owns"
    COMPANIES ||--o{ ZONES : "manages"
    COMPANIES ||--o{ ROLES : "defines"
    COMPANIES ||--o{ USERS : "employs"
    COMPANIES ||--o{ CUSTOMERS : "serves"
    COMPANIES ||--o{ METERS : "owns"
    COMPANIES ||--o{ TARIFF_RATES : "applies"
    COMPANIES ||--o{ BILLS : "issues"
    COMPANIES ||--o{ PAYMENTS : "collects"
    COMPANIES ||--o{ COMPLAINTS : "resolves"
    COMPANIES ||--o{ AI_REPORTS : "generates"
    COMPANIES ||--o{ NOTIFICATIONS : "sends"

    ZONES ||--o{ USERS : "contains"
    ZONES ||--o{ CUSTOMERS : "localizes"
    ZONES ||--o{ METERS : "localizes"

    ROLES ||--o{ ROLE_PERMISSIONS : "has"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "grants"
    ROLES ||--o{ USERS : "assigns"

    USERS ||--o{ CUSTOMERS : "registers"
    USERS ||--o{ METER_READINGS : "submits"
    USERS ||--o{ METER_READINGS : "approves"
    USERS ||--o{ BILLS : "generates"
    USERS ||--o{ PAYMENTS : "collects"
    USERS ||--o{ DISCONNECTIONS : "executes"
    USERS ||--o{ COMPLAINTS : "handles"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    USERS ||--o{ USERS : "customer_link"

    CUSTOMERS ||--|| USERS : "has_account"
    CUSTOMERS ||--o{ METERS : "has"
    CUSTOMERS ||--o{ BILLS : "charged"
    CUSTOMERS ||--o{ PAYMENTS : "pays"
    CUSTOMERS ||--o{ DISCONNECTIONS : "affected"
    CUSTOMERS ||--o{ NOTIFICATIONS : "receives"
    CUSTOMERS ||--o{ CONSUMPTION_LOGS : "logs"
    CUSTOMERS ||--o{ COMPLAINTS : "files"
    CUSTOMERS ||--o{ AI_REPORTS : "analyzed"

    METERS ||--o{ METER_READINGS : "read"
    METERS ||--o{ BILLS : "billed"
    METERS ||--o{ DISCONNECTIONS : "status"
    METERS ||--o{ CONSUMPTION_LOGS : "logs"
    METERS ||--o{ AI_REPORTS : "monitored"

    METER_READINGS ||--o| BILLS : "generates"
    BILLS ||--o{ PAYMENTS : "pays_off"
    BILLS ||--o| DISCONNECTIONS : "causes"
```

---

## 2. تفاصيل عزل البيانات متعددة الشركات (Multi-Tenancy Details)

يتم تحقيق عزل البيانات من خلال ربط معظم الجداول بجدول `COMPANIES` عبر المفتاح الخارجي `company_id`.

* **تخصيص الصلاحيات والأدوار:** لكل شركة أدوارها وصلاحياتها الخاصة بها لمنع التداخل.
* **الأمان والعزل الفعلي (Logical Separation):** يتم تصفية جميع الاستعلامات البرمجية من خلال وسيط `tenantContext` الذي يستخرج `company_id` ويقوم بإضافته تلقائياً كشرط رئيسي (`WHERE company_id = ...`) في كل الاستعلامات الخاصة بقراءة أو تعديل البيانات.
