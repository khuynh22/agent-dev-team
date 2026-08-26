-- Collapse first_name and last_name into a single full_name column.
ALTER TABLE users ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
UPDATE users SET full_name = first_name || ' ' || last_name;
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
