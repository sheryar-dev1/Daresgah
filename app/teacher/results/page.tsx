/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { 
  FiBook,
  FiUser,
  FiAward,
  FiLoader,
  FiCheckCircle,
  FiPlus,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiSearch
} from 'react-icons/fi'

interface Student {
  id: string
  name: string
  grade: string
}

interface Teacher {
  id: string
  name: string
  user_id: string
}

interface ResultForm {
  studentId: string
  subject: string
  examType: string
  totalMarks: number
  obtainedMarks: number
  remarks: string
}

interface Result {
  id: string
  student_name: string
  subject: string
  exam_type: string
  total_marks: number
  obtained_marks: number
  remarks: string
  date: string
  percentage: number
  grade: string
}

interface DatabaseResult {
  id: string
  subject: string
  exam_type: string
  total_marks: number
  obtained_marks: number
  remarks: string | null
  date: string
  students: {
    name: string
    grade: string
  }
}

const getSubjectsForGrade = (grade: string) => {
  const gradeNum = parseInt(grade.replace(/\D/g, ''))
  
  if (gradeNum <= 5) {
    return ['Urdu', 'English', 'Mathematics', 'General Science', 'Islamiat', 'Social Studies']
  } else if (gradeNum <= 8) {
    return ['Urdu', 'English', 'Mathematics', 'General Science', 'Islamiat', 'Social Studies', 'Computer Science']
  } else {
    return ['Urdu', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Islamiat', 'Pakistan Studies']
  }
}

const ExamTypeBadge = ({ type }: { type: string }) => {
  const getColor = () => {
    switch (type.toLowerCase()) {
      case 'midterm': return 'bg-blue-100 text-blue-800'
      case 'final': return 'bg-purple-100 text-purple-800'
      case 'quiz': return 'bg-green-100 text-green-800'
      case 'assignment': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`}>
      {type}
    </span>
  )
}

export default function ResultsPage() {
  const [selectedGrade, setSelectedGrade] = useState('1')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null)
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{key: string; direction: 'ascending' | 'descending'} | null>(null)
  
  const [resultForm, setResultForm] = useState<ResultForm>({
    studentId: '',
    subject: '',
    examType: 'midterm',
    totalMarks: 100,
    obtainedMarks: 0,
    remarks: ''
  })

  useEffect(() => {
    fetchTeacherInfo()
    fetchStudents()
    fetchResults()
    setAvailableSubjects(getSubjectsForGrade(selectedGrade))
  }, [selectedGrade])

  const fetchTeacherInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        toast.error('Please login first')
        return
      }

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id, name, user_id')
        .eq('user_id', session.user.id)
        .single()

      if (teacherError || !teacherData) {
        console.error('Error fetching teacher:', teacherError)
        toast.error('Could not fetch teacher information')
        return
      }

      setCurrentTeacher(teacherData)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch teacher information')
    }
  }

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, grade')
        .eq('grade', selectedGrade)
        .order('name')

      if (error) throw error
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchResults = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('student_results')
        .select(`
          id,
          subject,
          exam_type,
          total_marks,
          obtained_marks,
          remarks,
          date,
          students!inner(name, grade)
        `)
        .eq('students.grade', selectedGrade)
        .returns<DatabaseResult[]>()

      if (error) throw error

      const formattedResults: Result[] = data.map(result => ({
        id: result.id,
        student_name: result.students.name,
        subject: result.subject,
        exam_type: result.exam_type,
        total_marks: result.total_marks,
        obtained_marks: result.obtained_marks,
        remarks: result.remarks || '',
        date: new Date(result.date).toLocaleDateString(),
        percentage: (result.obtained_marks / result.total_marks) * 100,
        grade: result.students.grade
      }))

      setResults(formattedResults)
    } catch (error) {
      console.error('Error fetching results:', error)
      toast.error('Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTeacher) {
      toast.error('Teacher information not found')
      return
    }

    try {
      setIsSubmitting(true)

      const { error } = await supabase.rpc('add_student_result', {
        p_student_id: resultForm.studentId,
        p_subject: resultForm.subject,
        p_teacher_id: currentTeacher.id,
        p_exam_type: resultForm.examType,
        p_total_marks: resultForm.totalMarks,
        p_obtained_marks: resultForm.obtainedMarks,
        p_remarks: resultForm.remarks,
        p_date: new Date().toISOString()
      })

      if (error) {
        console.error('Error adding result:', error)
        toast.error('Failed to add result')
        return
      }

      toast.success('Result added successfully!', {
        icon: <FiCheckCircle className="text-green-500" />,
        position: 'top-right',
        style: {
          background: '#f0fdf4',
          color: '#15803d',
          border: '1px solid #bbf7d0'
        }
      })

      setShowModal(false)
      setResultForm({
        studentId: '',
        subject: '',
        examType: 'midterm',
        totalMarks: 100,
        obtainedMarks: 0,
        remarks: ''
      })
      
      fetchResults()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to add result', {
        position: 'top-right',
        style: {
          background: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecaca'
        }
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800'
    if (percentage >= 60) return 'bg-blue-100 text-blue-800'
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }
  const modalStyles = `
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    z-index: 1001;
    max-width: 90%;
    width: 500px;
  }
`;

// In your component, add this useEffect to inject the styles
useEffect(() => {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = modalStyles;
  document.head.appendChild(styleElement);
  
  return () => {
    document.head.removeChild(styleElement);
  };
}, []);

  const sortedResults = React.useMemo(() => {
    if (!sortConfig) return results
    
    return [...results].sort((a, b) => {
      // @ts-ignore
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1
      }
      // @ts-ignore
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1
      }
      return 0
    })
  }, [results, sortConfig])

  const filteredResults = sortedResults.filter(result =>
    result.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Results Management</h1>
            <p className="mt-1 text-gray-600">Track and manage student academic performance</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              Add Result
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="focus:ring-indigo-500 outline-none focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="Search students or subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-500" />
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 outline-none sm:text-sm py-2"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    Grade {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <FiBook className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Results</h3>
                <p className="text-2xl font-semibold text-gray-900">{results.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FiUser className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Students</h3>
                <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FiAward className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Top Average</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {results.length > 0 
                    ? `${(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length).toFixed(1)}%` 
                    : '0%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <FiLoader className="animate-spin h-8 w-8 text-indigo-600 mb-3" />
            <p className="text-gray-600">Loading results data...</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('student_name')}
                    >
                      <div className="flex items-center">
                        Student
                        {sortConfig?.key === 'student_name' && (
                          sortConfig.direction === 'ascending' ? 
                            <FiChevronUp className="ml-1 h-4 w-4" /> : 
                            <FiChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('subject')}
                    >
                      <div className="flex items-center">
                        Subject
                        {sortConfig?.key === 'subject' && (
                          sortConfig.direction === 'ascending' ? 
                            <FiChevronUp className="ml-1 h-4 w-4" /> : 
                            <FiChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam Type
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('percentage')}
                    >
                      <div className="flex items-center">
                        Score
                        {sortConfig?.key === 'percentage' && (
                          sortConfig.direction === 'ascending' ? 
                            <FiChevronUp className="ml-1 h-4 w-4" /> : 
                            <FiChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        {sortConfig?.key === 'date' && (
                          sortConfig.direction === 'ascending' ? 
                            <FiChevronUp className="ml-1 h-4 w-4" /> : 
                            <FiChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                            {result.student_name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{result.student_name}</div>
                            <div className="text-sm text-gray-500">Grade {result.grade}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{result.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ExamTypeBadge type={result.exam_type} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 mr-2">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getGradeColor(result.percentage).replace('text', 'bg')}`}
                                style={{ width: `${Math.min(100, result.percentage)}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getGradeColor(result.percentage)}`}>
                              {result.percentage.toFixed(1)}%
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({result.obtained_marks}/{result.total_marks})
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {result.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FiBook className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-gray-500">Try changing your search or filter criteria</p>
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                Add New Result
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Result Modal */}
      {/* {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Result</h3>
                    <p className="mt-1 text-sm text-gray-500">Record student performance for assessments</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="grade" className="block text-sm font-medium text-gray-700">Grade</label>
                      <select
                        id="grade"
                        value={selectedGrade}
                        onChange={(e) => {
                          setSelectedGrade(e.target.value)
                          setResultForm({ ...resultForm, subject: '' })
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1)}>
                            Grade {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="student" className="block text-sm font-medium text-gray-700">Student</label>
                      <select
                        id="student"
                        value={resultForm.studentId}
                        onChange={(e) => setResultForm({ ...resultForm, studentId: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                      >
                        <option value="">Select Student</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                      <select
                        id="subject"
                        value={resultForm.subject}
                        onChange={(e) => setResultForm({ ...resultForm, subject: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                      >
                        <option value="">Select Subject</option>
                        {availableSubjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="examType" className="block text-sm font-medium text-gray-700">Exam Type</label>
                      <select
                        id="examType"
                        value={resultForm.examType}
                        onChange={(e) => setResultForm({ ...resultForm, examType: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                      >
                        <option value="midterm">Midterm</option>
                        <option value="final">Final</option>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700">Total Marks</label>
                      <input
                        type="number"
                        id="totalMarks"
                        value={resultForm.totalMarks}
                        onChange={(e) => setResultForm({ ...resultForm, totalMarks: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                        min="0"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="obtainedMarks" className="block text-sm font-medium text-gray-700">Obtained Marks</label>
                      <input
                        type="number"
                        id="obtainedMarks"
                        value={resultForm.obtainedMarks}
                        onChange={(e) => setResultForm({ ...resultForm, obtainedMarks: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                        min="0"
                        max={resultForm.totalMarks}
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks</label>
                      <textarea
                        id="remarks"
                        rows={3}
                        value={resultForm.remarks}
                        onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Processing...
                    </>
                  ) : 'Add Result'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )} */}

{showModal && (
  <div className="modal-overlay" onClick={() => setShowModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold">Add New Result</h2>
        <button 
          onClick={() => setShowModal(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <FiX size={24} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="grade" className="block text-sm font-medium text-gray-700">Grade</label>
                      <select
                        id="grade"
                        value={selectedGrade}
                        onChange={(e) => {
                          setSelectedGrade(e.target.value)
                          setResultForm({ ...resultForm, subject: '' })
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1)}>
                            Grade {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="student" className="block text-sm font-medium text-gray-700">Student</label>
                      <select
                        id="student"
                        value={resultForm.studentId}
                        onChange={(e) => setResultForm({ ...resultForm, studentId: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                      >
                        <option value="">Select Student</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                      <select
                        id="subject"
                        value={resultForm.subject}
                        onChange={(e) => setResultForm({ ...resultForm, subject: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                      >
                        <option value="">Select Subject</option>
                        {availableSubjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="examType" className="block text-sm font-medium text-gray-700">Exam Type</label>
                      <select
                        id="examType"
                        value={resultForm.examType}
                        onChange={(e) => setResultForm({ ...resultForm, examType: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                      >
                        <option value="midterm">Midterm</option>
                        <option value="final">Final</option>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700">Total Marks</label>
                      <input
                        type="number"
                        id="totalMarks"
                        value={resultForm.totalMarks}
                        onChange={(e) => setResultForm({ ...resultForm, totalMarks: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                        min="0"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="obtainedMarks" className="block text-sm font-medium text-gray-700">Obtained Marks</label>
                      <input
                        type="number"
                        id="obtainedMarks"
                        value={resultForm.obtainedMarks}
                        onChange={(e) => setResultForm({ ...resultForm, obtainedMarks: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                        required
                        min="0"
                        max={resultForm.totalMarks}
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks</label>
                      <textarea
                        id="remarks"
                        rows={3}
                        value={resultForm.remarks}
                        onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </form>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse mt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Processing...
                    </>
                  ) : 'Add Result'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
      {/* Your form content here */}
    
    </div>
  </div>
)}
    </div>
  )
}