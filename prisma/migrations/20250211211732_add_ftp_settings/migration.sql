-- CreateTable
CREATE TABLE "FtpSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 21,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "directory" TEXT NOT NULL DEFAULT '/',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "FtpSettings_shop_key" ON "FtpSettings"("shop");
