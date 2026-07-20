-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingDate" DATETIME NOT NULL,
    "arrivalDate" DATETIME,
    "nights" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "roomsBooked" INTEGER NOT NULL DEFAULT 1,
    "amount" REAL NOT NULL DEFAULT 0,
    "guestName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Booking" ("amount", "bookingDate", "createdAt", "guestName", "id", "roomsBooked", "source", "status") SELECT "amount", "bookingDate", "createdAt", "guestName", "id", "roomsBooked", "source", "status" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_bookingDate_idx" ON "Booking"("bookingDate");
CREATE INDEX "Booking_arrivalDate_idx" ON "Booking"("arrivalDate");
CREATE INDEX "Booking_source_idx" ON "Booking"("source");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
