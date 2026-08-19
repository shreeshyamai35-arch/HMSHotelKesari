-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "roomTypeId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PujariSettlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pujariId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "rooms" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "paidByName" TEXT NOT NULL,
    "notes" TEXT,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PujariSettlement_pujariId_fkey" FOREIGN KEY ("pujariId") REFERENCES "Pujari" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoomSale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotId" TEXT NOT NULL,
    "roomId" TEXT,
    "roomType" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceDetail" TEXT,
    "priceSold" REAL NOT NULL DEFAULT 0,
    "pujariId" TEXT,
    "commissionPct" REAL,
    "commissionAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomSale_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "OccupancySlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomSale_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RoomSale_pujariId_fkey" FOREIGN KEY ("pujariId") REFERENCES "Pujari" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RoomSale" ("createdAt", "id", "priceSold", "roomNumber", "roomType", "slotId", "source", "sourceDetail") SELECT "createdAt", "id", "priceSold", "roomNumber", "roomType", "slotId", "source", "sourceDetail" FROM "RoomSale";
DROP TABLE "RoomSale";
ALTER TABLE "new_RoomSale" RENAME TO "RoomSale";
CREATE INDEX "RoomSale_slotId_idx" ON "RoomSale"("slotId");
CREATE INDEX "RoomSale_roomId_idx" ON "RoomSale"("roomId");
CREATE INDEX "RoomSale_pujariId_idx" ON "RoomSale"("pujariId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Room_number_key" ON "Room"("number");

-- CreateIndex
CREATE UNIQUE INDEX "PujariSettlement_pujariId_year_month_key" ON "PujariSettlement"("pujariId", "year", "month");
