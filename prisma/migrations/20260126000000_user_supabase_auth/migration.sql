-- AlterTable: User - switch from password to Supabase Auth (supabaseUserId)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "supabaseUserId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Drop password column if it exists (Supabase Auth handles passwords)
ALTER TABLE "User" DROP COLUMN IF EXISTS "password";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseUserId_key" ON "User"("supabaseUserId");
CREATE INDEX IF NOT EXISTS "User_supabaseUserId_idx" ON "User"("supabaseUserId");
