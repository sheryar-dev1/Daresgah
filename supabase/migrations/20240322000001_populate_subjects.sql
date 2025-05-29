-- Function to populate subjects for each grade
CREATE OR REPLACE FUNCTION populate_subjects()
RETURNS void AS $$
DECLARE
    grade TEXT;
    subject TEXT;
BEGIN
    -- Delete existing subjects
    DELETE FROM subjects;
    
    -- For grades 1-5
    FOR grade IN 1..5 LOOP
        INSERT INTO subjects (name, class) VALUES
            ('Urdu', 'Grade ' || grade),
            ('English', 'Grade ' || grade),
            ('Mathematics', 'Grade ' || grade),
            ('General Science', 'Grade ' || grade),
            ('Islamiat', 'Grade ' || grade),
            ('Social Studies', 'Grade ' || grade);
    END LOOP;
    
    -- For grades 6-8
    FOR grade IN 6..8 LOOP
        INSERT INTO subjects (name, class) VALUES
            ('Urdu', 'Grade ' || grade),
            ('English', 'Grade ' || grade),
            ('Mathematics', 'Grade ' || grade),
            ('General Science', 'Grade ' || grade),
            ('Islamiat', 'Grade ' || grade),
            ('Social Studies', 'Grade ' || grade),
            ('Computer Science', 'Grade ' || grade);
    END LOOP;
    
    -- For grades 9-12
    FOR grade IN 9..12 LOOP
        INSERT INTO subjects (name, class) VALUES
            ('Urdu', 'Grade ' || grade),
            ('English', 'Grade ' || grade),
            ('Mathematics', 'Grade ' || grade),
            ('Physics', 'Grade ' || grade),
            ('Chemistry', 'Grade ' || grade),
            ('Biology', 'Grade ' || grade),
            ('Computer Science', 'Grade ' || grade),
            ('Islamiat', 'Grade ' || grade),
            ('Pakistan Studies', 'Grade ' || grade);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT populate_subjects(); 