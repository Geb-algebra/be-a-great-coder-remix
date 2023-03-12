/*
  Warnings:

  - You are about to drop the column `fixed_cost` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `prob_class` on the `Order` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fixed_revenue" BIGINT NOT NULL,
    "variable_revenue" BIGINT NOT NULL,
    "investment" BIGINT,
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
