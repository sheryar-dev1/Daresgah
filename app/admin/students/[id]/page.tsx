'use client'

import { useEffect, useState } from 'react'
import { supabase, supabaseAdmin } from '../../../../src/lib/supabase'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { FiX } from 'react-icons/fi'
import { FiCheck } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { FiLoader } from 'react-icons/fi'
import { FaChild } from 'react-icons/fa'

type StudentRegistration = {
  id: string
  name: string
  email: string
  date_of_birth: string | null
  gender: string | null
  grade: string
  previous_school: string | null
  address: string | null
  phone_number: string | null
  parent_name: string
  parent_email: string
  parent_phone: string | null
  parent_occupation: string | null
  parent_address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  status: string
  created_at: string
}

export default function StudentDetailsPage({ params }: { params: { id: string } }) {
  const [registration, setRegistration] = useState<StudentRegistration | null>(null)
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchRegistration()
  }, [params.id])

  const fetchRegistration = async () => {
    try {
      const { data, error } = await supabase
        .from('student_registrations')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setRegistration(data)
    } catch (error) {
      console.error('Error fetching registration:', error)
      toast.error('Failed to fetch registration details')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (registration: StudentRegistration) => {
    try {
      setApprovingId(registration.id)
      // Generate random password
      const password = Math.random().toString(36).slice(-8)

      // Create student account using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: registration.parent_email,
        password,
        email_confirm: true,
        user_metadata: {
          name: registration.parent_name
        }
      })

      if (authError) throw authError

      // Create student record
      const { error: studentError } = await supabase.from('students').insert([
        {
          user_id: authData.user.id,
          name: registration.name,
          grade: registration.grade,
        },
      ])

      if (studentError) throw studentError

      // Create parent record
      const { error: parentError } = await supabase.from('parents').insert([
        {
          user_id: authData.user.id,
          name: registration.parent_name,
          email: registration.parent_email,
        },
      ])

      if (parentError) throw parentError

      // Assign roles
      await Promise.all([
        supabase.from('user_roles').insert([
          { user_id: authData.user.id, role: 'student' },
          { user_id: authData.user.id, role: 'parent' },
        ]),
      ])

      // Delete registration
      await supabase.from('student_registrations').delete().eq('id', registration.id)

      toast.success('Student approved successfully')
      router.push('/admin/students')
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
      router.push('/admin/students')
    } catch (error) {
      console.error('Error rejecting registration:', error)
      toast.error('Failed to reject registration')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Registration not found</h1>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FaChild className="text-indigo-500" />
            Student Registration Details
          </h1>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {/* Student Information */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Student Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Student Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {registration.date_of_birth ? new Date(registration.date_of_birth).toLocaleDateString() : 'Not provided'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Gender</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.gender || 'Not provided'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Grade</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.grade}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Previous School</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.previous_school || 'Not provided'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.address || 'Not provided'}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.phone_number || 'Not provided'}</dd>
            </div>

            {/* Parent Information */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Parent Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.parent_name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Parent Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.parent_email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Parent Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.parent_phone || 'Not provided'}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Parent Occupation</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.parent_occupation || 'Not provided'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Parent Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.parent_address || 'Not provided'}</dd>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Emergency Contact Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.emergency_contact_name || 'Not provided'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Emergency Contact Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.emergency_contact_phone || 'Not provided'}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Emergency Contact Relation</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{registration.emergency_contact_relation || 'Not provided'}</dd>
            </div>

            {/* Registration Info */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(registration.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                </span>
              </dd>
            </div>
          </dl>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleApprove(registration)}
            disabled={approvingId === registration.id}
            className={`inline-flex items-center px-4 py-2 cursor-pointer border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              approvingId === registration.id ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {approvingId === registration.id ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Approving...
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
            className={`inline-flex items-center px-4 cursor-pointer py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
              approvingId === registration.id ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FiX className="mr-2" />
            Reject
          </motion.button>
        </div>
      </div>
    </div>
  )
} 