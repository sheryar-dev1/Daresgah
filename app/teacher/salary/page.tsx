'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useAuth } from '../../../src/context/AuthContext'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiClock, FiDollarSign, FiFilter, FiInfo } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

interface SalaryRecord {
  id: string
  amount: number
  bonus_amount: number
  bonus_description: string | null
  status: 'pending' | 'confirmed'
  sent_date: string
  confirmed_date: string | null
}

export default function Page() {
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all')
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchSalaryRecords()
    }
  }, [user])

  const fetchSalaryRecords = async () => {
    try {
      setLoading(true)
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (teacherError) throw teacherError

      const { data, error } = await supabase
        .from('teacher_salaries')
        .select('*')
        .eq('teacher_id', teacherData.id)
        .order('sent_date', { ascending: false })

      if (error) throw error

      setSalaryRecords(data || [])
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to fetch salary records')
    } finally {
      setLoading(false)
    }
  }

  const confirmSalary = async (salaryId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_salaries')
        .update({
          status: 'confirmed',
          confirmed_date: new Date().toISOString()
        })
        .eq('id', salaryId)

      if (error) throw error

      toast.success('Salary confirmed successfully')
      fetchSalaryRecords()
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to confirm salary')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const filteredRecords = salaryRecords.filter(record => {
    if (filter === 'all') return true
    return record.status === filter
  })

  const totalAmount = filteredRecords.reduce((sum, record) => sum + record.amount, 0)
  const totalBonus = filteredRecords.reduce((sum, record) => sum + record.bonus_amount, 0)

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center min-h-screen"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            transition: { 
              repeat: Infinity, 
              duration: 1,
              ease: "linear"
            }
          }}
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"
        ></motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 max-w-7xl mx-auto"
    >
      <div className="mb-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Salary Records</h1>
            <p className="text-gray-600">View and manage your salary payments</p>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    transition: { duration: 1 }
                  }}
                  className="p-2 rounded-full bg-indigo-50 text-indigo-600"
                >
                  <FiDollarSign size={20} />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-500">Total Salaries</p>
                  <p className="font-semibold text-gray-800">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="p-2 rounded-full bg-green-50 text-green-600"
                >
                  <FiCheckCircle size={20} />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-500">Total Bonus</p>
                  <p className="font-semibold text-gray-800">{formatCurrency(totalBonus)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{
                    scale: [1, 1.05, 1],
                    transition: { repeat: Infinity, duration: 2 }
                  }}
                  className="p-2 rounded-full bg-blue-50 text-blue-600"
                >
                  <FiClock size={20} />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-500">Records</p>
                  <p className="font-semibold text-gray-800">{filteredRecords.length}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Filter Controls */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3 mb-6 items-center"
        >
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiFilter size={16} />
            <span>Filter by:</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Records
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-1 ${
              filter === 'pending'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiClock size={14} />
            Pending
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-1 ${
              filter === 'confirmed'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiCheckCircle size={14} />
            Confirmed
          </motion.button>
        </motion.div>

        {/* Salary Records */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y overflow-hidden divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bonus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredRecords.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="flex flex-col items-center justify-center text-gray-400"
                        >
                          <FiInfo size={32} className="mb-2" />
                          <p>No salary records found</p>
                          <p className="text-sm mt-1">When available, your salary records will appear here</p>
                        </motion.div>
                      </td>
                    </motion.tr>
                  ) : (
                    filteredRecords.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        className="hover:bg-gray-50 transition-all"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatDate(record.sent_date)}</div>
                          {record.confirmed_date && (
                            <div className="text-xs text-gray-500">
                              Confirmed: {formatDate(record.confirmed_date)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(record.amount)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm text-gray-900">
                              {record.bonus_amount > 0 ? formatCurrency(record.bonus_amount) : '-'}
                            </div>
                            {record.bonus_description && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                {record.bonus_description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="text-sm font-semibold text-gray-900"
                          >
                            {formatCurrency(record.amount + record.bonus_amount)}
                          </motion.div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                record.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {record.status === 'confirmed' ? (
                                <span className="flex items-center gap-1">
                                  <FiCheckCircle size={12} />
                                  Confirmed
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <FiClock size={12} />
                                  Pending
                                </span>
                              )}
                            </motion.span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {record.status === 'pending' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => confirmSalary(record.id)}
                              className="text-indigo-600 hover:text-indigo-900 font-medium px-3 py-1 rounded-md hover:bg-indigo-50 transition-colors cursor-pointer "
                            >
                              Confirm Receipt
                            </motion.button>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}











