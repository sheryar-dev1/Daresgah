/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, supabaseAdmin } from '../../src/lib/supabase'
import toast from 'react-hot-toast'
import {
  UserCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
  AcademicCapIcon,
  PhoneIcon,
  HomeModernIcon,
  BriefcaseIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  BookOpenIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Student Information
    studentName: '',
    studentEmail: '',
    dateOfBirth: '',
    gender: '',
    grade: '',
    previousSchool: '',
    address: '',
    phoneNumber: '',
    
    // Parent Information
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentOccupation: '',
    parentAddress: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    
    // Login Credentials
    password: '',
    confirmPassword: '',
  })

  // Check and create table columns on component mount
  useEffect(() => {
    const checkTableColumns = async () => {
      try {
        // Verify the table exists by doing a simple select
        const { error } = await supabase
          .from('student_registrations')
          .select('*')
          .limit(0)

        if (error) {
          console.error('Error accessing student_registrations table:', error)
          toast.error('Error accessing database. Please contact support.')
        }
      } catch (error) {
        console.error('Error checking table:', error)
        toast.error('Error accessing database. Please contact support.')
      }
    }

    checkTableColumns()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.studentEmail,
        password: formData.password
      })

      if (authError) {
        console.error('Auth error details:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
          stack: authError.stack
        })

        if (authError.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please use a different email or try logging in.')
        } else if (authError.message.includes('Password')) {
          throw new Error('Password must be at least 6 characters long')
        } else {
          throw new Error(`Failed to create account: ${authError.message}`)
        }
      }

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      // Create user role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert([{
          user_id: authData.user.id,
          role: 'student'
        }])

      if (roleError) {
        // If role creation fails, delete the auth user
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        } catch (deleteError) {
          console.error('Error deleting auth user:', deleteError)
        }
        throw new Error(`Failed to create user role: ${roleError.message}`)
      }

      // Then create the registration record using admin client
      const registrationData = {
        name: formData.studentName,
        email: formData.studentEmail,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        grade: formData.grade,
        previous_school: formData.previousSchool || null,
        address: formData.address || null,
        phone_number: formData.phoneNumber || null,
        parent_name: formData.parentName,
        parent_email: formData.parentEmail,
        parent_phone: formData.parentPhone || null,
        parent_occupation: formData.parentOccupation || null,
        parent_address: formData.parentAddress || null,
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_phone: formData.emergencyContactPhone || null,
        emergency_contact_relation: formData.emergencyContactRelation || null,
        status: 'pending',
        user_id: authData.user.id
      }

      // Create student registration using admin client
      const { data: regData, error: regError } = await supabaseAdmin
        .from('student_registrations')
        .insert([registrationData])
        .select()

      if (regError) {
        // If registration fails, delete the auth user
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        } catch (deleteError) {
          console.error('Error deleting auth user:', deleteError)
        }

        console.error('Registration error:', regError)
        throw new Error(`Registration failed: ${regError.message}`)
      }

      // Show success message
      toast.success('Registration submitted successfully! Please wait for admin approval.')
      
      // Clear form
      setFormData({
        studentName: '',
        studentEmail: '',
        dateOfBirth: '',
        gender: '',
        grade: '',
        previousSchool: '',
        address: '',
        phoneNumber: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        parentOccupation: '',
        parentAddress: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        password: '',
        confirmPassword: '',
      })

      // Wait for 3 seconds before redirecting
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 inline-block">
            School Admission Portal
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Complete your registration in 4 simple steps
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Student Information Section */}
          <div className="bg-white shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
              <h3 className="text-xl font-semibold text-gray-900">Student Information</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Student Name */}
              <div className="relative">
                <UserCircleIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Student Name*</label>
                <input
                  type="text"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full  text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                />
              </div>

              {/* Student Email */}
              <div className="relative">
                <EnvelopeIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Student Email*</label>
                <input
                  type="email"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.studentEmail}
                  onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                />
              </div>

              {/* Date of Birth */}
              <div className="relative">
                <CalendarIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Date of Birth*</label>
                <input
                  type="date"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>

              {/* Gender */}
              <div className="relative">
                <IdentificationIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Gender*</label>
                <select
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Grade */}
              <div className="relative">
                <BookOpenIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Grade*</label>
                <select
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                >
                  <option value="">Select Grade</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previous School */}
              <div className="relative">
                <BuildingOfficeIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Previous School</label>
                <input
                  type="text"
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.previousSchool}
                  onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                />
              </div>

              {/* Phone Number */}
              <div className="relative">
                <PhoneIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Phone Number*</label>
                <input
                  type="tel"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>

              {/* Address */}
              <div className="relative sm:col-span-2">
                <MapPinIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Address*</label>
                <textarea
                  required
                  rows={3}
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Parent Information Section */}
          <div className="bg-white shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <BriefcaseIcon className="h-8 w-8 text-indigo-600" />
              <h3 className="text-xl font-semibold text-gray-900">Parent Information</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Parent Name */}
              <div className="relative">
                <UserCircleIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Parent Name*</label>
                <input
                  type="text"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                />
              </div>

              {/* Parent Email */}
              <div className="relative">
                <EnvelopeIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Parent Email*</label>
                <input
                  type="email"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                />
              </div>

              {/* Parent Phone */}
              <div className="relative">
                <PhoneIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Parent Phone*</label>
                <input
                  type="tel"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                />
              </div>

              {/* Parent Occupation */}
              <div className="relative">
                <BriefcaseIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Parent Occupation*</label>
                <input
                  type="text"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.parentOccupation}
                  onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
                />
              </div>

              {/* Parent Address */}
              <div className="relative sm:col-span-2">
                <HomeModernIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Parent Address*</label>
                <textarea
                  required
                  rows={3}
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.parentAddress}
                  onChange={(e) => setFormData({ ...formData, parentAddress: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="bg-white shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-indigo-600" />
              <h3 className="text-xl font-semibold text-gray-900">Emergency Contact</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Emergency Contact Name */}
              <div className="relative">
                <UserCircleIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Contact Name*</label>
                <input
                  type="text"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                />
              </div>

              {/* Emergency Contact Phone */}
              <div className="relative">
                <PhoneIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Contact Phone*</label>
                <input
                  type="tel"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                />
              </div>

              {/* Emergency Contact Relation */}
              <div className="relative sm:col-span-2">
                <ShieldCheckIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Relationship*</label>
                <input
                  type="text"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.emergencyContactRelation}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Login Credentials Section */}
          <div className="bg-white shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <LockClosedIcon className="h-8 w-8 text-indigo-600" />
              <h3 className="text-xl font-semibold text-gray-900">Login Credentials</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Password */}
              <div className="relative">
                <LockClosedIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Password*</label>
                <input
                  type="password"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <LockClosedIcon className="h-5 w-5 absolute left-3 top-12 transform -translate-y-1/2 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700 ml-1">Confirm Password*</label>
                <input
                  type="password"
                  required
                  className="mt-1 pl-10 pr-4 py-3 block w-full text-black rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-12">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            * indicates required fields
          </p>
        </form>
      </div>
    </div>
  )
} 