/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiCalendar, 
  FiUser, 
  FiUserCheck, 
  FiUserX, 
  FiUserMinus,
  FiLoader, 
  FiCheckCircle, 
  FiArrowRight,
  FiPlus,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiAlertTriangle,
  FiInfo
} from 'react-icons/fi'

type AttendanceStatus = 'present' | 'absent' | 'leave'

interface Student {
  id: string
  name: string
  status: AttendanceStatus
}

interface Teacher {
  id: string
  name: string
  user_id: string
}

interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  status: AttendanceStatus
  date: string
  grade: string
}

interface StudentAttendanceQueryResult {
  id: string
  student_id: string
  status: AttendanceStatus
  date: string
  students: {
    id: string
    name: string
    grade: string
  }
}

export default function AttendancePage() {
  const [selectedGrade, setSelectedGrade] = useState('1')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filterGrade, setFilterGrade] = useState('1')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [expandedView, setExpandedView] = useState(false)

  useEffect(() => {
    fetchTeacherInfo()
    fetchAttendanceRecords()
  }, [filterGrade, filterDate])

  useEffect(() => {
    if (showModal) {
      fetchStudents()
    }
  }, [selectedGrade, showModal])

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

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      
      if (!filterGrade || !filterDate) {
        toast.error('Invalid grade or date selected')
        return
      }

      const { data, error } = await supabase
        .from('student_attendance')
        .select(`
          id,
          student_id,
          status,
          date,
          students!inner (
            id,
            name,
            grade
          )
        `)
        .eq('date', filterDate)
        .eq('students.grade', filterGrade)
        .returns<StudentAttendanceQueryResult[]>()

      if (error) {
        console.error('Supabase error:', error)
        toast.error(`Database error: ${error.message}`)
        return
      }

      if (!data) {
        console.log('No attendance records found')
        setAttendanceRecords([])
        return
      }

      const formattedRecords = data.map(record => ({
        id: record.id,
        student_id: record.student_id,
        student_name: record.students.name,
        status: record.status,
        date: record.date,
        grade: record.students.grade
      }))

      setAttendanceRecords(formattedRecords)
      
      if (formattedRecords.length === 0) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
            bg-white shadow-lg rounded-lg pointer-events-auto flex p-4`}>
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full">
                <FiInfo className="text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  No attendance records found
                </p>
                <p className="text-sm text-gray-500">
                  Grade {filterGrade} on {new Date(filterDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))
      }

    } catch (error) {
      console.error('Error details:', error)
      toast.error('Failed to fetch attendance records. Please check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .eq('grade', selectedGrade)
        .order('name', { ascending: true })

      if (studentsError) {
        throw studentsError
      }

      if (!studentsData || studentsData.length === 0) {
        toast.error(`No students found in Grade ${selectedGrade}`)
        setStudents([])
        setLoading(false)
        return
      }

      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('student_attendance')
        .select('student_id, status')
        .eq('date', date)
        .in('student_id', studentsData.map(s => s.id))

      if (attendanceError) {
        throw attendanceError
      }

      const attendanceMap = new Map(
        existingAttendance?.map(record => [record.student_id, record.status]) || []
      )

      if (existingAttendance && existingAttendance.length > 0) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
            bg-white shadow-lg rounded-lg pointer-events-auto flex p-4 border-l-4 border-yellow-400`}>
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-full">
                <FiAlertTriangle className="text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  Editing existing records
                </p>
                <p className="text-sm text-gray-500">
                  Attendance exists for {new Date(date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))
      }

      const transformedStudents = studentsData.map((student) => ({
        id: student.id,
        name: student.name,
        status: (attendanceMap.get(student.id) as AttendanceStatus) || 'present'
      }))

      setStudents(transformedStudents)
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(students.map(student =>
      student.id === studentId ? { ...student, status } : student
    ))
  }

  const handleSubmit = async () => {
    if (!currentTeacher) {
      toast.error('Teacher information not found')
      return
    }

    if (students.length === 0) {
      toast.error('No students to mark attendance for')
      return
    }

    try {
      setIsSubmitting(true)
      
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        teacher_id: currentTeacher.id,
        date,
        status: student.status,
        remarks: `Attendance marked by ${currentTeacher.name} for Grade ${selectedGrade}`
      }))

      const { error } = await supabase
        .from('student_attendance')
        .upsert(
          attendanceRecords.map(record => ({
            student_id: record.student_id,
            teacher_id: record.teacher_id,
            date: record.date,
            status: record.status,
            remarks: record.remarks
          })),
          { onConflict: 'student_id,date' }
        )

      if (error) {
        console.error('Error marking attendance:', error)
        toast.error('Failed to mark attendance')
        return
      }
      
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
          bg-white shadow-lg rounded-lg pointer-events-auto flex p-4 border-l-4 border-green-400`}>
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full">
              <FiCheckCircle className="text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                Attendance marked successfully!
              </p>
              <p className="text-sm text-gray-500">
                {students.length} students updated
              </p>
            </div>
          </div>
        </div>
      ))

      setShowModal(false)
      fetchAttendanceRecords()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to submit attendance')
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusOptions = [
    {
      value: 'present',
      label: 'Present',
      icon: FiUserCheck,
      color: 'bg-green-100 text-green-800',
      activeColor: 'bg-green-500 text-white',
      hoverColor: 'hover:bg-green-200'
    },
    {
      value: 'leave',
      label: 'Leave',
      icon: FiUserMinus,
      color: 'bg-blue-100 text-blue-800',
      activeColor: 'bg-blue-500 text-white',
      hoverColor: 'hover:bg-blue-200'
    },
    {
      value: 'absent',
      label: 'Absent',
      icon: FiUserX,
      color: 'bg-red-100 text-red-800',
      activeColor: 'bg-red-500 text-white',
      hoverColor: 'hover:bg-red-200'
    }
  ]

  const statusColors = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    leave: 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="mt-1 text-gray-600">Track and manage student attendance with ease</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <FiPlus className="text-lg" />
            <span>Mark Attendance</span>
          </motion.button>
        </motion.div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-indigo-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Date</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <FiCalendar className="text-indigo-600 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Present Today</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {attendanceRecords.filter(r => r.status === 'present').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiUserCheck className="text-green-600 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Current Grade</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  Grade {filterGrade}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUser className="text-blue-600 text-xl" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Table */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Attendance Records</h2>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-48">
                  <label className="sr-only">Grade</label>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-gray-50"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>
                        Grade {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative w-full md:w-48">
                  <label className="sr-only">Date</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-gray-50"
                  />
                </div>
                <button
                  onClick={() => setExpandedView(!expandedView)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {expandedView ? (
                    <>
                      <FiChevronUp />
                      <span>Compact View</span>
                    </>
                  ) : (
                    <>
                      <FiChevronDown />
                      <span>Detailed View</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {expandedView && (
                    <>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={expandedView ? 4 : 2} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FiLoader className="animate-spin h-8 w-8 text-indigo-600" />
                        <span className="text-gray-600">Loading attendance records...</span>
                      </div>
                    </td>
                  </tr>
                ) : attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={expandedView ? 4 : 2} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FiUserX className="h-8 w-8 text-gray-400" />
                        <span className="text-gray-600">No attendance records found</span>
                        <p className="text-sm text-gray-500">
                          Try selecting a different date or grade
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <FiUser className="text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{record.student_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${statusColors[record.status]}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      {expandedView && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Grade {record.grade}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Add Attendance Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiX className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Grade</label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-gray-50"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1)}>
                          Grade {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiLoader className="animate-spin h-8 w-8 text-indigo-600 mb-4" />
                    <p className="text-gray-600">Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl">
                    <FiUserX className="h-8 w-8 text-gray-400 mb-4" />
                    <p className="text-gray-600">No students found in Grade {selectedGrade}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                      <div className="col-span-2 font-medium text-sm text-gray-700">Student Name</div>
                      <div className="font-medium text-sm text-gray-700 text-center">Status</div>
                      <div className="font-medium text-sm text-gray-700 text-center">Actions</div>
                    </div>
                    {students.map((student) => (
                      <motion.div 
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-4 gap-2 items-center p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all"
                      >
                        <div className="col-span-2 font-medium text-gray-900 truncate">
                          {student.name}
                        </div>
                        <div className="flex justify-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full 
                            ${statusColors[student.status]}`}>
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-center space-x-1">
                          {statusOptions.map((option) => {
                            const Icon = option.icon
                            return (
                              <button
                                key={option.value}
                                onClick={() => handleStatusChange(student.id, option.value as AttendanceStatus)}
                                className={`p-2 rounded-full transition-colors ${student.status === option.value ? 
                                  option.activeColor : 
                                  `${option.color} ${option.hoverColor}`}`}
                                title={option.label}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || students.length === 0}
                    className={`px-5 py-2.5 rounded-lg text-white flex items-center gap-2 transition-colors
                      ${isSubmitting || students.length === 0 ? 
                        'bg-indigo-400 cursor-not-allowed' : 
                        'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        Submit Attendance
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}