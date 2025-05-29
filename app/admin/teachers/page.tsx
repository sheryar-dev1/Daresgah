'use client'

import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../../src/lib/supabase'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPlus, 
  FiLoader, 
  FiTrash2, 
  FiX, 
  FiCheck,
  FiUser,
  FiMail,
  FiCalendar,
  FiKey
} from 'react-icons/fi'
import { FaChalkboardTeacher } from 'react-icons/fa'

type Teacher = {
  id: string
  name: string
  email: string
  created_at: string
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeachers(data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
      toast.error('Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      // First check if email already exists
      const { data: existingTeacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('email', newTeacher.email)
        .single()

      if (existingTeacher) {
        toast.error('A teacher with this email already exists')
        setIsProcessing(false)
        return
      }

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newTeacher.email,
        password: newTeacher.password,
        email_confirm: true
      })

      if (authError) {
        console.error('Auth error:', authError)
        toast.error('Failed to create teacher account')
        setIsProcessing(false)
        return
      }

      // Create teacher record
      const { error: teacherError } = await supabaseAdmin
        .from('teachers')
        .insert([
          {
            name: newTeacher.name,
            email: newTeacher.email,
            user_id: authData.user.id
          }
        ])

      if (teacherError) {
        console.error('Teacher creation error:', teacherError)
        // Clean up auth user if teacher creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        toast.error('Failed to create teacher record')
        setIsProcessing(false)
        return
      }

      // Assign teacher role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert([
          {
            user_id: authData.user.id,
            role: 'teacher'
          }
        ])

      if (roleError) {
        console.error('Role assignment error:', roleError)
        toast.error('Failed to assign teacher role, but account was created')
        setIsProcessing(false)
        return
      }

      toast.success('Teacher added successfully')
      setShowModal(false)
      setNewTeacher({ name: '', email: '', password: '' })
      fetchTeachers()
    } catch (error) {
      console.error('Error adding teacher:', error)
      toast.error('Failed to add teacher')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return
    
    try {
      setIsProcessing(true)
      // First get the user_id from the teacher record
      const { data: teacher, error: fetchError } = await supabaseAdmin
        .from('teachers')
        .select('user_id')
        .eq('id', teacherId)
        .single()

      if (fetchError || !teacher) throw fetchError || new Error('Teacher not found')

      // Delete the teacher record
      const { error: deleteError } = await supabaseAdmin
        .from('teachers')
        .delete()
        .eq('id', teacherId)

      if (deleteError) throw deleteError

      // Delete the auth user
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(teacher.user_id)
      if (authError) throw authError

      toast.success('Teacher deleted successfully')
      fetchTeachers()
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast.error('Failed to delete teacher')
    } finally {
      setIsProcessing(false)
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex flex-col space-y-6">
        <div className="flex flex-wrap justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="md:text-3xl sm:text-xl text-sm font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaChalkboardTeacher className="text-indigo-600 " size={28} />
              Teacher Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage all teachers in your institution
            </p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white sm:px-6 sm:py-3 px-3 py-2 rounded-lg hover:shadow-lg transition-all shadow-md sm:mt-0 mt-2"
          >
            <FiPlus className="h-5 w-5" />
            <span className='md:text-sm text-xs'>Add Teacher</span>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden" >
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-indigo-500" />
                      Name
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
                      Joined On
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {teachers.map((teacher, index) => (
                  <motion.tr
                    key={teacher.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {teacher.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(teacher.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete teacher"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {teachers.length === 0 && (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaChalkboardTeacher className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          No teachers found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                          Add your first teacher to get started
                        </p>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Add Teacher Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Add New Teacher
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setNewTeacher({ name: '', email: '', password: '' })
                    }}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleAddTeacher} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-indigo-500" />
                      Full Name
                    </div>
                  </label>
                  <input
                    type="text"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700"
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <FiMail className="text-indigo-500" />
                      Email Address
                    </div>
                  </label>
                  <input
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700"
                    placeholder="teacher@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <FiKey className="text-indigo-500" />
                      Temporary Password
                    </div>
                  </label>
                  <input
                    type="password"
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700"
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Teacher will be asked to change this on first login
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setNewTeacher({ name: '', email: '', password: '' })
                    }}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    disabled={isProcessing}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:shadow-md transition-all flex items-center justify-center min-w-24"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <FiLoader className="animate-spin mr-2 h-4 w-4" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCheck className="mr-2 h-4 w-4" />
                        Add Teacher
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}