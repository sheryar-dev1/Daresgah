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
}

type ParentInfo = {
  name: string
  email: string
}

export default function ParentDashboard() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchInfo()
  }, [user])

  const fetchInfo = async () => {
    if (!user) return

    try {
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('name, email')
        .eq('user_id', user.id)
        .single()

      if (parentError) throw parentError

      setParentInfo({
        name: parentData.name,
        email: parentData.email,
      })

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('name, grade')
        .eq('user_id', user.id)
        .single()

      if (studentError) throw studentError

      setStudentInfo({
        name: studentData.name,
        grade: studentData.grade,
      })
    } catch {
      toast.error('Error fetching information')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Parent Dashboard</h1>
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Parent Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white shadow rounded-lg p-6"
            >
              <h2 className="text-lg font-medium text-gray-900 mb-4">Parent Information</h2>
              {parentInfo && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{parentInfo.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-sm text-gray-900">{parentInfo.email}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Student Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white shadow rounded-lg p-6"
            >
              <h2 className="text-lg font-medium text-gray-900 mb-4">Student Information</h2>
              {studentInfo && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{studentInfo.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Grade</h3>
                    <p className="mt-1 text-sm text-gray-900">{studentInfo.grade}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
} 