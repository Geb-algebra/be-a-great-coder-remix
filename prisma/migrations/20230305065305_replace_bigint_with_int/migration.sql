/*
  Warnings:

  - You are about to alter the column `amount` on the `Investment` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `maxInvestment` on the `Capital` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `fixed_revenue` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `investment` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `variable_revenue` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" INTEGER NOT NULL,
    "capitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Investment_capitalId_fkey" FOREIGN KEY ("capitalId") REFERENCES "Capital" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Investment" ("amount", "capitalId", "id", "userId") SELECT "amount", "capitalId", "id", "userId" FROM "Investment";
DROP TABLE "Investment";
ALTER TABLE "new_Investment" RENAME TO "Investment";
CREATE TABLE "new_Capital" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "roiFuncIndex" REAL NOT NULL,
    "maxInvestment" INTEGER NOT NULL
);
INSERT INTO "new_Capital" ("id", "maxInvestment", "name", "roiFuncIndex") SELECT "id", "maxInvestment", "name", "roiFuncIndex" FROM "Capital";
DROP TABLE "Capital";
ALTER TABLE "new_Capital" RENAME TO "Capital";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fixed_revenue" INTEGER NOT NULL,
    "variable_revenue" INTEGER NOT NULL,
    "investment" INTEGER,
    "received_datetime" DATETIME,
    "cleared_datetime" DATETIME,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Order_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("cleared_datetime", "fixed_revenue", "id", "investment", "problemId", "received_datetime", "userId", "variable_revenue") SELECT "cleared_datetime", "fixed_revenue", "id", "investment", "problemId", "received_datetime", "userId", "variable_revenue" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
