/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { motion } from 'framer-motion'
import { CreditCardIcon, DocumentTextIcon, CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface FeeRecord {
  id: string
  amount: number
  due_date: string
  status: 'paid' | 'pending' | 'overdue'
  payment_date?: string
  payment_method?: string
  description: string
  paid?: number
  month: string
}

interface FeeStats {
  total: number
  paid: number
  pending: number
  overdue: number
}

export default function StudentFees() {
  const router = useRouter()
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [stats, setStats] = useState<FeeStats>({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchFees = async () => {
    try {
      setRefreshing(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // First get student_id from students table
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (studentError) {
        console.error('Error fetching student data:', studentError)
        toast.error('Error fetching student information')
        return
      }

      if (!studentData) {
        toast.error('Student record not found')
        return
      }

      // Now fetch fees using student_id
      const { data: feesData, error } = await supabase
        .from('fee_challans')
        .select('*')
        .eq('student_id', studentData.id)
        .order('due_date', { ascending: false })

      if (error) throw error

      if (feesData) {
        // Transform the data to include formatted month
        const typedFeesData = feesData.map(fee => ({
          ...fee,
          month: new Date(fee.due_date).toLocaleString('en-US', { 
            month: 'long',
            year: 'numeric'
          })
        })) as FeeRecord[]
        
        setFees(typedFeesData)

        // Calculate stats
        const total = typedFeesData.reduce((sum, fee) => sum + fee.amount, 0)
        const paid = typedFeesData
          .filter(fee => fee.status === 'paid')
          .reduce((sum, fee) => sum + (fee.paid || fee.amount), 0)
        const pending = typedFeesData
          .filter(fee => fee.status === 'pending')
          .reduce((sum, fee) => sum + (fee.amount - (fee.paid || 0)), 0)
        const overdue = typedFeesData
          .filter(fee => fee.status === 'overdue')
          .reduce((sum, fee) => sum + (fee.amount - (fee.paid || 0)), 0)

        setStats({
          total,
          paid,
          pending,
          overdue
        })
      }
    } catch (error) {
      console.error('Error fetching fees:', error)
      toast.error('Error fetching fee information')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchFees()
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'pending':
        return <ArrowPathIcon className="w-5 h-5 text-yellow-500 animate-spin" />
      case 'overdue':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-indigo-600 font-medium">Loading your fee details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
            <p className="text-gray-600 mt-1">View and manage your fee payments</p>
          </div>
          <button
            onClick={fetchFees}
            disabled={refreshing}
            className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Fee Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-100">
                  <CreditCardIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Fees 50PROMO</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.total)}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-gray-100 rounded-full">
                <div className="h-1 bg-indigo-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Paid Amount</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.paid)}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-gray-100 rounded-full">
                <div 
                  className="h-1 bg-green-500 rounded-full" 
                  style={{ width: `${stats.total ? (stats.paid / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <DocumentTextIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Amount</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.pending)}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-gray-100 rounded-full">
                <div 
                  className="h-1 bg-yellow-500 rounded-full" 
                  style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-100">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Overdue Amount</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.overdue)}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-gray-100 rounded-full">
                <div 
                  className="h-1 bg-red-500 rounded-full" 
                  style={{ width: `${stats.total ? (stats.overdue / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Fee List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.month}</td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.description}</td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(fee.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(fee.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                          {getStatusIcon(fee.status)}
                          <span className="ml-1">{fee.status.toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => router.push(`/student/fees/${fee.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}