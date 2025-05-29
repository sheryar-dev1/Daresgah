'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../src/lib/supabase'
import { FaAward, FaChartLine, FaSchool } from 'react-icons/fa'
import { FaTrophy } from 'react-icons/fa'
import { GiGraduateCap } from 'react-icons/gi'
import { use } from 'react'

interface SubjectResult {
  subject: string
  total_marks: number
  obtained_marks: number
  percentage: number
  remarks: string
}

interface StudentInfo {
  name: string
  grade: string
}

interface ExamInfo {
  exam_type: string
  date: string
  total_marks: number
  obtained_marks: number
  percentage: number
  remarks: string
}

export default function ResultDetails({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true)
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null)
  const [subjectResults, setSubjectResults] = useState<SubjectResult[]>([])
  const router = useRouter()
  const resolvedParams = use(params)

  useEffect(() => {
    const fetchResultDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Get student information
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id, name, grade')
          .eq('user_id', user.id)
          .single()

        if (studentError) {
          console.error('Error fetching student data:', studentError)
          return
        }

        if (studentData) {
          setStudentInfo({
            name: studentData.name,
            grade: studentData.grade
          })
        }

        // Get exam information
        const { data: examData, error: examError } = await supabase
          .from('student_results')
          .select('*')
          .eq('id', resolvedParams.id)
          .single()

        if (examError) {
          console.error('Error fetching exam data:', examError)
          return
        }

        if (examData) {
          // Get all subject results for this exam type
          const { data: subjectData, error: subjectError } = await supabase
            .from('student_results')
            .select('*')
            .eq('exam_type', examData.exam_type)
            .eq('student_id', studentData.id)

          if (subjectError) {
            console.error('Error fetching subject results:', subjectError)
            return
          }

          if (subjectData) {
            // Calculate totals from all subjects
            const totalMarks = subjectData.reduce((sum, subject) => sum + subject.total_marks, 0)
            const obtainedMarks = subjectData.reduce((sum, subject) => sum + subject.obtained_marks, 0)
            const percentage = (obtainedMarks / totalMarks) * 100

            // Generate overall remarks based on percentage
            let overallRemarks = ''
            if (percentage >= 80) {
              overallRemarks = 'Excellent'
            } else if (percentage >= 70) {
              overallRemarks = 'Very Good'
            } else if (percentage >= 60) {
              overallRemarks = 'Good'
            } else if (percentage >= 50) {
              overallRemarks = 'Satisfactory'
            } else {
              overallRemarks = 'Needs Improvement'
            }

            setExamInfo({
              exam_type: examData.exam_type,
              date: examData.date,
              total_marks: totalMarks,
              obtained_marks: obtainedMarks,
              percentage: percentage,
              remarks: overallRemarks
            })

            const formattedSubjectResults = subjectData.map(result => ({
              subject: result.subject,
              total_marks: result.total_marks,
              obtained_marks: result.obtained_marks,
              percentage: (result.obtained_marks / result.total_marks) * 100,
              remarks: result.remarks
            }))
            setSubjectResults(formattedSubjectResults)
          }
        }
      } catch (error) {
        console.error('Error fetching result details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResultDetails()
  }, [resolvedParams.id, router])

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

  if (!studentInfo || !examInfo) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Result not found</h2>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Result Card Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FaSchool className="text-2xl" />
                <h1 className="text-2xl font-bold">Daresgah Education System</h1>
              </div>
              <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                OFFICIAL RESULT
              </div>
            </div>
            <p className="mt-2 text-indigo-100">Daresgah, Kano</p>
          </div>

        {/* Student Information */}
      <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-indigo-100 border-4 border-white shadow-md flex items-center justify-center">
                  <GiGraduateCap className="text-3xl text-indigo-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white rounded-full p-1">
                  {examInfo.percentage >= 80 ? (
                    <FaTrophy className="text-amber-400" />
                  ) : examInfo.percentage >= 70 ? (
                    <FaAward className="text-blue-400" />
                  ) : (
                    <FaChartLine className="text-gray-400" />
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{studentInfo.name}</h2>
                <div className="flex flex-wrap gap-3 mt-2">
                  <div className="bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium text-indigo-700">
                    Grade: {studentInfo.grade}
                  </div>
                  <div className="bg-purple-50 px-3 py-1 rounded-full text-sm font-medium text-purple-700">
                    Exam: {examInfo.exam_type}
                  </div>
                  <div className="bg-amber-50 px-3 py-1 rounded-full text-sm font-medium text-amber-700">
                    Date: {new Date(examInfo.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Subject-wise Results */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjectResults.map((subject) => (
                  <tr key={subject.subject}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{subject.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subject.total_marks}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subject.obtained_marks}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getGradeColor(subject.percentage)}`}>
                        {subject.percentage.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subject.remarks}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mx-5">
              {/* Performance Cards */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Overall Percentage</h4>
                    <div className="mt-2 flex items-end">
                      <span className={`text-4xl font-bold ${examInfo.percentage >= 80 ? 'text-emerald-600' : 
                                     examInfo.percentage >= 70 ? 'text-blue-600' : 
                                     examInfo.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {examInfo.percentage.toFixed(1)}%
                      </span>
                      <span className="ml-2 text-sm text-gray-500 mb-1">of {examInfo.total_marks} total marks</span>
                    </div>
                  </div>
                  {examInfo.percentage >= 80 ? (
                    <FaTrophy className="text-3xl text-amber-400" />
                  ) : examInfo.percentage >= 70 ? (
                    <FaAward className="text-3xl text-blue-400" />
                  ) : (
                    <FaChartLine className="text-3xl text-gray-400" />
                  )}
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Performance Scale</span>
                    <span>{examInfo.remarks}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full bg-gradient-to-r ${examInfo.percentage >= 80 ? 'from-emerald-400 to-emerald-600' : 
                                 examInfo.percentage >= 70 ? 'from-blue-400 to-blue-600' : 
                                 examInfo.percentage >= 60 ? 'from-amber-400 to-amber-600' : 'from-red-400 to-red-600'}`} 
                      style={{ width: `${examInfo.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              
              {/* Marks Breakdown */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Marks Breakdown</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">Total Obtained Marks</span>
                      <span className="font-bold text-gray-900">{examInfo.obtained_marks}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600" 
                        style={{ width: `${(examInfo.obtained_marks/examInfo.total_marks)*100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">Percentage Classification</span>
                      <span className={`font-bold ${examInfo.percentage >= 80 ? 'text-emerald-600' : 
                                      examInfo.percentage >= 70 ? 'text-blue-600' : 
                                      examInfo.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {examInfo.remarks}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${examInfo.percentage >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
                                     examInfo.percentage >= 70 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 
                                     examInfo.percentage >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`} 
                        style={{ width: `${examInfo.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Performance Benchmark</span>
                      <span className="flex items-center">
                        {examInfo.percentage >= 80 ? (
                          <>
                            <span className="text-emerald-600">Top Performer</span>
                            <FaTrophy className="ml-1 text-amber-400 text-sm" />
                          </>
                        ) : examInfo.percentage >= 70 ? (
                          <>
                            <span className="text-blue-600">Above Average</span>
                            <FaAward className="ml-1 text-blue-400 text-sm" />
                          </>
                        ) : examInfo.percentage >= 60 ? (
                          <>
                            <span className="text-amber-600">Average</span>
                            <FaChartLine className="ml-1 text-amber-400 text-sm" />
                          </>
                        ) : (
                          <>
                            <span className="text-red-600">Below Average</span>
                            <FaChartLine className="ml-1 text-red-400 text-sm" />
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100 mx-5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Performance Insights</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <div className="text-indigo-600 font-bold text-2xl">
                    {subjectResults.length}
                  </div>
                  <div className="text-xs text-indigo-800 mt-1">Subjects Taken</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg text-center">
                  <div className="text-emerald-600 font-bold text-2xl">
                    {subjectResults.filter(s => s.percentage >= 80).length}
                  </div>
                  <div className="text-xs text-emerald-800 mt-1">Excellent Subjects</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-blue-600 font-bold text-2xl">
                    {subjectResults.filter(s => s.percentage >= 70 && s.percentage < 80).length}
                  </div>
                  <div className="text-xs text-blue-800 mt-1">Strong Subjects</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <div className="text-amber-600 font-bold text-2xl">
                    {subjectResults.filter(s => s.percentage < 60).length}
                  </div>
                  <div className="text-xs text-amber-800 mt-1">Needs Improvement</div>
                </div>
              </div>
            </div>
        {/* Overall Result */}
        {/* <div className="p-6 bg-gray-50 border-t mt-4 border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Marks</p>
              <p className="text-lg font-semibold text-gray-900">
                {examInfo.total_marks}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Obtained Marks</p>
              <p className="text-lg font-semibold text-gray-900">
                {examInfo.obtained_marks}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Percentage</p>
              <p className={`text-lg font-semibold ${getGradeColor(examInfo.percentage)}`}>
                {examInfo.percentage.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Overall Remarks</p>
              <p className="text-lg font-semibold text-gray-900">
                {examInfo.remarks}
              </p>
            </div>
          </div>
        </div> */}
           <div className="px-8 py-4 bg-gray-100 text-center m-5">
            <p className="text-sm text-gray-600">
              This is an official document. Any tampering will be considered a violation of school policy.
            </p>
            <div className="mt-3 flex justify-center space-x-4">
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Print Result
              </button>
              <button className="px-6 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                Download PDF
              </button>
            </div>
          </div>
      </div>
    </div>
  )
} 