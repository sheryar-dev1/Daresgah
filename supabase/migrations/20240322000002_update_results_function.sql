-- Drop existing function if it exists
DROP FUNCTION IF EXISTS add_student_result;

-- Create or replace the function
CREATE OR REPLACE FUNCTION add_student_result(
    p_student_id UUID,
    p_subject TEXT,
    p_teacher_id UUID,
    p_exam_type TEXT,
    p_total_marks INTEGER,
    p_obtained_marks INTEGER,
    p_remarks TEXT,
    p_date TIMESTAMP WITH TIME ZONE
)
RETURNS void AS $$
BEGIN
    -- Insert the result
    INSERT INTO student_results (
        student_id,
        subject,
        teacher_id,
        exam_type,
        total_marks,
        obtained_marks,
        remarks,
        date
    ) VALUES (
        p_student_id,
        p_subject,
        p_teacher_id,
        p_exam_type,
        p_total_marks,
        p_obtained_marks,
        p_remarks,
        p_date
    );
END;
$$ LANGUAGE plpgsql; 