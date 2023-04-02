-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" INTEGER NOT NULL,
    "capitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Investment_capitalId_fkey" FOREIGN KEY ("capitalId") REFERENCES "Capital" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Investment" ("amount", "capitalId", "id", "userId") SELECT "amount", "capitalId", "id", "userId" FROM "Investment";
DROP TABLE "Investment";
ALTER TABLE "new_Investment" RENAME TO "Investment";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fixedRevenue" INTEGER NOT NULL,
    "variableRevenue" INTEGER NOT NULL,
    "investment" INTEGER,
    "receivedDatetime" DATETIME,
    "clearedDatetime" DATETIME,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Order_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("clearedDatetime", "fixedRevenue", "id", "investment", "problemId", "receivedDatetime", "userId", "variableRevenue") SELECT "clearedDatetime", "fixedRevenue", "id", "investment", "problemId", "receivedDatetime", "userId", "variableRevenue" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
