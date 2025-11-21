-- Database migration to increase password column length
-- This migration increases the password column size in users table to accommodate longer Argon2 hashes

-- Increase password column size in users table to accommodate longer Argon2 hashes
-- Argon2 hashes can be longer than 255 characters
ALTER TABLE users 
ALTER COLUMN password TYPE VARCHAR(512);

-- Note: For SQLite, you may need to recreate the table if ALTER COLUMN is not supported
-- SQLite alternative:
-- CREATE TABLE users_new (... password VARCHAR(512) ...);
-- INSERT INTO users_new SELECT * FROM users;
-- DROP TABLE users;
-- ALTER TABLE users_new RENAME TO users;
