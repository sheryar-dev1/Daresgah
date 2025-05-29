/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../src/lib/supabase'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type StudentDetails = {
  id: string
  name: string
  grade: string
  created_at: string
  parent_name: string
  parent_email: string
  parent_phone: string | null
  parent_occupation: string | null
  parent_address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
}

export default function StudentDetailsPage({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchStudentDetails()
  }, [params.id])

  const fetchStudentDetails = async () => {
    try {
      console.log('Fetching student with ID:', params.id)
      
      // Get student details
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, name, grade, created_at, user_id')
        .eq('id', params.id)
        .single()

      if (studentError) {
        console.error('Error fetching student:', studentError)
        throw new Error(`Student not found: ${studentError.message}`)
      }

      if (!studentData) {
        throw new Error('Student not found')
      }

      console.log('Found student:', studentData)

      // Get parent details
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('name, email')
        .eq('user_id', studentData.user_id)
        .single()

      if (parentError) {
        console.error('Error fetching parent:', parentError)
        throw new Error(`Parent not found: ${parentError.message}`)
      }

      if (!parentData) {
        throw new Error('Parent not found')
      }

      console.log('Found parent:', parentData)

      // Get emergency contact details from the original registration
      const { data: registrationData, error: registrationError } = await supabase
        .from('student_registrations')
        .select('emergency_contact_name, emergency_contact_phone, emergency_contact_relation')
        .eq('parent_email', parentData.email)
        .maybeSingle()

      if (registrationError) {
        console.error('Error fetching registration:', registrationError)
        // Don't throw error here as registration data is optional
      }

      console.log('Found registration:', registrationData)

      setStudent({
        id: studentData.id,
        name: studentData.name,
        grade: studentData.grade,
        created_at: studentData.created_at,
        parent_name: parentData.name,
        parent_email: parentData.email,
        parent_phone: null,
        parent_occupation: null,
        parent_address: null,
        emergency_contact_name: registrationData?.emergency_contact_name || null,
        emergency_contact_phone: registrationData?.emergency_contact_phone || null,
        emergency_contact_relation: registrationData?.emergency_contact_relation || null,
      })
    } catch (error) {
      console.error('Error in fetchStudentDetails:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch student details')
      toast.error(error instanceof Error ? error.message : 'Failed to fetch student details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-600 mb-4">{error || 'Student not found'}</div>
        <Link 
          href="/admin/approved-students"
          className="text-indigo-600 hover:text-indigo-900"
        >
          Back to Approved Students
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
        <Link 
          href="/admin/approved-students"
          className="text-indigo-600 hover:text-indigo-900"
        >
          Back to Approved Students
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-t border-gray-200">
          <dl>
            {/* Student Information */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Student Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{student.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Grade</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{student.grade}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Approved Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(student.created_at).toLocaleDateString()}
              </dd>
            </div>

            {/* Parent Information */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Parent Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{student.parent_name}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Parent Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{student.parent_email}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Parent Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {student.parent_phone || 'Not provided'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Parent Occupation</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {student.parent_occupation || 'Not provided'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Parent Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {student.parent_address || 'Not provided'}
              </dd>
            </div>

            {/* Emergency Contact */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Emergency Contact Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {student.emergency_contact_name || 'Not provided'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Emergency Contact Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {student.emergency_contact_phone || 'Not provided'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Emergency Contact Relation</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {student.emergency_contact_relation || 'Not provided'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
} 