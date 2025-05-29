'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../src/context/AuthContext'

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      const userRole = user.user_metadata?.role
      switch (userRole) {
        case 'admin':
          router.push('/admin')
          break
        case 'teacher':
          router.push('/teacher')
          break
        case 'student':
          router.push('/student')
          break
        case 'parent':
          router.push('/parent')
          break
        default:
          router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [user])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  )
}
