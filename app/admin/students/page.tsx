'use client'

import { useEffect, useState } from 'react'
import { supabase, supabaseAdmin } from '../../../src/lib/supabase'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiBook, FiCheck, FiX, FiLoader} from 'react-icons/fi'
import { FaChild, FaUserTie } from 'react-icons/fa'

type StudentRegistration = {
  id: string
  name: string
  parent_name: string
  parent_email: string
  grade: string
  created_at: string
}

export default function StudentsPage() {
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      console.log('Fetching registrations...')
      
      // First verify admin access
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()
      if (authError) throw authError
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

      if (roleError || !roleData) {
        throw new Error('Unauthorized: Admin access required')
      }

      // Fetch registrations with admin client
      const { data, error } = await supabaseAdmin
        .from('student_registrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      console.log('Fetched registrations:', data)
      setRegistrations(data || [])
    } catch (error) {
      console.error('Error fetching registrations:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (registration: StudentRegistration) => {
    try {
      setApprovingId(registration.id)
      
      // First get the full registration details
      const { data: fullRegistration, error: fetchError } = await supabaseAdmin
        .from('student_registrations')
        .select('*')
        .eq('id', registration.id)
        .single()

      if (fetchError) throw fetchError

      // Get the existing user
      const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      if (userError) throw userError

      const existingUser = users.find(u => u.email === fullRegistration.email)
      if (!existingUser) {
        throw new Error('User not found')
      }

      // Check if student record exists
      const { data: existingStudent, error: checkError } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', existingUser.id)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingStudent) {
        // Update existing student record
        const { error: updateError } = await supabaseAdmin
          .from('students')
          .update({
            name: fullRegistration.name,
            grade: fullRegistration.grade,
          })
          .eq('user_id', existingUser.id)

        if (updateError) throw updateError
      } else {
        // Create new student record
        const { error: studentError } = await supabaseAdmin.from('students').insert([
          {
            user_id: existingUser.id,
            name: fullRegistration.name,
            grade: fullRegistration.grade,
          },
        ])

        if (studentError) throw studentError
      }

      // Check if parent record exists
      const { data: existingParent, error: parentCheckError } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('user_id', existingUser.id)
        .maybeSingle()

      if (parentCheckError) throw parentCheckError

      if (existingParent) {
        // Update existing parent record
        const { error: updateError } = await supabaseAdmin
          .from('parents')
          .update({
            name: fullRegistration.parent_name,
            email: fullRegistration.parent_email,
          })
          .eq('user_id', existingUser.id)

        if (updateError) throw updateError
      } else {
        // Create new parent record
        const { error: parentError } = await supabaseAdmin.from('parents').insert([
          {
            user_id: existingUser.id,
            name: fullRegistration.parent_name,
            email: fullRegistration.parent_email,
          },
        ])

        if (parentError) throw parentError
      }

      // Handle roles using upsert
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert([
          { user_id: existingUser.id, role: 'student' },
          { user_id: existingUser.id, role: 'parent' }
        ], {
          onConflict: 'user_id,role',
          ignoreDuplicates: true
        })

      if (roleError) {
        console.error('Error assigning roles:', roleError)
        // Don't throw error here, just log it and continue
      }

      // Delete registration
      const { error: deleteError } = await supabaseAdmin
        .from('student_registrations')
        .delete()
        .eq('id', registration.id)

      if (deleteError) throw deleteError

      toast.success('Student approved successfully')
      fetchRegistrations()
    } catch (error) {
      console.error('Error approving student:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve student')
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('student_registrations')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Registration rejected')
      fetchRegistrations()
    } catch (error) {
      console.error('Error rejecting registration:', error)
      toast.error('Failed to reject registration')
    }
  }

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-64"
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
      className="space-y-6 p-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="md:text-3xl sm:text-xl text-sm font-bold text-gray-900 dark:text-white">
          Student Registrations
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaChild className="text-indigo-500" />
                    Student
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
                    Parent Email
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiBook className="text-indigo-500" />
                    Grade
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {registrations.map((registration, index) => (
                <motion.tr
                  key={registration.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/admin/students/${registration.id}`)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <FiUser className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {registration.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {registration.parent_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <FiMail className="text-gray-400" />
                      {registration.parent_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {registration.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApprove(registration)}
                        disabled={approvingId === registration.id}
                        className={`inline-flex items-center px-3 py-1 cursor-pointer border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                          approvingId === registration.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {approvingId === registration.id ? (
                          <>
                            <FiLoader className="animate-spin mr-2" />
                            Processing
                          </>
                        ) : (
                          <>
                            <FiCheck className="mr-2" />
                            Approve
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReject(registration.id)}
                        disabled={approvingId === registration.id}
                        className={`inline-flex items-center px-3 py-1 cursor-pointer border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                          approvingId === registration.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <FiX className="mr-2" />
                        Reject
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {registrations.length === 0 && (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FiUser className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">No pending registrations</h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        All student registrations have been processed
                      </p>
                    </div>
                  </td>
                </motion.tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}