-- Database migration to support WebCrypto encryption
-- This migration removes the encryption_salt column (no longer needed)
-- and increases password field size for encrypted payloads

-- Remove encryption_salt column from users table if it exists
-- Note: PostgreSQL syntax - for SQLite, you may need to recreate the table
ALTER TABLE users DROP COLUMN IF EXISTS encryption_salt;

-- Increase password column size in entries table to accommodate encrypted payloads
-- Encrypted passwords include salt, IV, ciphertext, and auth tag, requiring more space
ALTER TABLE entries 
ALTER COLUMN password TYPE VARCHAR(512);

-- Note: For SQLite, you may need to recreate the table if ALTER COLUMN is not supported
-- SQLite alternative:
-- CREATE TABLE entries_new (... password VARCHAR(512) ...);
-- INSERT INTO entries_new SELECT * FROM entries;
-- DROP TABLE entries;
-- ALTER TABLE entries_new RENAME TO entries;
