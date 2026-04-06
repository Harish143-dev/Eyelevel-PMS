/*
  Warnings:

  - The values [user,super_admin] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('admin', 'manager', 'hr', 'employee');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE 
    WHEN "role" = 'super_admin' THEN 'admin'::text::"Role_new"
    WHEN "role" = 'admin' THEN 'manager'::text::"Role_new"
    WHEN "role" = 'manager' THEN 'manager'::text::"Role_new"
    WHEN "role" = 'user' THEN 'employee'::text::"Role_new"
    ELSE "role"::text::"Role_new"
  END
);
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'employee';
COMMIT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'employee';
