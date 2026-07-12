-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OnlineSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pujari" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "commissionPct" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OccupancySlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportDate" DATETIME NOT NULL,
    "slot" TEXT NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    "workingRooms" INTEGER NOT NULL,
    "outOfOrder" INTEGER NOT NULL,
    "roomsSold" INTEGER NOT NULL,
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "submittedById" TEXT,
    "submittedByName" TEXT NOT NULL,
    "notes" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoomSale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotId" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceDetail" TEXT,
    "priceSold" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomSale_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "OccupancySlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_name_key" ON "RoomType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OnlineSource_name_key" ON "OnlineSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Pujari_name_key" ON "Pujari"("name");

-- CreateIndex
CREATE INDEX "OccupancySlot_reportDate_idx" ON "OccupancySlot"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "OccupancySlot_reportDate_slot_key" ON "OccupancySlot"("reportDate", "slot");

-- CreateIndex
CREATE INDEX "RoomSale_slotId_idx" ON "RoomSale"("slotId");
