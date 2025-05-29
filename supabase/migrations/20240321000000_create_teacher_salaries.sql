-- Create teacher_salaries table if it doesn't exist
CREATE TABLE IF NOT EXISTS teacher_salaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    bonus_amount DECIMAL(10,2) DEFAULT 0.00,
    bonus_description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    sent_by UUID REFERENCES auth.users(id),
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    confirmed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_teacher_id ON teacher_salaries(teacher_id);

-- Enable RLS
ALTER TABLE teacher_salaries ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow admins to perform all operations
CREATE POLICY "Enable all operations for admins" ON teacher_salaries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Allow teachers to view their own salary records
CREATE POLICY "Enable read access for own salary records" ON teacher_salaries
    FOR SELECT
    USING (
        teacher_id IN (
            SELECT id FROM teachers 
            WHERE user_id = auth.uid()
        )
    ); 