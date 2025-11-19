-- Database migration to support WebCrypto encryption
-- This migration adds encryption salt column and increases password field size

-- Add encryption_salt column to users table for key derivation
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS encryption_salt VARCHAR(64);

-- Increase password column size in entries table to accommodate encrypted payloads
-- Encrypted passwords include IV, ciphertext, and auth tag, requiring more space
ALTER TABLE entries 
ALTER COLUMN password TYPE VARCHAR(512);

-- Note: For SQLite, you may need to recreate the table if ALTER COLUMN is not supported
-- SQLite alternative:
-- CREATE TABLE entries_new (... password VARCHAR(512) ...);
-- INSERT INTO entries_new SELECT * FROM entries;
-- DROP TABLE entries;
-- ALTER TABLE entries_new RENAME TO entries;