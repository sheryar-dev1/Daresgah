/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../src/lib/supabase'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../../src/context/AuthContext'


type StudentInfo = {
  name: string
  grade: string
  parent_name: string
  parent_email: string
}

type Attendance = {
  date: string
  status: 'present' | 'absent' | 'late'
}

type Result = {
  subject: string
  marks: number
  total_marks: number
  grade: string
  exam_date: string
}

type Fee = {
  month: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  due_date: string
}

interface DashboardStats {
  attendancePercentage: number
  pendingFees: number
  upcomingExams: number
  currentGPA: number
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    attendancePercentage: 0,
    pendingFees: 0,
    upcomingExams: 0,
    currentGPA: 0,
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchStudentInfo()
  }, [user])

  const fetchStudentInfo = async () => {
    if (!user) return

    try {
      console.log('Fetching student info for user:', user.id)
      
      // First try to get from students table
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, name, grade')
        .eq('user_id', user.id)
        .maybeSingle()

      if (studentError) {
        console.log('Error fetching from students table:', studentError)
        if (studentError.code !== 'PGRST116') {
          throw studentError
        }
      }

      if (studentData) {
        console.log('Found student data:', studentData)
        
        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .select('name, email')
          .eq('user_id', user.id)
          .maybeSingle()

        if (parentError) {
          console.log('Error fetching parent data:', parentError)
          throw parentError
        }

        console.log('Found parent data:', parentData)
        setStudentInfo({
          name: studentData.name,
          grade: studentData.grade,
          parent_name: parentData?.name || 'Not available',
          parent_email: parentData?.email || 'Not available',
        })

        // Now fetch other data since we have a valid student record
        await Promise.all([
          fetchAttendance(studentData.id),
          fetchResults(studentData.id),
          fetchFees(studentData.id)
        ])
        return
      }

      // If not found in students table, try student_registrations
      const { data: registrationData, error: registrationError } = await supabase
        .from('student_registrations')
        .select('name, grade, parent_name, parent_email')
        .eq('user_id', user.id)
        .maybeSingle()

      if (registrationError) {
        console.log('Error fetching from registrations:', registrationError)
        if (registrationError.code !== 'PGRST116') {
          throw registrationError
        }
      }

      if (registrationData) {
        console.log('Found registration data:', registrationData)
        setStudentInfo({
          name: registrationData.name,
          grade: registrationData.grade,
          parent_name: registrationData.parent_name || 'Not available',
          parent_email: registrationData.parent_email || 'Not available',
        })
        toast.success('Your registration is pending approval. You will have access to all features once approved.')
        router.push('/pending')
        return
      }

      // If we get here, no data was found in either table
      console.log('No student data found in any table')
      toast.error('No student information found. Please complete your registration first.')
      router.push('/register')
      
    } catch (error) {
      console.error('Error fetching student information:', error)
      toast.error('Error fetching student information')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async (studentId: string) => {
    try {
      if (!studentId) {
        console.error('No student ID provided')
        return
      }

      const { data, error } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message)
      }

      if (!data) {
        console.log('No attendance records found')
        setAttendance([])
        return
      }

      setAttendance(data)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching attendance data'
      console.error('Error fetching attendance:', errorMessage)
      toast.error(errorMessage)
    }
  }

  const fetchResults = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_results')
        .select('subject, total_marks, obtained_marks, date')
        .eq('student_id', studentId)
        .order('date', { ascending: false })

      if (error) throw error

      // Transform the data to match our Result type
      const transformedResults = data?.map(result => ({
        subject: result.subject,
        marks: result.obtained_marks,
        total_marks: result.total_marks,
        grade: calculateGrade(result.obtained_marks, result.total_marks),
        exam_date: result.date
      })) || []

      setResults(transformedResults)
    } catch (error) {
      console.error('Error fetching results:', error)
      toast.error('Error fetching results')
    }
  }

  const calculateGrade = (obtained: number, total: number): string => {
    const percentage = (obtained / total) * 100
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B'
    if (percentage >= 60) return 'C'
    if (percentage >= 50) return 'D'
    return 'F'
  }

  const fetchFees = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('fee_challans')
        .select('amount, due_date, status')
        .eq('student_id', studentId)
        .order('due_date', { ascending: false })

      if (error) throw error

      // Transform the data to match our Fee type
      const transformedFees = data?.map(fee => ({
        month: new Date(fee.due_date).toLocaleString('default', { month: 'long', year: 'numeric' }),
        amount: fee.amount,
        status: fee.status === 'paid' ? 'paid' : 'pending' as 'paid' | 'pending' | 'overdue',
        due_date: fee.due_date
      })) || []

      setFees(transformedFees)
    } catch (error) {
      console.error('Error fetching fees:', error)
      toast.error('Error fetching fee information')
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch attendance
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', user.id)
          .eq('date', new Date().toISOString().split('T')[0])

        // Fetch fees
        const { data: feesData } = await supabase
          .from('fees')
          .select('amount, paid')
          .eq('student_id', user.id)
          .eq('status', 'pending')

        // Fetch upcoming exams
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(1)

        // Fetch GPA
        const { data: gradesData } = await supabase
          .from('grades')
          .select('grade')
          .eq('student_id', user.id)

        // Calculate stats
        const attendancePercentage = attendanceData?.[0]?.status === 'present' ? 100 : 0
        const pendingFees = feesData?.reduce((sum, fee) => sum + (fee.amount - (fee.paid || 0)), 0) || 0
        const upcomingExams = examsData?.length || 0
        const currentGPA = gradesData?.length ? 
          gradesData.reduce((sum, grade) => sum + grade.grade, 0) / gradesData.length : 0

        setDashboardStats({
          attendancePercentage,
          pendingFees,
          upcomingExams,
          currentGPA,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`${
                  activeTab === 'info'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Information
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`${
                  activeTab === 'attendance'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`${
                  activeTab === 'results'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Results
              </button>
              <button
                onClick={() => setActiveTab('fees')}
                className={`${
                  activeTab === 'fees'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Fees
              </button>
            </nav>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow rounded-lg p-6"
          >
            {activeTab === 'info' && studentInfo && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Student Information</h2>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{studentInfo.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Grade</h3>
                  <p className="mt-1 text-sm text-gray-900">{studentInfo.grade}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Parent Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{studentInfo.parent_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Parent Email</h3>
                  <p className="mt-1 text-sm text-gray-900">{studentInfo.parent_email}</p>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Attendance Record</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendance.map((record, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.status === 'present' ? 'bg-green-100 text-green-800' :
                              record.status === 'absent' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Academic Results</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.subject}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.marks}/{result.total_marks}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.grade}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(result.exam_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Fee Details</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fees.map((fee, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.month}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${fee.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                              fee.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {fee.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(fee.due_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
} 