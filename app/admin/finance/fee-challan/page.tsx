/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../src/lib/supabase'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { 
  FiPlus,
  FiX,
  FiTrash2
} from 'react-icons/fi'

interface Student {
  id: string
  name: string
  grade: string
  base_fee: number
}

interface FeeChallan {
  id?: string
  student_id: string
  amount: number
  base_fee: number
  fine_amount: number
  fine_reason: string
  due_date: string
  status: 'pending' | 'paid'
  student?: Student
}

export default function FeeChallanPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState('Grade 9')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feeChallans, setFeeChallans] = useState<FeeChallan[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [showFineFields, setShowFineFields] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form state
  const [feeAmount, setFeeAmount] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [fineAmount, setFineAmount] = useState(0)
  const [fineReason, setFineReason] = useState('')

  useEffect(() => {
    fetchStudents()
    getCurrentUser()
    fetchFeeChallans()
  }, [selectedGrade])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser(user.id)
    }
  }

  const fetchFeeChallans = async () => {
    try {
      // First, fetch fee challans
      const { data: challans, error: challansError } = await supabase
        .from('fee_challans')
        .select('*')
        .order('due_date', { ascending: false });

      if (challansError) throw challansError;

      // Then fetch all related students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .in('id', challans.map(challan => challan.student_id));

      if (studentsError) throw studentsError;

      // Combine the data
      const combinedData = challans.map(challan => ({
        ...challan,
        student: studentsData.find(student => student.id === challan.student_id)
      }));

      setFeeChallans(combinedData || []);
    } catch (error) {
      console.error('Error fetching fee challans:', error)
      toast.error('Failed to fetch fee challans')
    }
  }

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, grade, base_fee')
        .eq('grade', selectedGrade.replace('Grade ', ''))
        .order('name', { ascending: true })

      if (error) throw error

      const transformedData = (data || []).map(student => ({
        ...student,
        base_fee: student.base_fee || 0
      }))

      setStudents(transformedData)
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to fetch students')
    }
  }

  const handleSubmit = async () => {
    try {
      if (!currentUser) {
        toast.error('User not authenticated')
        return
      }

      if (!selectedStudent || !dueDate || !feeAmount) {
        toast.error('Please fill in all required fields')
        return
      }

      setIsSubmitting(true)
      
      // Verify student exists in database before proceeding
      const { data: studentCheck, error: studentCheckError } = await supabase
        .from('students')
        .select('id, name, base_fee')
        .eq('id', selectedStudent)
        .single()

      if (studentCheckError || !studentCheck) {
        console.error('Student verification failed:', studentCheckError)
        toast.error('Selected student not found in database')
        setIsSubmitting(false)
        return
      }

      const newChallan = {
        student_id: studentCheck.id, // Use verified student ID
        amount: feeAmount,
        base_fee: studentCheck.base_fee,
        fine_amount: fineAmount || 0,
        fine_reason: fineReason || '',
        due_date: dueDate,
        status: 'pending',
        generated_by: currentUser,
        generated_date: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('fee_challans')
        .insert(newChallan)
        .select()

      if (insertError) {
        console.error('Fee challan insertion error:', insertError)
        throw insertError
      }
      
      toast.success('Fee challan generated successfully!')
      setIsModalOpen(false)
      resetForm()
      fetchFeeChallans()

    } catch (error) {
      console.error('Error generating fee challan:', error)
      toast.error('Failed to generate fee challan. Please verify student information.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedStudent('')
    setFeeAmount(0)
    setDueDate('')
    setFineAmount(0)
    setFineReason('')
    setShowFineFields(false)
  }

  const handleDelete = async (challanId: string) => {
    try {
      setIsDeleting(true)
      console.log('Attempting to delete challan with ID:', challanId)

      // Direct deletion without checking first
      const { error: deleteError, data: deleteData } = await supabase
        .from('fee_challans')
        .delete()
        .match({ id: challanId }) // Using match instead of eq
        .select()

      if (deleteError) {
        console.error('Delete error:', deleteError)
        toast.error(`Delete failed: ${deleteError.message}`)
        return
      }

      console.log('Delete response:', deleteData)
      
      // Only show success and refresh if we actually deleted something
      if (deleteData && deleteData.length > 0) {
        toast.success('Fee challan deleted successfully')
        await fetchFeeChallans() // Refresh the list after deletion
      } else {
        toast.error('No fee challan found with that ID')
      }

    } catch (error) {
      console.error('Error in delete operation:', error)
      toast.error('Failed to delete fee challan')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap justify-between items-center"
      >
        <div>
          <h1 className="md:text-3xl sm:text-xl text-sm font-bold text-black">Fee Challan Generation</h1>
          <p className="mt-1 text-gray-800">Generate and manage fee challans</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600  to-purple-600 mt-2 sm:mt-0 text-white sm:px-4 sm:py-2 px-3 py-1 rounded-lg flex items-center hover:bg-indigo-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Fee Challan
        </button>
      </motion.div>

      {/* Fee Challans Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-black mb-4">Generated Fee Challans</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Fine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeChallans.map((challan) => (
                  <tr key={challan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{challan.student?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">Rs. {challan.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(challan.due_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        challan.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {challan.status.charAt(0).toUpperCase() + challan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {challan.fine_amount > 0 ? `Rs. ${challan.fine_amount} - ${challan.fine_reason}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (!challan.id) {
                            toast.error('Invalid challan ID')
                            return
                          }
                          console.log('Challan to delete:', challan) // Add this log
                          if (window.confirm('Are you sure you want to delete this fee challan?')) {
                            handleDelete(challan.id)
                          }
                        }}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Fee Challan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Fee Challan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={`Grade ${i+1}`} value={`Grade ${i+1}`}>
                      Grade {i+1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount</label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter fee amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Fine (Optional)</h3>
                  <button
                    type="button"
                    onClick={() => setShowFineFields(!showFineFields)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    {showFineFields ? 'Hide Fine Fields' : 'Add Fine'}
                  </button>
                </div>
                
                {showFineFields && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fine Amount</label>
                      <input
                        type="number"
                        value={fineAmount}
                        onChange={(e) => setFineAmount(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Enter fine amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fine Reason</label>
                      <input
                        type="text"
                        value={fineReason}
                        onChange={(e) => setFineReason(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Enter reason for fine"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating...' : 'Generate Fee Challan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 