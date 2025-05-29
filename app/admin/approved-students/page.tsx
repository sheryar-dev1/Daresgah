'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../src/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  FiUser, 
  FiMail, 
  FiBook, 
  FiCalendar,
  FiChevronRight,
  FiUserCheck
} from 'react-icons/fi'
import { FaUserGraduate, FaUserTie } from 'react-icons/fa'

type Student = {
  id: string
  name: string
  grade: string
  parent_name: string
  parent_email: string
  created_at: string
}

export default function ApprovedStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApprovedStudents()
  }, [])

  const fetchApprovedStudents = async () => {
    try {
      setLoading(true)
      // First get all students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, grade, created_at, user_id')
        .order('created_at', { ascending: false })

      if (studentsError) throw studentsError

      // Then get parent information for each student
      const studentsWithParents = await Promise.all(
        studentsData.map(async (student) => {
          const { data: parentData, error: parentError } = await supabase
            .from('parents')
            .select('name, email')
            .eq('user_id', student.user_id)
            .single()

          if (parentError) {
            // console.error('Error fetching parent data:', parentError)
            return null
          }

          return {
            id: student.id,
            name: student.name,
            grade: student.grade,
            parent_name: parentData.name,
            parent_email: parentData.email,
            created_at: student.created_at
          }
        })
      )

      // Filter out any null results and set the state
      setStudents(studentsWithParents.filter(Boolean) as Student[])
    } catch (error) {
      console.error('Error fetching approved students:', error)
      toast.error('Failed to fetch approved students')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-screen"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"
        ></motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:text-3xl sm:text-xl text-sm font-bold text-gray-900 dark:text-white flex items-center gap-3"
        >
          <FiUserCheck className="text-indigo-600" size={28} />
          Approved Students
        </motion.h1>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaUserGraduate className="text-indigo-500" />
                    Student
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiBook className="text-indigo-500" />
                    Grade
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaUserTie className="text-indigo-500" />
                    Parent
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiMail className="text-indigo-500" />
                    Email
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-indigo-500" />
                    Approved Date
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/admin/approved-students/${student.id}`}
                      className="flex items-center group"
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <FiUser className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {student.name}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {student.parent_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-1">
                      <FiMail className="text-gray-400" />
                      {student.parent_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(student.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      href={`/admin/approved-students/${student.id}`}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                    >
                      View <FiChevronRight className="mt-0.5" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
              {students.length === 0 && (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FiUserCheck className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">No approved students yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Approved students will appear here
                      </p>
                    </div>
                  </td>
                </motion.tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}