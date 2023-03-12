/*
  Warnings:

  - You are about to drop the column `cleared_datetime` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `fixed_revenue` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `received_datetime` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `variable_revenue` on the `Order` table. All the data in the column will be lost.
  - Added the required column `fixedRevenue` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variableRevenue` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fixedRevenue" INTEGER NOT NULL,
    "variableRevenue" INTEGER NOT NULL,
    "investment" INTEGER,
    "receivedDatetime" DATETIME,
    "clearedDatetime" DATETIME,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Order_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("id", "investment", "problemId", "userId") SELECT "id", "investment", "problemId", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
