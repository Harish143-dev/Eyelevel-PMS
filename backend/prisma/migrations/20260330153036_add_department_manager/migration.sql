/*
  Warnings:

  - You are about to drop the `attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `work_summaries` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `chat_messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_user_id_fkey";

-- DropForeignKey
ALTER TABLE "work_summaries" DROP CONSTRAINT "work_summaries_user_id_fkey";

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "is_edited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "manager_id" UUID;

-- DropTable
DROP TABLE "attendance";

-- DropTable
DROP TABLE "work_summaries";

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
