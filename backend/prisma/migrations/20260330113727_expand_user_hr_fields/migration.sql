/*
  Warnings:

  - A unique constraint covering the columns `[employee_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_number" VARCHAR(50),
ADD COLUMN     "address" TEXT,
ADD COLUMN     "bank_name" VARCHAR(100),
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "blood_group" VARCHAR(10),
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "employee_id" VARCHAR(20),
ADD COLUMN     "employment_type" VARCHAR(20),
ADD COLUMN     "gender" VARCHAR(20),
ADD COLUMN     "github_url" VARCHAR(255),
ADD COLUMN     "ifsc_code" VARCHAR(20),
ADD COLUMN     "linkedin_url" VARCHAR(255),
ADD COLUMN     "pan_number" VARCHAR(20),
ADD COLUMN     "phone_number" VARCHAR(20),
ADD COLUMN     "portfolio_url" VARCHAR(255),
ADD COLUMN     "twitter_url" VARCHAR(255),
ADD COLUMN     "work_location" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");
