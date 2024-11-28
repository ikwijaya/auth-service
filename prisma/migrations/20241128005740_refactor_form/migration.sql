/*
  Warnings:

  - You are about to drop the column `name` on the `Form` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Form` table. All the data in the column will be lost.
  - Added the required column `label` to the `Form` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Form" DROP COLUMN "name",
DROP COLUMN "url",
ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "path" TEXT;
