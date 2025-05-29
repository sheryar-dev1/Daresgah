'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../src/lib/supabase'
import { ClockIcon } from '@heroicons/react/24/outline'

export default function PendingPage() {
  const router = useRouter()

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('student_registrations')
        .select('status')
        .eq('user_id', session.user.id)
        .single()

      if (userData?.status === 'approved') {
        router.push('/student')
      }
    }

    checkStatus()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
            <ClockIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Registration Pending
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your registration is currently being reviewed by our administrators. 
            We will notify you once your account has been approved.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Please check your email for updates.
          </p>
        </div>
      </div>
    </div>
  )
} 