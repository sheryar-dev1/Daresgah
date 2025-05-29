-- Add is_break and is_free columns to teacher_timetables
ALTER TABLE teacher_timetables
ADD COLUMN IF NOT EXISTS is_break BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE; 