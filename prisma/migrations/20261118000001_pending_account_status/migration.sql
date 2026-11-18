-- Rescuer accounts require admin approval before they can sign in.
ALTER TYPE "account_status" ADD VALUE IF NOT EXISTS 'pending';
