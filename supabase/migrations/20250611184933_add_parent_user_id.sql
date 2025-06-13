-- Add parent_user_id column to student_registrations table
ALTER TABLE student_registrations
ADD COLUMN parent_user_id UUID REFERENCES auth.users(id);

-- Add index for better query performance
CREATE INDEX idx_student_registrations_parent_user_id ON student_registrations(parent_user_id);
