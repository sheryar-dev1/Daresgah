'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://riklldqigkztecsjeofk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpa2xsZHFpZ2t6dGVjc2plb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxOTY3NDksImV4cCI6MjA2MTc3Mjc0OX0.UyLMxghFONxFRxf0XJ7jKaGr5iXUnrzlyppy5kFV5wk'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpa2xsZHFpZ2t6dGVjc2plb2ZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5Njc0OSwiZXhwIjoyMDYxNzcyNzQ5fQ.noU_gOeM5Ss30iGwU_8DzXvCTV1E_6xviSLcyIr9wXo'

// Create two clients - one for regular operations and one for admin operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey) 