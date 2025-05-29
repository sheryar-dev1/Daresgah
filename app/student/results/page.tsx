'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../src/lib/supabase'

interface ResultSummary {
  exam_type: string
  total_marks: number
  obtained_marks: number
  percentage: number
  remarks: string
  exam_id: string
}

export default function StudentResults() {
  const [results, setResults] = useState<ResultSummary[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // First get the student ID
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (studentError) {
          console.error('Error fetching student data:', studentError)
          return
        }

        if (!studentData) {
          console.error('Student not found')
          return
        }

        // Get all student results
        const { data, error } = await supabase
          .from('student_results')
          .select(`
            id,
            exam_type,
            total_marks,
            obtained_marks,
            remarks,
            date
          `)
          .eq('student_id', studentData.id)
          .order('date', { ascending: false })

        if (error) throw error

        // Group results by exam type and calculate totals
        const groupedResults = data.reduce((acc: { [key: string]: ResultSummary }, curr) => {
          if (!acc[curr.exam_type]) {
            acc[curr.exam_type] = {
              exam_type: curr.exam_type,
              total_marks: 0,
              obtained_marks: 0,
              percentage: 0,
              remarks: '',
              exam_id: curr.id
            }
          }
          acc[curr.exam_type].total_marks += curr.total_marks
          acc[curr.exam_type].obtained_marks += curr.obtained_marks
          acc[curr.exam_type].percentage = (acc[curr.exam_type].obtained_marks / acc[curr.exam_type].total_marks) * 100
          
          // Generate overall remarks based on percentage
          const percentage = acc[curr.exam_type].percentage
          if (percentage >= 80) {
            acc[curr.exam_type].remarks = 'Excellent'
          } else if (percentage >= 70) {
            acc[curr.exam_type].remarks = 'Very Good'
          } else if (percentage >= 60) {
            acc[curr.exam_type].remarks = 'Good'
          } else if (percentage >= 50) {
            acc[curr.exam_type].remarks = 'Satisfactory'
          } else {
            acc[curr.exam_type].remarks = 'Needs Improvement'
          }
          
          return acc
        }, {})

        setResults(Object.values(groupedResults))
      } catch (error) {
        console.error('Error fetching results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [router])

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Results</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exam Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Marks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Obtained Marks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remarks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result) => (
              <tr 
                key={result.exam_type}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/student/results/${result.exam_id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{result.exam_type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{result.total_marks}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{result.obtained_marks}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${getGradeColor(result.percentage)}`}>
                    {result.percentage.toFixed(2)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{result.remarks}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/student/results/${result.exam_id}`)
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 