/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiUser, 
  FiDollarSign, 
  FiGift, 
  FiCheckCircle, 
  FiClock,
  FiCalendar,
  FiX,
  FiPlus,
  FiLoader
} from 'react-icons/fi'
import { FaChalkboardTeacher } from 'react-icons/fa'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Teacher {
  id: string
  name: string
  email: string
}

interface SalaryRecord {
  id: string
  teacher_id: string
  teachers: {
    name: string
    email: string
  }
  amount: number
  bonus_amount: number
  bonus_description: string
  status: 'pending' | 'confirmed'
  sent_by: string | null
  sent_date: string
  confirmed_date: string | null
}

export default function TeacherSalaryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [amount, setAmount] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [showBonus, setShowBonus] = useState(false)
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusDescription, setBonusDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTeachers()
    fetchSalaryRecords()
  }, [])

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, email')

      if (error) {
        console.error('Error fetching teachers:', error)
        toast.error('Failed to load teachers')
        return
      }

      if (!data || data.length === 0) {
        console.log('No teachers found in the database')
        toast.error('No teachers found')
        return
      }

      setTeachers(data)
    } catch (err) {
      console.error('Unexpected error fetching teachers:', err)
      toast.error('Failed to load teachers')
    }
  }

  const fetchSalaryRecords = async () => {
    const { data, error } = await supabase
      .from('teacher_salaries')
      .select(`
        *,
        teachers!teacher_salaries_teacher_id_fkey(name, email)
      `)
      .order('sent_date', { ascending: false })
    if (data && !error) setSalaryRecords(data)
  }

  const sendTeacherSalary = async () => {
    if (!selectedTeacher || !amount || !selectedMonth) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setLoading(true)
    
    try {
      const newSalaryRecord = {
        teacher_id: selectedTeacher.id,
        amount: parseFloat(amount),
        month: selectedMonth,
        bonus_amount: showBonus ? parseFloat(bonusAmount || '0') : 0,
        bonus_description: showBonus ? bonusDescription : '',
        status: 'pending',
        sent_by: null,
        sent_date: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('teacher_salaries')
        .insert([newSalaryRecord])
        .select()

      if (error) {
        console.error('Error details:', error)
        toast.error(`Failed to send salary: ${error.message}`)
        return
      }

      toast.success(`Salary of Rs. ${amount} sent successfully to ${selectedTeacher.name} for ${selectedMonth}`)
      
      if (showBonus && bonusAmount) {
        toast.success(`Bonus of Rs. ${bonusAmount} also included`)
      }
      
      setIsModalOpen(false)
      resetForm()
      fetchSalaryRecords()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedTeacher(null)
    setAmount('')
    setSelectedMonth('')
    setShowBonus(false)
    setBonusAmount('')
    setBonusDescription('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const generateMonthOptions = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentYearShort = String(currentYear).slice(-2);
    const lastYearShort = String(currentYear - 1).slice(-2);
    
    const options = [];
    
    for (let i = 0; i <= currentDate.getMonth(); i++) {
      options.unshift(`${months[i]}-${currentYearShort}`);
    }
    
    for (let i = 11; i > currentDate.getMonth(); i--) {
      options.unshift(`${months[i]}-${lastYearShort}`);
    }
    
    return options;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-6"
    >
      <div className="flex flex-wrap justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:text-3xl sm:text-xl text-sm font-bold text-gray-900 dark:text-white flex items-center gap-3"
        >
          <FaChalkboardTeacher className="text-indigo-600" size={28} />
          Teacher Salary Management
        </motion.h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600  to-purple-600 mt-2 sm:mt-0 text-white sm:px-6 sm:py-3 px-3 py-2 rounded-lg shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <FiPlus />
          Send Salary
        </motion.button>
      </div>

      {/* Salary Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiUser />
                    Teacher
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiDollarSign />
                    Amount
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiGift />
                    Bonus
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiCalendar />
                    Sent Date
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Confirmed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {salaryRecords.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <FiUser className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.teachers?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.teachers?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    Rs. {record.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.bonus_amount > 0 ? (
                      <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-lg">
                        <div className="font-semibold text-green-700 dark:text-green-300">
                          Rs. {record.bonus_amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-200">
                          {record.bonus_description}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      record.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                    }`}>
                      {record.status === 'confirmed' ? (
                        <span className="flex items-center gap-1">
                          <FiCheckCircle /> Confirmed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <FiClock /> Pending
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(record.sent_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {record.confirmed_date ? formatDate(record.confirmed_date) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </motion.tr>
              ))}
              {salaryRecords.length === 0 && (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FiDollarSign className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">No salary records yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Send your first salary to get started
                      </p>
                    </div>
                  </td>
                </motion.tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Send Salary Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send Salary</h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teacher
                  </label>
                  <select
                    className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedTeacher?.id || ''}
                    onChange={(e) => setSelectedTeacher(teachers.find(t => t.id === e.target.value) || null)}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Month
                  </label>
                  <select
                    className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    required
                  >
                    <option value="">Select Month</option>
                    {generateMonthOptions().map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salary Amount (Rs.)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      Rs.
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-12 p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showBonus"
                    checked={showBonus}
                    onChange={(e) => setShowBonus(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showBonus" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Add Bonus
                  </label>
                </div>

                {showBonus && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bonus Amount (Rs.)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          Rs.
                        </span>
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full pl-12 p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={bonusAmount}
                          onChange={(e) => setBonusAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bonus Description
                      </label>
                      <textarea
                        placeholder="Reason for bonus"
                        rows={3}
                        className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={bonusDescription}
                        onChange={(e) => setBonusDescription(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setIsModalOpen(false)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={sendTeacherSalary}
                    disabled={loading || !selectedTeacher || !amount || !selectedMonth}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiDollarSign />
                        Send Salary
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}