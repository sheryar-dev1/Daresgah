'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '../../../src/context/AuthContext'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Teacher {
  id: string
  name: string
}

interface Student {
  id: string
  name: string
  status: string
}

export default function FinanceManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [amount, setAmount] = useState('')
  const [fineAmount, setFineAmount] = useState('')
  const [fineReason, setFineReason] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchTeachers()
    fetchStudents()
  }, [])

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
    if (data && !error) setTeachers(data)
  }

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'approved')
    if (data && !error) setStudents(data)
  }

  const sendTeacherSalary = async () => {
    if (!selectedTeacher || !amount) return
    setLoading(true)
    
    const { error } = await supabase
      .from('teacher_salaries')
      .insert([
        {
          teacher_id: selectedTeacher.id,
          amount: parseFloat(amount),
          status: 'pending',
          sent_by: user?.id,
          sent_date: new Date().toISOString()
        }
      ])

    setLoading(false)
    if (!error) {
      alert('Salary sent successfully!')
      setSelectedTeacher(null)
      setAmount('')
    }
  }

  const generateFeeChallan = async () => {
    if (!selectedStudent || !amount) return
    setLoading(true)

    const totalAmount = parseFloat(amount) + (fineAmount ? parseFloat(fineAmount) : 0)
    
    const { error } = await supabase
      .from('fee_challans')
      .insert([
        {
          student_id: selectedStudent.id,
          amount: totalAmount,
          base_fee: parseFloat(amount),
          fine_amount: fineAmount ? parseFloat(fineAmount) : 0,
          fine_reason: fineReason,
          status: 'pending',
          generated_by: user?.id,
          generated_date: new Date().toISOString()
        }
      ])

    setLoading(false)
    if (!error) {
      alert('Fee challan generated successfully!')
      setSelectedStudent(null)
      setAmount('')
      setFineAmount('')
      setFineReason('')
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Teacher Salary Management</h2>
        <div className="space-y-4">
          <select
            className="w-full p-2 border rounded"
            value={selectedTeacher?.id || ''}
            onChange={(e) => setSelectedTeacher(teachers.find(t => t.id === e.target.value) || null)}
          >
            <option value="">Select Teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Salary Amount"
            className="w-full p-2 border rounded"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            onClick={sendTeacherSalary}
            disabled={loading || !selectedTeacher || !amount}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Send Salary'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Generate Fee Challan</h2>
        <div className="space-y-4">
          <select
            className="w-full p-2 border rounded"
            value={selectedStudent?.id || ''}
            onChange={(e) => setSelectedStudent(students.find(s => s.id === e.target.value) || null)}
          >
            <option value="">Select Student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Base Fee Amount"
            className="w-full p-2 border rounded"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="number"
            placeholder="Fine Amount (if any)"
            className="w-full p-2 border rounded"
            value={fineAmount}
            onChange={(e) => setFineAmount(e.target.value)}
          />
          <textarea
            placeholder="Fine Reason (if any)"
            className="w-full p-2 border rounded"
            value={fineReason}
            onChange={(e) => setFineReason(e.target.value)}
          />
          <button
            onClick={generateFeeChallan}
            disabled={loading || !selectedStudent || !amount}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Generate Fee Challan'}
          </button>
        </div>
      </div>
    </div>
  )
} 