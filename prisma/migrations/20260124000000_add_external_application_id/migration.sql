-- AlterTable
ALTER TABLE "FinanceApplication" ADD COLUMN "externalApplicationId" TEXT;

-- CreateIndex
CREATE INDEX "FinanceApplication_externalApplicationId_idx" ON "FinanceApplication"("externalApplicationId");
