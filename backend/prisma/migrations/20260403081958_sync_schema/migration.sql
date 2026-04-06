/*
  Warnings:

  - Added the required column `updated_at` to the `company_settings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "ip_address" VARCHAR(45);

-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email_footer_text" TEXT,
ADD COLUMN     "half_day_threshold_hours" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "late_grace_minutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "leave_categories" JSONB,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "notification_matrix" JSONB,
ADD COLUMN     "overtime_limit_hours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "password_policy" JSONB,
ADD COLUMN     "primary_color" VARCHAR(7) NOT NULL DEFAULT '#1E40AF',
ADD COLUMN     "require_2fa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "session_timeout_mins" INTEGER NOT NULL DEFAULT 1440,
ADD COLUMN     "state" VARCHAR(100),
ADD COLUMN     "telegram_bot_token" VARCHAR(255),
ADD COLUMN     "telegram_chat_id" VARCHAR(255),
ADD COLUMN     "time_format" VARCHAR(10) NOT NULL DEFAULT '12h',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "website" VARCHAR(255);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "custom_priority_id" UUID,
ADD COLUMN     "custom_status_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "monitoring_consent_shown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferences" JSONB DEFAULT '{"theme": "system", "language": "en", "defaultDashboardView": "overview", "itemsPerPage": 25}';

-- CreateTable
CREATE TABLE "employee_monitoring" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "first_login_at" TIMESTAMP(3),
    "last_logout_at" TIMESTAMP(3),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_statuses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "order_index" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "task_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_priorities" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "icon" VARCHAR(50),
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "task_priorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "field_type" VARCHAR(20) NOT NULL,
    "options" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "show_in_list" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "field_def_id" UUID NOT NULL,
    "entity_id" UUID NOT NULL,
    "value_text" TEXT,
    "value_number" DECIMAL(15,4),
    "value_date" DATE,
    "value_boolean" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_monitoring_company_id_date_idx" ON "employee_monitoring"("company_id", "date");

-- CreateIndex
CREATE INDEX "employee_monitoring_user_id_date_idx" ON "employee_monitoring"("user_id", "date");

-- CreateIndex
CREATE INDEX "custom_field_values_entity_id_idx" ON "custom_field_values"("entity_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_custom_status_id_fkey" FOREIGN KEY ("custom_status_id") REFERENCES "task_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_custom_priority_id_fkey" FOREIGN KEY ("custom_priority_id") REFERENCES "task_priorities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_monitoring" ADD CONSTRAINT "employee_monitoring_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_monitoring" ADD CONSTRAINT "employee_monitoring_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_statuses" ADD CONSTRAINT "task_statuses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_priorities" ADD CONSTRAINT "task_priorities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_field_def_id_fkey" FOREIGN KEY ("field_def_id") REFERENCES "custom_field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
