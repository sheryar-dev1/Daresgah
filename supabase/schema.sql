-- Drop all existing tables and policies
DROP TABLE IF EXISTS student_registrations CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS teacher_timetables CASCADE;
-- Create user_roles table
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, role)
);
-- Create teachers table
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);
-- Create students table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  status TEXT DEFAULT 'approved' NOT NULL,
  base_fee DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);
-- Create parents table
CREATE TABLE parents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);
-- Create student_registrations table
CREATE TABLE IF NOT EXISTS student_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    grade TEXT,
    previous_school TEXT,
    address TEXT,
    phone_number TEXT,
    parent_name TEXT NOT NULL,
    parent_email TEXT NOT NULL,
    parent_phone TEXT,
    parent_occupation TEXT,
    parent_address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_registrations_email ON student_registrations(email);
-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_student_registrations_updated_at
    BEFORE UPDATE ON student_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- Create teacher_timetables table
CREATE TABLE teacher_timetables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  class_name TEXT NOT NULL,
  room TEXT NOT NULL,
  is_break BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
-- Create index for faster lookups
CREATE INDEX idx_teacher_timetables_teacher_id ON teacher_timetables(teacher_id);
-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
-- Disable RLS for student_registrations since it's a public registration form
ALTER TABLE student_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_timetables ENABLE ROW LEVEL SECURITY;
-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Allow all operations for authenticated users"
  ON user_roles FOR ALL
  USING (auth.role() = 'authenticated');
-- Teachers policies
CREATE POLICY "Teachers can view their own info"
  ON teachers FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Allow all operations for authenticated users"
  ON teachers FOR ALL
  USING (auth.role() = 'authenticated');
-- Students policies
CREATE POLICY "Students can view their own info"
  ON students FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view all students"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'teacher'
    )
  );
CREATE POLICY "Allow all operations for authenticated users"
  ON students FOR ALL
  USING (auth.role() = 'authenticated');
-- Parents policies
CREATE POLICY "Parents can view their own info"
  ON parents FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Allow all operations for authenticated users"
  ON parents FOR ALL
  USING (auth.role() = 'authenticated');
-- Student registrations policies
DROP POLICY IF EXISTS "Anyone can create registrations" ON student_registrations;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON student_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON student_registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON student_registrations;
DROP POLICY IF EXISTS "Admins can delete registrations" ON student_registrations;

-- Allow anyone to create registrations (needed for the registration form)
CREATE POLICY "Anyone can create registrations"
  ON student_registrations FOR INSERT
  WITH CHECK (true);

-- Allow admins to view all registrations
CREATE POLICY "Admins can view all registrations"
  ON student_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Allow admins to update registrations
CREATE POLICY "Admins can update registrations"
  ON student_registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Allow admins to delete registrations
CREATE POLICY "Admins can delete registrations"
  ON student_registrations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Allow users to view their own registration
CREATE POLICY "Users can view their own registration"
  ON student_registrations FOR SELECT
  USING (
    email = auth.jwt()->>'email'
  );
-- Teacher timetables policies
CREATE POLICY "Teachers can view their own timetable"
  ON teacher_timetables FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage all timetables"
  ON teacher_timetables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
-- Create trigger for updated_at
CREATE TRIGGER update_teacher_timetables_updated_at
    BEFORE UPDATE ON teacher_timetables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();