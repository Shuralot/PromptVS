/*
  Warnings:

  - You are about to drop the column `mode` on the `TestSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TestSession" DROP COLUMN "mode",
ADD COLUMN     "simulationMode" TEXT NOT NULL DEFAULT 'EVOLUTION';
