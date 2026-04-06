/*
  Warnings:

  - A unique constraint covering the columns `[custom_domain]` on the table `companies` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "custom_domain" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "companies_custom_domain_key" ON "companies"("custom_domain");
