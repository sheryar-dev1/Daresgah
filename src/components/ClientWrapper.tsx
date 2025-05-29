'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

const publicPaths = ['/login', '/register']

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && mounted) {
      // If user is not authenticated and trying to access protected route
      if (!user && !publicPaths.includes(pathname)) {
        router.push('/login')
        return
      }

      // If user is authenticated and trying to access public route
      if (user && publicPaths.includes(pathname)) {
        // Redirect to appropriate dashboard based on role
        switch (role) {
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
        return
      }

      // If user is authenticated and on root path
      if (user && pathname === '/') {
        switch (role) {
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
      }
    }
  }, [user, role, loading, router, pathname, mounted])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return <>{children}</>
} 