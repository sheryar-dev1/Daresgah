'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../src/lib/supabase'
import { useAuth } from '../../../src/context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiUser, FiCalendar, FiPhone, FiHome, FiMail, FiEdit } from 'react-icons/fi'
import { FaGraduationCap } from 'react-icons/fa'

type StudentInfo = {
  name: string
  grade: string
  parent_name: string
  parent_email: string
  roll_number?: string
  date_of_birth?: string
  address?: string
  phone?: string
}

export default function StudentProfile() {
  const router = useRouter()
  const { user } = useAuth()
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchStudentProfile()
  }, [user])

  const fetchStudentProfile = async () => {
    if (!user) return

    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (studentError) {
        throw studentError
      }

      if (studentData) {
        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .select('name, email')
          .eq('user_id', user.id)
          .maybeSingle()

        if (parentError) {
          throw parentError
        }

        setStudentInfo({
          name: studentData.name,
          grade: studentData.grade,
          parent_name: parentData?.name || 'Not available',
          parent_email: parentData?.email || 'Not available',
          roll_number: studentData.roll_number,
          date_of_birth: studentData.date_of_birth,
          address: studentData.address,
          phone: studentData.phone
        })
      } else {
        toast.error('No student information found')
        router.push('/register')
      }
    } catch (error) {
      console.error('Error fetching student profile:', error)
      toast.error('Error fetching student profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Card */}
          <div className="w-full md:w-1/3">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-white flex items-center justify-center shadow-lg mb-4">
                  <FaGraduationCap className="text-indigo-600 text-3xl" />
                </div>
                <h2 className="text-xl font-bold text-white">{studentInfo?.name}</h2>
                <p className="text-blue-100">{studentInfo?.grade}</p>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Student ID</h3>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {studentInfo?.roll_number || 'N/A'}
                  </span>
                </div>
                
                <button 
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                  onClick={() => router.push('/profile/edit')}
                >
                  <FiEdit className="text-lg" />
                  Edit Profile
                </button>
              </div>
            </motion.div>
          </div>

          {/* Details Section */}
          <div className="w-full md:w-2/3 space-y-6">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiUser className="text-white" />
                  Personal Information
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FiUser className="text-gray-400" />
                    Full Name
                  </p>
                  <p className="font-medium text-gray-800">{studentInfo?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FaGraduationCap className="text-gray-400" />
                    Grade
                  </p>
                  <p className="font-medium text-gray-800">{studentInfo?.grade}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FiCalendar className="text-gray-400" />
                    Date of Birth
                  </p>
                  <p className="font-medium text-gray-800">
                    {studentInfo?.date_of_birth || 'Not available'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiPhone className="text-white" />
                  Contact Information
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FiPhone className="text-gray-400" />
                    Phone Number
                  </p>
                  <p className="font-medium text-gray-800">
                    {studentInfo?.phone || 'Not available'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FiHome className="text-gray-400" />
                    Address
                  </p>
                  <p className="font-medium text-gray-800">
                    {studentInfo?.address || 'Not available'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Parent Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiUser className="text-white" />
                  Parent Information
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FiUser className="text-gray-400" />
                    Parent Name
                  </p>
                  <p className="font-medium text-gray-800">{studentInfo?.parent_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FiMail className="text-gray-400" />
                    Parent Email
                  </p>
                  <p className="font-medium text-gray-800">{studentInfo?.parent_email}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}