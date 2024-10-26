-- CreateEnum
CREATE TYPE "bullRole" AS ENUM ('ro', 'rw');

-- CreateTable
CREATE TABLE "BullUser" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "role" "bullRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "recordStatus" TEXT NOT NULL,

    CONSTRAINT "BullUser_pkey" PRIMARY KEY ("id")
);
