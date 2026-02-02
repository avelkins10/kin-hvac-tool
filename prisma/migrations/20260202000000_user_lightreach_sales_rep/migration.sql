-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lightreachSalesRepName" TEXT,
ADD COLUMN IF NOT EXISTS "lightreachSalesRepEmail" TEXT,
ADD COLUMN IF NOT EXISTS "lightreachSalesRepPhone" TEXT;
