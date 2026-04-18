-- CreateTable
CREATE TABLE "Interaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "query" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT,
    "latency" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provider" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "stack" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
