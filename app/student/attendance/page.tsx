'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { motion } from 'framer-motion'
import { CalendarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface AttendanceRecord {
  id: string
  date: string
  status: 'present' | 'absent' | 'late'
  subject: string
  remarks: string
}

interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  percentage: number
}

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get start and end dates for the selected month
        const [year, month] = selectedMonth.split('-')
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString()
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString()

        // Fetch attendance records
        const { data: attendanceData, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false })

        if (error) throw error

        if (attendanceData) {
          const typedAttendanceData = attendanceData as AttendanceRecord[]
          setAttendance(typedAttendanceData)

          // Calculate stats
          const total = typedAttendanceData.length
          const present = typedAttendanceData.filter((a: AttendanceRecord) => a.status === 'present').length
          const absent = typedAttendanceData.filter((a: AttendanceRecord) => a.status === 'absent').length
          const late = typedAttendanceData.filter((a: AttendanceRecord) => a.status === 'late').length
          const percentage = total > 0 ? (present / total) * 100 : 0

          setStats({
            total,
            present,
            absent,
            late,
            percentage
          })
        }
      } catch (error) {
        console.error('Error fetching attendance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [selectedMonth])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'late':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Record</h1>
        <div className="flex space-x-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-indigo-500">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.present}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500">
              <XCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.absent}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.percentage.toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 