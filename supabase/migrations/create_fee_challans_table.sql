-- Create fee_challans table
CREATE TABLE IF NOT EXISTS fee_challans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    base_fee DECIMAL(10,2) NOT NULL,
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    fine_reason TEXT,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    generated_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fee_challans_student_id ON fee_challans(student_id);

-- Enable RLS
ALTER TABLE fee_challans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fee_challans
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON fee_challans
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON fee_challans
    FOR UPDATE
    USING (auth.role() = 'authenticated'); 