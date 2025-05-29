-- Add base_fee column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS base_fee DECIMAL(10,2) DEFAULT 0.00 NOT NULL; 