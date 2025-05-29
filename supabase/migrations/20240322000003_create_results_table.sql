-- Create student_results table
CREATE TABLE IF NOT EXISTS student_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    total_marks INTEGER NOT NULL,
    obtained_marks INTEGER NOT NULL,
    remarks TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_results_student_id ON student_results(student_id);
CREATE INDEX IF NOT EXISTS idx_student_results_teacher_id ON student_results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_results_subject ON student_results(subject);

-- Enable RLS
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON student_results
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for teachers" ON student_results
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teachers
            WHERE id = teacher_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for teachers who created the result" ON student_results
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM teachers
            WHERE id = teacher_id AND user_id = auth.uid()
        )
    ); 