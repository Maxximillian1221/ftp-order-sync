/*
  Warnings:

  - You are about to drop the column `directory` on the `FtpSettings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FtpSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 21,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FtpSettings" ("createdAt", "host", "id", "password", "port", "shop", "updatedAt", "username") SELECT "createdAt", "host", "id", "password", "port", "shop", "updatedAt", "username" FROM "FtpSettings";
DROP TABLE "FtpSettings";
ALTER TABLE "new_FtpSettings" RENAME TO "FtpSettings";
CREATE UNIQUE INDEX "FtpSettings_shop_key" ON "FtpSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
