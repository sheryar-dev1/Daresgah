/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { AuthError, User, Session, PostgrestError } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface AuthResponse {
  data: {
    user: User | null
    session: Session | null
  } | null
  error: AuthError | null
}

interface RoleResponse {
  data: { role: string } | null
  error: PostgrestError | null
}

interface RegistrationResponse {
  data: { status: string } | null
  error: PostgrestError | null
}

interface InsertResponse {
  error: PostgrestError | null
}

// Helper function to retry failed requests
const retryOperation = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  throw lastError
}

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if it's the admin user
      if (email === 'admin@daresgah.com') {
        const { data: adminData, error: adminError } = await retryOperation<AuthResponse>(() => 
          supabaseAdmin.auth.signInWithPassword({
            email,
            password,
          })
        )

        if (adminError) throw adminError

        // Check if admin role exists
        const { data: roleData, error: roleError } = await retryOperation<RoleResponse>(async () => {
          const response = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', adminData?.user?.id)
            .single()
          return response
        })

        if (roleError || !roleData) {
          // Create admin role if it doesn't exist
          await retryOperation<InsertResponse>(async () => {
            const response = await supabaseAdmin
              .from('user_roles')
              .insert([{ user_id: adminData?.user?.id, role: 'admin' }])
            return response
          })
        }

        toast.success('Admin login successful!', {
          icon: '👋',
          style: {
            borderRadius: '10px',
            background: '#4CAF50',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
          }
        })
        router.push('/admin/teachers')
        return
      }

      // Regular user login with retry
      const { data, error } = await retryOperation<AuthResponse>(() =>
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      )

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before logging in')
        } else {
          throw error
        }
      }

      if (!data?.user) {
        throw new Error('Login failed. Please try again.')
      }

      // First check if user exists in student_registrations
      const { data: registrationData } = await retryOperation<RegistrationResponse>(async () => {
        const response = await supabase
          .from('student_registrations')
          .select('status')
          .eq('user_id', data.user?.id)
          .single()
        return response
      })

      // Get user role with retry
      let { data: roleData } = await retryOperation<RoleResponse>(async () => {
        const response = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user?.id)
          .single()
        return response
      })

      // Handle different scenarios
      if (!roleData && !registrationData) {
        // If neither role nor registration exists, create a basic role
        const { error: insertError } = await retryOperation<InsertResponse>(async () => {
          const response = await supabase
            .from('user_roles')
            .upsert([{ user_id: data.user?.id, role: 'student' }], {
              onConflict: 'user_id,role',
              ignoreDuplicates: true
            })
          return response
        })
        
        if (insertError) throw insertError
        
        roleData = { role: 'student' }
      } else if (!roleData && registrationData) {
        // If registration exists but no role, create role based on status
        const role = registrationData.status === 'approved' ? 'student' : 'pending'
        const { error: insertError } = await retryOperation<InsertResponse>(async () => {
          const response = await supabase
            .from('user_roles')
            .upsert([{ user_id: data.user?.id, role }], {
              onConflict: 'user_id,role',
              ignoreDuplicates: true
            })
          return response
        })
        
        if (insertError) throw insertError
        
        roleData = { role }
      }

      if (!roleData) {
        throw new Error('Failed to create or retrieve user role')
      }

      // Success toast with role-specific message
      let welcomeMessage = 'Login successful!'
      let redirectPath = '/'
      
      switch (roleData.role) {
        case 'admin':
          welcomeMessage = 'Welcome back, Admin!'
          redirectPath = '/admin/teachers'
          break
        case 'teacher':
          welcomeMessage = 'Welcome back, Teacher!'
          redirectPath = '/teacher'
          break
        case 'student':
          // Check if student registration is pending
          if (registrationData?.status === 'pending') {
            welcomeMessage = 'Your registration is pending approval'
            redirectPath = '/pending'
          } else {
            welcomeMessage = 'Welcome back, Student!'
            redirectPath = '/student'
          }
          break
        case 'parent':
          welcomeMessage = 'Welcome back, Parent!'
          redirectPath = '/parent'
          break
        case 'pending':
          welcomeMessage = 'Your registration is pending approval'
          redirectPath = '/pending'
          break
        default:
          throw new Error('Invalid role found')
      }

      toast.success(welcomeMessage, {
        icon: '👋',
        style: {
          borderRadius: '10px',
          background: '#4CAF50',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
        }
      })

      router.push(redirectPath)
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed. Please check your credentials.', {
        style: {
          borderRadius: '10px',
          background: '#F44336',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.h2 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
          >
            Welcome Back
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-sm text-gray-600"
          >
            Sign in to access your personalized dashboard
          </motion.p>
        </div>

        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100"
          onSubmit={handleLogin}
        >
          <div className="space-y-5">
            {/* Email Input */}
            <motion.div 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative group"
            >
              <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full pl-10 text-black pr-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 placeholder-gray-400"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </motion.div>

            {/* Password Input */}
            <motion.div 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="relative group"
            >
              <LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="w-full text-black pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 placeholder-gray-400"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </motion.div>

            {/* Forgot Password Link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-right"
            >
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/forgot-password')
                }}
              >
                Forgot password?
              </Link>
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer py-3 px-4 inline-flex justify-center items-center gap-2 rounded-lg border border-transparent font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 group"
            >
              {loading ? (
                <>
                  <svg 
                    className="animate-spin h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRightIcon className="h-5 w-5 text-white transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </motion.div>

          {/* Registration Link */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center pt-6 border-t border-gray-200"
          >
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1 group"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/register')
                }}
              >
                Create account
                <ArrowRightIcon className="h-4 w-4 mt-0.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </p>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}