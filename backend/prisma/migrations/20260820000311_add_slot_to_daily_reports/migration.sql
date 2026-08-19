-- AlterTable
ALTER TABLE "DailyReport" ADD COLUMN "slot" TEXT NOT NULL DEFAULT 'SLOT_1000';

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_reportDate_slot_key" ON "DailyReport"("reportDate", "slot");

-- Remove default after backfill
ALTER TABLE "DailyReport" ALTER COLUMN "slot" DROP DEFAULT;
